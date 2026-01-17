import { NextRequest, NextResponse } from "next/server";
import { analyzeMetadata } from "./lib/metadata-analyzer";
import { analyzeForensics } from "./lib/forensics-analyzer";
import { scoreResults } from "./lib/scoring-engine";

export async function POST(req: NextRequest) {
    console.log("[Check-Auth] Comprehensive analysis starting");
    const startTime = Date.now();

    try {
        const { image } = await req.json();
        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Run metadata analysis first
        const metadataAnalysis = await analyzeMetadata(image);

        // Forensics analysis (includes ELA, texture, frequency, AI artifacts)
        const forensicsAnalysis = await analyzeForensics(
            image,
            metadataAnalysis.cameraInfo?.make,
            metadataAnalysis.cameraInfo?.software
        );

        const result = scoreResults(
            metadataAnalysis,
            forensicsAnalysis
        );
        result.processingTime = Date.now() - startTime;

        console.log("[Check-Auth] Analysis complete:", {
            status: result.status,
            confidence: result.confidence,
            riskScore: result.riskScore,
            processingTime: result.processingTime,
            totalFindings: result.summary.totalFindings,
            aiDetected: result.aiDetection?.isLikelyAI || false,
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("[Check-Auth] Error:", error);
        return NextResponse.json(
            { error: "System error during check", details: error.message },
            { status: 500 }
        );
    }
}
