// src/pages/api/generate-3d-icon.js
const CATEGORY_PROMPT_GUIDES = {
    'Refills/Services':
        'isometric 3D water refilling station dispenser booth or purified 20L water jug refill icon, glossy aqua blue water and apple green (#8DB600) accents',
    Containers:
        'isometric 3D heavy-duty reusable 20-liter water container jug with cap and handle, glossy apple green (#8DB600) or clear sky-blue polycarbonate finish',
    'Bottled Water':
        'isometric 3D sealed clear PET drinking water bottle with blue cap and apple green (#8DB600) label band, fresh condensation droplets',
    'Ice Cubes/Tubes':
        'isometric 3D crystal-clear hollow tube ice cubes or frosted purified ice pack with cool cyan highlights',
    Accessories:
        'isometric 3D water dispenser equipment, push-paddle faucet, or non-spill bottle caps in clean white, red, and apple green (#8DB600)',
    General:
        'isometric 3D purified drinking water supply item with glossy aqua blue and apple green (#8DB600) studio accents'
};

async function callGeminiGenerateContentImage(modelId, apiKey, prompt) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE'],
                    imageConfig: {
                        aspectRatio: '1:1'
                    }
                }
            })
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message || `Model ${modelId} failed (${response.status}).`);
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p?.inlineData?.data);
    if (!imagePart) {
        throw new Error(`No image returned by ${modelId}.`);
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

/**
 * Built-in category-tuned 3D SVG studio generator used if the Gemini API key
 * does not have image-generation quota/billing enabled yet.
 */
function buildCategoryStudio3DFallbackDataUrl(label, category) {
    const cleanTag = String(label || '3D')
        .replace(/[^a-zA-Z0-9.+ -]/g, '')
        .trim()
        .slice(0, 12)
        .toUpperCase();

    let svgBody = '';

    if (category === 'Containers') {
        svgBody = `
            <ellipse cx="128" cy="226" rx="64" ry="11" fill="rgba(101,144,0,0.28)"/>
            <rect x="108" y="24" width="40" height="16" rx="5" fill="#f8fafc"/>
            <rect x="112" y="40" width="32" height="13" fill="#659000"/>
            <rect x="106" y="51" width="44" height="9" rx="4" fill="#4d7c0f"/>
            <path d="M108 59 C86 67, 66 80, 66 98 L66 206 C66 216, 80 222, 128 222 C176 222, 190 216, 190 206 L190 98 C190 80, 170 67, 148 59 Z" fill="url(#gGreen)"/>
            <rect x="64" y="112" width="128" height="11" rx="5" fill="#d9f99d" opacity="0.78"/>
            <rect x="64" y="168" width="128" height="11" rx="5" fill="#d9f99d" opacity="0.78"/>
            <rect x="72" y="129" width="112" height="33" rx="6" fill="#ffffff" opacity="0.96"/>
            <rect x="72" y="129" width="112" height="6" rx="3" fill="#0284c7"/>
            <text x="128" y="152" text-anchor="middle" fill="#0f172a" font-size="14" font-weight="900" font-family="sans-serif">${cleanTag}</text>
            <path d="M80 86 L80 202" stroke="#ecfccb" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
        `;
    } else if (category === 'Bottled Water') {
        svgBody = `
            <ellipse cx="128" cy="228" rx="44" ry="9" fill="rgba(2,132,199,0.28)"/>
            <rect x="112" y="24" width="32" height="15" rx="4" fill="#0284c7"/>
            <rect x="110" y="39" width="36" height="6" rx="3" fill="#0369a1"/>
            <path d="M114 45 C103 58, 92 72, 92 88 L92 208 C92 218, 100 224, 128 224 C156 224, 164 218, 164 208 L164 88 C164 72, 153 58, 142 45 Z" fill="url(#gAqua)"/>
            <rect x="92" y="110" width="72" height="42" fill="#0369a1"/>
            <rect x="92" y="110" width="72" height="7" fill="#8DB600"/>
            <rect x="92" y="145" width="72" height="7" fill="#38bdf8"/>
            <text x="128" y="136" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="900" font-family="sans-serif">${cleanTag}</text>
            <path d="M104 76 L104 206" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
        `;
    } else if (category === 'Ice Cubes/Tubes') {
        svgBody = `
            <ellipse cx="128" cy="226" rx="62" ry="10" fill="rgba(56,189,248,0.28)"/>
            <path d="M108 30 L118 54 L138 54 L148 30 L134 36 L128 24 L122 36 Z" fill="#e0f2fe"/>
            <rect x="112" y="52" width="32" height="9" rx="4" fill="#0284c7"/>
            <path d="M112 60 C82 74, 66 104, 68 178 C70 208, 84 222, 128 222 C172 222, 186 208, 188 178 C190 104, 174 74, 144 60 Z" fill="url(#gIce)" stroke="#ffffff" stroke-width="3"/>
            <circle cx="102" cy="116" r="14" fill="#f0f9ff" stroke="#38bdf8" stroke-width="3"/>
            <circle cx="128" cy="108" r="14" fill="#f0f9ff" stroke="#38bdf8" stroke-width="3"/>
            <circle cx="152" cy="118" r="14" fill="#f0f9ff" stroke="#38bdf8" stroke-width="3"/>
            <circle cx="96" cy="148" r="14" fill="#f0f9ff" stroke="#38bdf8" stroke-width="3"/>
            <circle cx="124" cy="144" r="14" fill="#f0f9ff" stroke="#38bdf8" stroke-width="3"/>
            <circle cx="152" cy="148" r="14" fill="#f0f9ff" stroke="#38bdf8" stroke-width="3"/>
            <circle cx="106" cy="180" r="14" fill="#f0f9ff" stroke="#38bdf8" stroke-width="3"/>
            <circle cx="136" cy="180" r="14" fill="#f0f9ff" stroke="#38bdf8" stroke-width="3"/>
        `;
    } else if (category === 'Accessories') {
        svgBody = `
            <ellipse cx="128" cy="224" rx="60" ry="10" fill="rgba(148,163,184,0.28)"/>
            <rect x="64" y="96" width="26" height="64" rx="8" fill="#cbd5e1"/>
            <rect x="86" y="112" width="88" height="32" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
            <rect x="142" y="122" width="32" height="68" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
            <rect x="138" y="96" width="40" height="22" rx="6" fill="#8DB600"/>
            <rect x="148" y="46" width="20" height="54" rx="8" fill="#659000"/>
        `;
    } else {
        // Refills/Services & General
        svgBody = `
            <ellipse cx="128" cy="226" rx="64" ry="11" fill="rgba(2,132,199,0.28)"/>
            <rect x="108" y="24" width="40" height="16" rx="5" fill="#f8fafc"/>
            <rect x="112" y="40" width="32" height="13" fill="#0284c7"/>
            <rect x="106" y="51" width="44" height="9" rx="4" fill="#0369a1"/>
            <path d="M108 59 C86 67, 66 80, 66 98 L66 206 C66 216, 80 222, 128 222 C176 222, 190 216, 190 206 L190 98 C190 80, 170 67, 148 59 Z" fill="url(#gAqua)"/>
            <rect x="64" y="112" width="128" height="11" rx="5" fill="#bae6fd" opacity="0.72"/>
            <rect x="64" y="168" width="128" height="11" rx="5" fill="#bae6fd" opacity="0.72"/>
            <rect x="72" y="129" width="112" height="33" rx="6" fill="#ffffff" opacity="0.96"/>
            <rect x="72" y="129" width="112" height="6" rx="3" fill="#8DB600"/>
            <text x="128" y="152" text-anchor="middle" fill="#0f172a" font-size="14" font-weight="900" font-family="sans-serif">${cleanTag}</text>
            <path d="M80 86 L80 202" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.65"/>
        `;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
        <defs>
            <linearGradient id="gGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#a3d100"/>
                <stop offset="32%" stop-color="#bef264"/>
                <stop offset="70%" stop-color="#8DB600"/>
                <stop offset="100%" stop-color="#4d7c0f"/>
            </linearGradient>
            <linearGradient id="gAqua" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#7dd3fc"/>
                <stop offset="34%" stop-color="#e0f2fe"/>
                <stop offset="72%" stop-color="#38bdf8"/>
                <stop offset="100%" stop-color="#0284c7"/>
            </linearGradient>
            <linearGradient id="gIce" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#e0f2fe"/>
                <stop offset="55%" stop-color="#bae6fd"/>
                <stop offset="100%" stop-color="#7dd3fc"/>
            </linearGradient>
        </defs>
        ${svgBody}
    </svg>`;

    const base64 = Buffer.from(svg, 'utf-8').toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { label, category = 'General', description = '' } = req.body || {};
    if (!label || !String(label).trim()) {
        return res.status(400).json({ error: 'Product or icon label is required.' });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const categoryStyle =
        CATEGORY_PROMPT_GUIDES[category] || CATEGORY_PROMPT_GUIDES.General;

    const prompt = [
        `Create a single centered 3D product icon for a Philippine water refilling station POS catalog.`,
        `Product: "${String(label).trim()}"${description ? ` (${String(description).trim()})` : ''}.`,
        `Visual style: ${categoryStyle}.`,
        `Strict rules: Stylized glossy 3D isometric UI icon, soft studio rim lighting, subtle soft shadow directly underneath, centered with generous padding, isolated on a solid pure white background (#FFFFFF), no text, no watermarks, no extra background objects.`
    ].join(' ');

    if (apiKey) {
        const models = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview'];
        for (const modelId of models) {
            try {
                const imageDataUrl = await callGeminiGenerateContentImage(modelId, apiKey, prompt);
                return res.status(200).json({
                    imageDataUrl,
                    promptUsed: prompt,
                    provider: modelId
                });
            } catch (err) {
                console.warn(`[generate-3d-icon] ${modelId} failed:`, err.message);
            }
        }
    }

    // Automatic studio 3D fallback if Gemini image quota/billing is unavailable
    const fallbackDataUrl = buildCategoryStudio3DFallbackDataUrl(label, category);
    return res.status(200).json({
        imageDataUrl: fallbackDataUrl,
        promptUsed: prompt,
        provider: 'seaside-3d-studio-fallback'
    });
}