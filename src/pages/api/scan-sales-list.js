// src/pages/api/scan-sales-list.js
import { GoogleGenAI } from '@google/genai';

export const config = {
    maxDuration: 60,
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

// Universal parser: parses pipe-separated lines, markdown tables, or JSON
function parseOcrOutput(rawText) {
    let clean = (rawText || '').trim();
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    // 1. Try JSON if wrapped in an array or object
    try {
        const parsed = JSON.parse(clean);
        const arr = Array.isArray(parsed) ? parsed : (parsed.sales || parsed.items || parsed.rows || parsed.data || []);
        if (arr.length > 0) {
            return arr.map(item => ({
                name: (item.name || item.customer_name || 'Walk-in').trim(),
                qty: Math.max(1, parseInt(item.qty || item.quantity || 1, 10)),
                total: parseFloat(item.total || item.total_amount || 0),
                pd: item.pd !== false
            }));
        }
    } catch {
        // Fall back to line-by-line parsing
    }

    // 2. Line-by-line parser (handles "Name | Qty | Total | pd" and Markdown tables)
    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];

    for (const line of lines) {
        if (/^[\|\s\-:]+$/.test(line)) continue;

        let parts = [];
        if (line.includes('|')) {
            const stripped = line.replace(/^\|/, '').replace(/\|$/, '');
            parts = stripped.split('|').map(p => p.trim());
        } else if (line.includes('\t')) {
            parts = line.split('\t').map(p => p.trim());
        } else if (line.includes(',')) {
            parts = line.split(',').map(p => p.trim());
        }

        if (parts.length >= 3) {
            const rawName = parts[0];
            if (/^(customer|name|item|qty|total|price)$/i.test(rawName)) continue;

            const qMatch = parts[1].match(/\d+/);
            const tMatch = parts[2].match(/[\d\.]+/);

            if (qMatch && tMatch) {
                const qty = parseInt(qMatch[0], 10);
                const total = parseFloat(tMatch[0]);
                const isPaid = parts.length < 4 || !/utang|credit|unpaid/i.test(parts[3]);

                results.push({
                    name: rawName || 'Walk-in',
                    qty: qty || 1,
                    total: total || 0,
                    pd: isPaid
                });
            }
        }
    }

    if (results.length > 0) return results;

    throw new Error('Could not detect readable sales rows. Please ensure the paper is well-lit.');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured.' });
    }

    try {
        const { imageBase64, mimeType = 'image/jpeg', products = [] } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'Missing image data' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
You are a high-speed handwriting OCR engine for a Philippine water refilling station delivery log.
Transcribe every line written on this page from top to bottom.

Output each row on a single line separated by pipes (|) in this exact format:
Customer Name | Quantity | Total Amount | Paid Status

Example output:
Danny | 2 | 50 | pd
Gaslin | 11 | 220 | pd
Ramos | 12 | 240 | pd

Rules:
1. Scan the whole page from the first line down to the blank bottom.
2. If a row has quantity/total but no customer name written on the left, output "Walk-in".
3. Right column: write "pd" if marked pd or paid, otherwise "unpaid".
4. Output ONLY the lines with pipes. No intro, no markdown codeblocks, no explanations.
`;

        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        let response = null;

        // Try gemini-2.5-flash (1,500 RPD free tier); fallback to gemini-3.1-flash-lite
        try {
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType, data: cleanBase64 } }
                        ]
                    }
                ],
                config: { temperature: 0.1, maxOutputTokens: 2500 }
            });
        } catch (err) {
            console.warn('gemini-2.5-flash error, falling back to gemini-3.1-flash-lite:', err.message);
            response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType, data: cleanBase64 } }
                        ]
                    }
                ],
                config: { temperature: 0.1, maxOutputTokens: 2500 }
            });
        }

        const rawText = response.text || '';
        const rawRows = parseOcrOutput(rawText);

        // Match unit prices and catalog products
        const safeData = rawRows.map(row => {
            const rawName = (row.name || '').trim();
            const customerName = rawName ? rawName : 'Walk-in';
            const qty = Math.max(1, Number(row.qty) || 1);
            const total = Number(row.total) || 0;
            const unitPrice = total > 0 ? total / qty : 0;

            let matchedProduct = null;
            if (unitPrice > 0 && products.length > 0) {
                matchedProduct = products.find(p => Math.abs(Number(p.price) - unitPrice) < 0.01);

                if (!matchedProduct) {
                    const refillProducts = products.filter(p => (p.name || '').toLowerCase().includes('refill'));
                    const candidates = refillProducts.length > 0 ? refillProducts : products;
                    matchedProduct = candidates.reduce((prev, curr) => {
                        return Math.abs(Number(curr.price) - unitPrice) < Math.abs(Number(prev.price) - unitPrice) ? curr : prev;
                    });
                }
            }

            if (!matchedProduct && products.length > 0) {
                matchedProduct = products.find(p => (p.name || '').toLowerCase().includes('refill')) || products[0];
            }

            const finalPrice = matchedProduct ? Number(matchedProduct.price) : (unitPrice || 20);
            const finalTotal = total > 0 ? total : (qty * finalPrice);

            return {
                customer_name: customerName,
                product_id: matchedProduct?.id || null,
                product_name: matchedProduct?.name || 'Water Refill',
                quantity: qty,
                unit_price: finalPrice,
                total_amount: finalTotal,
                payment_method: row.pd === false ? 'Credit' : 'Cash'
            };
        });

        return res.status(200).json({ success: true, data: safeData });
    } catch (err) {
        console.error('Scan sales list error:', err);
        return res.status(500).json({ error: err.message || 'Failed to analyze sales image' });
    }
}