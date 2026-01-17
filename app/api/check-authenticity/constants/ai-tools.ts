/**
 * Comprehensive AI tool signature database for detection
 */

export const AI_TOOLS_SIGNATURES = {
  // Diffusion-based generators
  DIFFUSION: [
    'stable diffusion',
    'automatic1111',
    'comfyui',
    'swarmui',
    'forge',
    'webui',
    'sdxl',
    'stablecascade',
    'automatic 1111',
    'a1111',
    'invokeai',
    'invoke ai',
    'sd-webui',
    'kohya',
    'diffusers',
    'flux',
    'fooocus',
    'sd1.5',
    'sd2.0',
    'sd2.1',
    'sdxl1.0',
    'stable-diffusion',
    'dreamshaper',
    'deliberate',
    'realistic vision',
    'cyberrealistic',
    'juggernaut',
  ],
  
  // Cloud/SaaS AI generators
  GENERATIVE: [
    'dall-e',
    'dalle',
    'dall e',
    'dall·e',
    'openai',
    'chatgpt',
    'midjourney',
    'mid journey',
    'mj',
    'leonardo ai',
    'leonardo.ai',
    'leonardo',
    'ideogram',
    'ideogram.ai',
    'playground ai',
    'playground',
    'adobe firefly',
    'firefly',
    'bing image creator',
    'microsoft designer',
    'copilot',
    'gemini image',
    'google imagen',
    'imagen',
    'stability ai',
    'stability.ai',
    'nightcafe',
    'artbreeder',
    'craiyon',
    'dream',
    'deep dream',
    'neural.love',
    'starryai',
    'jasper art',
    'pixlr ai',
    'fotor ai',
    'picsart ai',
    'runwayml',
    'runway',
    'kaiber',
    'synthesia',
    'd-id',
    'heygen',
    'luma ai',
    'pika labs',
    'pika',
    'kling ai',
    'sora',
    'gen-2',
    'gen-3',
    'suno',
    'udio',
  ],
  
  // Image editing software
  EDITING: [
    'adobe photoshop',
    'photoshop',
    'adobe lightroom',
    'lightroom',
    'adobe after effects',
    'after effects',
    'adobe premiere',
    'gimp',
    'gnu image manipulation',
    'canva',
    'affinity photo',
    'affinity designer',
    'skylum luminar',
    'luminar',
    'capture one',
    'dxo photolab',
    'photolab',
    'darktable',
    'rawtherapee',
    'on1',
    'corel painter',
    'pixelmator',
    'procreate',
    'clip studio',
    'krita',
    'photopea',
  ],
  
  // Export and screenshot tools
  EXPORT_TOOLS: [
    'screenshot',
    'snipping tool',
    'screen capture',
    'grab',
    'preview',
    'paint',
    'mspaint',
    'chrome',
    'safari',
    'firefox',
    'edge',
    'figma',
    'sketch',
    'adobe xd',
    'design tool',
    'windows photo',
    'photos',
    'image viewer',
    'snagit',
    'greenshot',
    'lightshot',
    'sharex',
    'gyazo',
  ],
  
  // Direct AI markers in metadata
  AI_MARKERS: [
    'ai-generated',
    'ai generated',
    'ai_generated',
    'artificial intelligence',
    'machine learning',
    'neural network',
    'diffusion model',
    'generative adversarial',
    'gan',
    'text-to-image',
    'text to image',
    't2i',
    'image generation',
    'image synthesis',
    'stable diffusion',
    'synthid',
    'c2pa',
    'contentcredentials',
    'content credentials',
    // Stable Diffusion specific markers
    'parameters:',
    'negative prompt:',
    'negative_prompt',
    'steps:',
    'cfg scale:',
    'cfg_scale',
    'seed:',
    'model:',
    'sampler:',
    'scheduler:',
    'denoising strength:',
    'denoising_strength',
    'clip skip:',
    'clip_skip',
    'batch size:',
    'batch_size',
    'hires fix',
    'hires. fix',
    'upscale',
    'upscaler',
    'lora:',
    'lora_',
    '<lora:',
    'lyco:',
    'embedding:',
    'ti:',
    'hypernetwork',
    'hypernet',
    'controlnet',
    'inpaint',
    'img2img',
    'txt2img',
    'latent',
    'vae',
    // Midjourney specific
    'version:',
    'aspect ratio:',
    '--ar',
    '--v',
    '--quality',
    '--q',
    '--stylize',
    '--s',
    '--chaos',
    '--c',
    '--weird',
    '--w',
    '--niji',
    '--style',
    '--tile',
    '--repeat',
    '--no',
    '--iw',
    // ComfyUI specific
    'workflow',
    'node_',
    'ksampler',
    'checkpoint',
    'positive_conditioning',
    'negative_conditioning',
  ],
} as const;

/**
 * Keywords found in PNG text chunks indicating AI generation
 */
export const PNG_AI_CHUNK_KEYWORDS = [
  // Core parameters
  'parameters',
  'prompt',
  'negative prompt',
  'negative_prompt',
  'positive prompt',
  'workflow',
  'comfyui',
  'automatic1111',
  
  // Stable Diffusion
  'stable diffusion',
  'steps:',
  'cfg scale:',
  'cfg_scale',
  'seed:',
  'sampler:',
  'scheduler:',
  'model:',
  'checkpoint',
  'lora',
  'lyco',
  'hypernetwork',
  'hires fix',
  'denoising',
  'inpaint',
  'controlnet',
  'adetailer',
  'upscale',
  'latent',
  'vae:',
  'clip skip',
  
  // Midjourney
  'midjourney',
  'version:',
  'aspect ratio:',
  'chaos:',
  'stylize:',
  'weird:',
  'quality:',
  '--ar',
  '--v ',
  '--q ',
  '--s ',
  
  // DALL-E
  'dall-e',
  'dalle',
  'openai',
  
  // ComfyUI nodes
  'ksampler',
  'checkpoint_loader',
  'clip_text_encode',
  'empty_latent',
  'vae_decode',
  'save_image',
  
  // Leonardo
  'leonardo',
  'alchemy',
  'photoreal',
  'phoenix',
  
  // Generic
  'ai generated',
  'generated by',
  'created with',
];

/**
 * C2PA and content authenticity markers
 */
export const C2PA_AI_ASSERTIONS = [
  'c2pa',
  'c2pa.ai',
  'contentcredentials',
  'content credentials',
  'jumbf',
  'adobe',
  'provenance',
  'claim',
  'assertion',
  'training-mining',
  'ai_generated',
  'ai_training',
  'generativeai',
  'synthid',
];

/**
 * Common screenshot resolution patterns
 */
export const SCREENSHOT_INDICATORS = [
  // Common desktop resolutions
  '1920x1080',
  '2560x1440',
  '3840x2160',
  '1366x768',
  '1440x900',
  '1536x864',
  '1920x1200',
  '2560x1600',
  '3440x1440',
  '5120x1440',
  '5120x2880',
  // Software indicators
  'screen capture',
  'screenshot',
  'snipping',
  'grab',
  'preview',
  'sharex',
  'greenshot',
  'snagit',
  'lightshot',
];

/**
 * Known camera manufacturers (authentic images usually have these)
 */
export const COMMON_CAMERA_MAKES = [
  'apple',
  'canon',
  'nikon',
  'sony',
  'fujifilm',
  'fuji',
  'olympus',
  'panasonic',
  'pentax',
  'leica',
  'samsung',
  'lg',
  'xiaomi',
  'huawei',
  'oppo',
  'vivo',
  'oneplus',
  'google',
  'motorola',
  'asus',
  'realme',
  'honor',
  'nokia',
  'htc',
  'zte',
  'blackberry',
  'gopro',
  'dji',
  'insta360',
  'ricoh',
  'sigma',
  'hasselblad',
  'phase one',
  'mamiya',
  'kodak',
];

/**
 * Detect if software field indicates an AI tool
 */
export function detectAITool(software: string): { 
  detected: boolean; 
  tool?: string; 
  type?: string;
  confidence?: number;
} {
  if (!software) return { detected: false };

  const lowerSoftware = software.toLowerCase();

  // Check each category
  for (const [category, tools] of Object.entries(AI_TOOLS_SIGNATURES)) {
    for (const tool of tools) {
      if (lowerSoftware.includes(tool)) {
        return {
          detected: true,
          tool: software,
          type: category.replace('_', ' ').toLowerCase(),
          confidence: category === 'DIFFUSION' || category === 'GENERATIVE' ? 95 : 
                     category === 'AI_MARKERS' ? 90 : 
                     category === 'EDITING' ? 40 : 30,
        };
      }
    }
  }

  return { detected: false };
}

/**
 * Check if software is an export/screenshot tool
 */
export function isExportTool(software: string): boolean {
  if (!software) return false;

  const lowerSoftware = software.toLowerCase();
  return AI_TOOLS_SIGNATURES.EXPORT_TOOLS.some(tool =>
    lowerSoftware.includes(tool)
  );
}

/**
 * Check if camera make is from a known manufacturer
 */
export function isKnownCameraMake(make: string): boolean {
  if (!make) return false;
  return COMMON_CAMERA_MAKES.some(m =>
    make.toLowerCase().includes(m.toLowerCase())
  );
}

/**
 * Check text content for AI generation markers
 */
export function containsAIMarkers(text: string): {
  found: boolean;
  markers: string[];
  confidence: number;
} {
  if (!text) return { found: false, markers: [], confidence: 0 };
  
  const lowerText = text.toLowerCase();
  const foundMarkers: string[] = [];
  
  // Check PNG chunk keywords
  for (const keyword of PNG_AI_CHUNK_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundMarkers.push(keyword);
    }
  }
  
  // Check AI markers
  for (const marker of AI_TOOLS_SIGNATURES.AI_MARKERS) {
    if (lowerText.includes(marker.toLowerCase())) {
      if (!foundMarkers.includes(marker)) {
        foundMarkers.push(marker);
      }
    }
  }
  
  // Calculate confidence based on number and type of markers
  let confidence = 0;
  if (foundMarkers.length > 0) {
    confidence = Math.min(100, 50 + (foundMarkers.length * 15));
    
    // High confidence markers
    const highConfMarkers = ['parameters:', 'negative prompt', 'cfg scale', 'stable diffusion', 'midjourney'];
    for (const marker of foundMarkers) {
      if (highConfMarkers.some(hc => marker.toLowerCase().includes(hc))) {
        confidence = Math.min(100, confidence + 20);
        break;
      }
    }
  }
  
  return {
    found: foundMarkers.length > 0,
    markers: foundMarkers,
    confidence,
  };
}
