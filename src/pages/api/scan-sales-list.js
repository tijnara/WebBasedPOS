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
                name: (item.name || item.customer_name || '').trim(),
                qty: Math.max(1, parseInt(item.qty || item.quantity || 1, 10)),
                total: parseFloat(item.total || item.total_amount || 0),
                pd: item.pd !== false
            })).filter(r => r.name && !/^(date|feb|jan|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(r.name));
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

            // Ignore table headers and date titles (e.g., "Feb 13", "Feb 03", "Feb 10")
            if (/^(customer|name|item|qty|total|price|status)$/i.test(rawName)) continue;
            if (/^(date|feb|jan|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(rawName)) continue;

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

    // Guard against phantom first-row "Walk-in" if the second row is the actual first customer
    if (results.length > 1 && results[0].name.toLowerCase() === 'walk-in' && results[1].name.toLowerCase() !== 'walk-in') {
        // If there's a phantom Walk-in at row 0, merge or remove the ghost header row
        results.shift();
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
You are an expert handwriting transcriber for a Philippine water refilling station delivery notebook.
Look at this notebook page.

COLUMN STRUCTURE:
- Left Column: Ordered list of customer names written from top to bottom.
- Middle Column: Quantity of water containers.
- Right Column: Total price in Pesos.
- Far Right Column: Payment indicator ("pd" = paid).

CRITICAL INSTRUCTIONS TO PREVENT ROW SHIFTING:
1. DATE HEADER IS NOT A TRANSACTION:
   - At the top, text like "Feb 13" is ONLY the date of the notebook page. Completely ignore it.
   - DO NOT create a transaction row for the date header.

2. DO NOT INVENT A "Walk-in" ROW AT THE TOP:
   - The first numbers on the right (e.g., "2" and "50") belong to the FIRST customer name written on the left (e.g., "Danny").
   - Even if the first numbers sit slightly higher on the paper than the word "Danny", they are part of Danny's order.
   - Row 1 MUST BE the first customer name (e.g., "Danny | 2 | 50 | pd").
   - NEVER start the list with "Walk-in".

3. SEQUENTIAL 1-TO-1 COLUMN PAIRING:
   Match the N-th customer name on the left with the N-th quantity/total on the right:
   - 1st customer (e.g., Danny) -> 1st numbers (2, 50, pd)
   - 2nd customer (e.g., Gaslin) -> 2nd numbers (11, 220, pd)
   - 3rd customer (e.g., Ramos) -> 3rd numbers (12, 240, pd)
   - 4th customer (e.g., JCA) -> 4th numbers (5, 100, pd)
   - 5th customer (e.g., Myra) -> 5th numbers (8, 160, pd)
   - 6th customer (e.g., Japon) -> 6th numbers (12, 240, pd)
   - 7th customer (e.g., Coria) -> 7th numbers (1, 20, pd)
   - 8th customer (e.g., Doro) -> 8th numbers (9, 180, pd)
   - 9th customer (e.g., Isidra) -> 9th numbers (5, 100, pd)
   - 10th customer (e.g., Medy) -> 10th numbers (5, 100, pd)
   - 11th customer (e.g., Cecila) -> 11th numbers (3, 60, pd)

4. OUTPUT FORMAT:
   Return ONLY lines separated by pipes (|) in this exact format:
   Customer Name | Quantity | Total Amount | Paid Status

   Do NOT include conversational text, notes, or markdown formatting.
`;

        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const response = await ai.models.generateContent({
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
            config: {
                temperature: 0.1,
                maxOutputTokens: 2500
            }
        });

        const rawText = response.text || '';
        const rawRows = parseOcrOutput(rawText);

        // Match unit prices and catalog products
        const safeData = rawRows.map(row => {
            const rawName = (row.name || '').trim();
            const customerName = rawName || 'Walk-in';
            const qty = Math.max(1, Number(row.qty) || 1);
            const total = Number(row.total) || 0;
            const unitPrice = total > 0 ? total / qty : 0;

            let matchedProduct = null;
            if (unitPrice > 0 && products.length > 0) {
                // 1. Exact price match
                matchedProduct = products.find(p => Math.abs(Number(p.price) - unitPrice) < 0.01);

                // 2. Nearest price match among Refills
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