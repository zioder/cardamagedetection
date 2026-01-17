import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

export async function POST(request: NextRequest) {
    try {
        const { image, annotatedImage, carModel, damages } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        if (!annotatedImage) {
            return NextResponse.json({ error: 'Annotated image required for accurate repair generation' }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        const carDescription = carModel
            ? `${carModel.year || ''} ${carModel.make || ''} ${carModel.model || ''}`.trim()
            : 'the car';

        const damageDescription = damages?.map((d: { type: string; description?: string }) =>
            `${d.type}${d.description ? `: ${d.description}` : ''}`
        ).join('; ') || 'visible damage';

        // Remove data URL prefix
        const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
        const base64Annotated = annotatedImage.replace(/^data:image\/\w+;base64,/, '');

        // Using the original image as the basis, asking Gemini to edit/fix the damaged areas
        const prompt = `Edit this image of a ${carDescription} to digitally repair all the damaged areas.
The damaged areas are: ${damageDescription}
Keep everything exactly the same - same angle, same lighting, same background, same car position.
Only fix the specific damaged parts (dents, scratches, broken parts) to look like new.
The result should look like a realistic photo of this exact car before it was damaged.`;

        const parts: any[] = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            },
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Annotated
                }
            }
        ];

        console.log('Calling Gemini for image generation...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ role: 'user', parts }]
        });

        console.log('Gemini response received');

        // Check if the response contains an image in the parts
        const candidates = response.candidates || [];
        for (const candidate of candidates) {
            for (const part of candidate.content?.parts || []) {
                if ('inlineData' in part && part.inlineData) {
                    console.log('Image generated successfully');
                    return NextResponse.json({
                        generatedImage: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                    });
                }
            }
        }

        // Fallback - get text response if no image
        const textPart = candidates[0]?.content?.parts?.[0];
        const textContent = textPart && 'text' in textPart ? textPart.text : '';

        console.log('No image in response, text:', textContent?.substring(0, 100));

        return NextResponse.json({
            error: 'Model did not return image data',
            message: textContent || 'Image generation not supported by this model'
        }, { status: 200 });

    } catch (error: any) {
        console.error('Generation error:', error);
        return NextResponse.json(
            { error: 'Image generation failed', details: error.message },
            { status: 500 }
        );
    }
}
