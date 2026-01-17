# AutoScan AI - Car Damage Detection & Analysis

A Next.js web application that uses AI to detect car damage, estimate repair costs, and generate a preview of the repaired vehicle.

## Features

- 🚗 **Damage Detection**: Uses Roboflow API to identify damaged areas
- 💰 **Cost Estimation**: Gemini AI analyzes damage and estimates repair costs in multiple currencies
- 🎨 **Repair Preview**: Generates an AI image showing the car after repairs
- 🌙 **Premium Dark UI**: Modern, cyberpunk-inspired design with glassmorphism

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure API Keys

Create a `.env.local` file in the root directory:

```env
ROBOFLOW_API_KEY=your_roboflow_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get API Keys:**
- **Roboflow**: Sign up at [roboflow.com](https://roboflow.com)
- **Gemini**: Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Run Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload Image**: Drag and drop or click to upload a photo of a damaged car
2. **Select Currency**: Choose your preferred currency for cost estimation
3. **Analyze**: Click "Analyze Damage" to start the AI workflow
4. **View Results**:
   - Damage detection with bounding boxes
   - Car model identification
   - Detailed cost breakdown (parts + labor)
   - AI-generated repair preview

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **APIs**:
  - Roboflow (Damage Detection)
  - Google Gemini (Analysis & Image Generation)

## Project Structure

```
cardamagedetection/
├── app/
│   ├── api/
│   │   ├── detect/route.ts      # Roboflow damage detection
│   │   ├── analyze/route.ts     # Gemini cost analysis
│   │   └── generate/route.ts    # Gemini image generation
│   ├── page.tsx                 # Main UI
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Navbar.tsx
│   ├── UploadZone.tsx
│   └── AnalysisCard.tsx
└── lib/
    └── utils.ts
```

## License

MIT
