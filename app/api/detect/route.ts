import { NextRequest, NextResponse } from 'next/server';

// The API key from your Roboflow dashboard
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || '';
const MODEL_ID = 'car-damage-detection-5ioys-xugve/4';

export async function POST(request: NextRequest) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        if (!ROBOFLOW_API_KEY) {
            console.error('ROBOFLOW_API_KEY is not set in environment variables');
            return NextResponse.json({
                error: 'Roboflow API key not configured',
                details: 'Please set ROBOFLOW_API_KEY in your .env.local file'
            }, { status: 500 });
        }

        // Remove data URL prefix if present
        const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

        console.log(`Using Roboflow API Key: ${ROBOFLOW_API_KEY.substring(0, 8)}...`);
        console.log(`Calling Roboflow model: ${MODEL_ID}`);

        // Call Roboflow for JSON predictions using the detect endpoint
        const detectUrl = `https://detect.roboflow.com/${MODEL_ID}?api_key=${ROBOFLOW_API_KEY}`;
        console.log(`Request URL: ${detectUrl.replace(ROBOFLOW_API_KEY, '***')}`);

        const response = await fetch(detectUrl, {
            method: 'POST',
            body: base64Image,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const responseText = await response.text();
        console.log(`Roboflow response status: ${response.status}`);
        console.log(`Roboflow response: ${responseText.substring(0, 200)}`);

        if (!response.ok) {
            return NextResponse.json({
                error: 'Roboflow API error',
                details: responseText,
                status: response.status
            }, { status: 500 });
        }

        const data = JSON.parse(responseText);
        console.log(`Detected ${data.predictions?.length || 0} damage areas`);

        // Call for annotated image (visualization)
        let annotatedImage = null;
        try {
            const vizUrl = `https://detect.roboflow.com/${MODEL_ID}?api_key=${ROBOFLOW_API_KEY}&format=image&labels=on&stroke=5`;
            const vizResponse = await fetch(vizUrl, {
                method: 'POST',
                body: base64Image,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (vizResponse.ok) {
                const vizBuffer = await vizResponse.arrayBuffer();
                const vizBase64 = Buffer.from(vizBuffer).toString('base64');
                annotatedImage = `data:image/jpeg;base64,${vizBase64}`;
                console.log('Annotated image generated successfully');
            } else {
                console.warn(`Visualization failed: ${vizResponse.status}`);
            }
        } catch (vizError) {
            console.warn('Visualization call failed:', vizError);
        }

        return NextResponse.json({
            predictions: data.predictions || [],
            annotatedImage: annotatedImage,
            time: data.time || 0
        });

    } catch (error: any) {
        console.error('Detection route error:', error);
        return NextResponse.json(
            { error: 'Failed to process detection', details: error.message },
            { status: 500 }
        );
    }
}
