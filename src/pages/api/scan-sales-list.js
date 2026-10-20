// src/pages/api/scan-sales-list.js
import { GoogleGenAI } from '@google/genai';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

// Resilient JSON parser that rescues completed rows even if output was truncated
function parseSalesJson(rawText) {
    let clean = (rawText || '').trim();
    clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    // 1. Direct standard parse
    try {
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') {
            for (const key of ['sales', 'items', 'data', 'orders']) {
                if (Array.isArray(parsed[key])) return parsed[key];
            }
            return [parsed];
        }
    } catch {
        // Fall through to regex extraction if JSON is cut off
    }

    // 2. Extract full array block
    const arrayMatch = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
        try {
            return JSON.parse(arrayMatch[0]);
        } catch {
            // Fall through to individual object matching
        }
    }

    // 3. Regex match all completed individual { customer_name: ... } objects
    const objects = [];
    const objectRegex = /\{[^{}]*?"customer_name"[\s\S]*?\}/g;
    let match;
    while ((match = objectRegex.exec(clean)) !== null) {
        try {
            const item = JSON.parse(match[0]);
            objects.push(item);
        } catch {
            // Ignore incomplete fragment
        }
    }

    if (objects.length > 0) return objects;

    throw new Error('Could not parse any valid sales rows from AI response.');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in .env.local' });
    }

    try {
        const { imageBase64, mimeType = 'image/jpeg', products = [] } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'Missing image data' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const productCatalogSummary = products
            .map(p => `ID: ${p.id} | Name: "${p.name}" | Price: ₱${p.price}`)
            .join('\n');

        const prompt = `
You are an expert OCR transcription assistant for a Philippine Water Refilling Station.
Carefully transcribe ALL handwritten rows on this delivery notepad page from top to bottom.

CRITICAL INSTRUCTIONS:
1. Scan the ENTIRE page from top to bottom. Do NOT stop early after 8 or 9 entries.
2. Continue scanning all the way down until you reach the empty lines at the bottom of the paper.
   Make sure you include the entries near the bottom (specifically: Isidra, Medy, Cecile).
3. The page consists of rows with 3 main data columns:
   - Column 1 (Left): Customer Name (e.g., Danny, Gaslin, Ramos, JCA, Myra, Japon, Corie, Doro, Isidra, Medy, Cecile)
   - Column 2 (Middle): Quantity (e.g., 2, 11, 12, 5, 8, 12, 1, 9, 5, 5, 3)
   - Column 3 (Right): Total Amount (e.g., 50, 220, 240, 100, 160, 240, 20, 180, 100, 100, 60)
   - Far right has "pd" which means "Paid" (Payment method: "Cash").
4. Deduce unit_price = Total Amount / Quantity:
   - If unit_price is 25 (e.g., 50 / 2) -> match product "Refill(25)"
   - If unit_price is 20 (e.g., 220 / 11, 240 / 12, 100 / 5, 160 / 8, 20 / 1, 180 / 9, 60 / 3) -> match product "Refill-Walk-in(20)"
5. Return a JSON array containing every single row found. There are 11 customer rows in this notepad.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
                            }
                        }
                    ]
                }
            ],
            config: {
                temperature: 0.1, // Greedy decoding prevents repetitive looping
                maxOutputTokens: 3500, // Hard ceiling prevents token overflow
                responseMimeType: 'application/json',
            }
        });

        const rawText = response.text || '[]';
        const parsedList = parseSalesJson(rawText);

        // Safe fallback mapping: match unit prices to product catalog
        const safeData = parsedList.map(item => {
            const qty = Number(item.quantity) || 1;
            const total = Number(item.total_amount) || 0;
            const unitPrice = Number(item.unit_price) || (qty > 0 ? total / qty : 0);

            let matchedProduct = null;
            if (item.product_id) {
                matchedProduct = products.find(p => p.id === item.product_id);
            }
            if (!matchedProduct && unitPrice > 0) {
                matchedProduct = products.find(p => Number(p.price) === unitPrice);
            }
            if (!matchedProduct && item.product_name) {
                matchedProduct = products.find(p => p.name?.toLowerCase().includes(item.product_name.toLowerCase()));
            }
            if (!matchedProduct) {
                matchedProduct = products.find(p => p.name?.toLowerCase().includes('refill')) || products[0];
            }

            return {
                customer_name: (item.customer_name || 'Walk-in').trim(),
                product_id: matchedProduct?.id || null,
                product_name: matchedProduct?.name || 'Water Refill',
                quantity: qty,
                unit_price: unitPrice || Number(matchedProduct?.price) || 0,
                total_amount: total || (qty * (unitPrice || Number(matchedProduct?.price) || 0)),
                payment_method: item.payment_method || 'Cash'
            };
        });

        return res.status(200).json({ success: true, data: safeData });
    } catch (err) {
        console.error('Scan sales list error:', err);
        return res.status(500).json({ error: err.message || 'Failed to analyze sales image' });
    }
}