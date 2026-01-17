import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

export async function POST(request: NextRequest) {
    try {
        const { image, annotatedImage, predictions, currency } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        // Build damage description from predictions
        const damageList = predictions?.map((p: any) =>
            `${p.class} (${Math.round(p.confidence * 100)}% confidence)`
        ).join(', ') || 'Unknown damage';

        // Remove data URL prefix if present
        const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
        const base64Annotated = annotatedImage?.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `You are an expert automotive damage assessor. Analyze these images of a car. One is the original, one is annotated with damage.

Detected damage areas: ${damageList}

Please provide:
1. **Car Model**: Identify make, model, and year.
2. **Damage Assessment**: List all visible damage with severity.
3. **Repair Cost Estimate** in ${currency || 'TND'}:
   - Parts cost breakdown
   - Labor cost breakdown
   - Total estimated cost

Respond in JSON format:
{
  "carModel": { "make": "", "model": "", "year": "" },
  "damages": [{ "type": "", "severity": "", "description": "" }],
  "costEstimate": {
    "currency": "${currency || 'TND'}",
    "parts": [{ "name": "", "cost": 0 }],
    "laborHours": 0,
    "laborRate": 0,
    "laborTotal": 0,
    "partsTotal": 0,
    "grandTotal": 0
  },
  "repairRecommendation": ""
}`;

        const parts: any[] = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            }
        ];

        if (base64Annotated) {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Annotated
                }
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts }]
        } as any);

        const textContent = response.candidates?.[0]?.content?.parts?.find(p => 'text' in p)?.text || '';

        // Try to parse JSON from response
        let analysis;
        try {
            const jsonMatch = textContent.match(/```json\n?([\s\S]*?)\n?```/) ||
                textContent.match(/```\n?([\s\S]*?)\n?```/) ||
                [null, textContent];
            analysis = JSON.parse(jsonMatch[1] || textContent);
        } catch {
            analysis = { rawResponse: textContent };
        }

        return NextResponse.json({
            analysis
        });

    } catch (error: any) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze damage', details: error.message },
            { status: 500 }
        );
    }
}
