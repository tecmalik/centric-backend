"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyPackageDescription = void 0;
const ruleBasedClassifier = (description) => {
    const desc = description.toLowerCase();
    const categories = [
        {
            name: 'CLOTHING',
            keywords: ['shoe', 'shirt', 'pant', 'dress', 'clothing', 'sock', 'sneaker', 'bag', 'cloth', 'jacket', 'hat', 'wear'],
            risk: 'LOW',
        },
        {
            name: 'ELECTRONICS',
            keywords: ['phone', 'laptop', 'computer', 'ipad', 'tablet', 'charger', 'cable', 'screen', 'battery', 'camera', 'headphone', 'device'],
            risk: 'MEDIUM', // Batteries or screens can be sensitive
        },
        {
            name: 'DOCUMENTS',
            keywords: ['paper', 'document', 'contract', 'passport', 'id', 'letter', 'certificate', 'file', 'book', 'envelope'],
            risk: 'LOW',
        },
        {
            name: 'FRAGILE',
            keywords: ['glass', 'mirror', 'ceramic', 'porcelain', 'vase', 'cup', 'perfume', 'bottle', 'crystal', 'mug'],
            risk: 'HIGH',
        },
        {
            name: 'FOOD',
            keywords: ['food', 'fruit', 'vegetable', 'meat', 'snack', 'cookie', 'cake', 'bread', 'chocolate', 'drink'],
            risk: 'LOW',
        },
    ];
    for (const cat of categories) {
        if (cat.keywords.some((keyword) => desc.includes(keyword))) {
            return {
                category: cat.name,
                riskLevel: cat.risk,
                confidence: parseFloat((0.85 + Math.random() * 0.1).toFixed(2)), // Random confidence between 0.85 and 0.95
            };
        }
    }
    // Fallback default
    return {
        category: 'OTHERS',
        riskLevel: 'LOW',
        confidence: 0.6,
    };
};
const classifyPackageDescription = async (description) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log('[AI Service] No GEMINI_API_KEY found, running rule-based classification fallback.');
        return ruleBasedClassifier(description);
    }
    try {
        console.log('[AI Service] Calling Gemini API for package classification...');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const prompt = `
      You are a package classification assistant for a logistics system called Centric.
      Analyze the following package description and classify it into:
      - category: One of CLOTHING, ELECTRONICS, DOCUMENTS, FRAGILE, FOOD, OTHERS.
      - riskLevel: One of LOW, MEDIUM, HIGH.
      - confidence: A confidence score between 0.0 and 1.0 representing how sure you are.

      Description: "${description}"

      Respond ONLY with a valid JSON object matching the schema:
      {
        "category": "CLOTHING" | "ELECTRONICS" | "DOCUMENTS" | "FRAGILE" | "FOOD" | "OTHERS",
        "riskLevel": "LOW" | "MEDIUM" | "HIGH",
        "confidence": number
      }
      Do not include markdown tags, code blocks, or explanations. Respond with raw JSON only.
    `;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    responseMimeType: 'application/json',
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Gemini API returned status code ${response.status}`);
        }
        const json = (await response.json());
        const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!textResponse) {
            throw new Error('Empty response from Gemini API');
        }
        // Clean JSON if the model returned markdown codeblocks anyway
        const cleanedText = textResponse.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const result = JSON.parse(cleanedText);
        // Validate structure
        if (result.category && result.riskLevel && typeof result.confidence === 'number') {
            return {
                category: result.category.toUpperCase(),
                riskLevel: result.riskLevel.toUpperCase(),
                confidence: parseFloat(result.confidence.toFixed(2)),
            };
        }
        throw new Error('Response did not match expected structure');
    }
    catch (error) {
        console.error('[AI Service] Error calling Gemini API, falling back to rules:', error);
        return ruleBasedClassifier(description);
    }
};
exports.classifyPackageDescription = classifyPackageDescription;
