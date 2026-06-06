import { NextResponse } from 'next/server';

const Z_IMAGE_SERVICE_URL = process.env.Z_IMAGE_SERVICE_URL || 'http://localhost:8001';

export async function GET() {
  try {
    const response = await fetch(`${Z_IMAGE_SERVICE_URL}/resolutions`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // Return hardcoded defaults if service is down
      return NextResponse.json({ resolutions: getDefaultResolutions() });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ resolutions: getDefaultResolutions() });
  }
}

function getDefaultResolutions() {
  return [
    { value: "720x720 ( 1:1 )", label: "720x720 (1:1)", width: 720, height: 720 },
    { value: "896x512 ( 16:9 )", label: "896x512 (16:9)", width: 896, height: 512 },
    { value: "512x896 ( 9:16 )", label: "512x896 (9:16)", width: 512, height: 896 },
    { value: "1024x1024 ( 1:1 )", label: "1024x1024 (1:1)", width: 1024, height: 1024 },
    { value: "864x1152 ( 3:4 )", label: "864x1152 (3:4)", width: 864, height: 1152 },
    { value: "1152x864 ( 4:3 )", label: "1152x864 (4:3)", width: 1152, height: 864 },
    { value: "720x1280 ( 9:16 )", label: "720x1280 (9:16)", width: 720, height: 1280 },
    { value: "1280x720 ( 16:9 )", label: "1280x720 (16:9)", width: 1280, height: 720 },
    { value: "864x1536 ( 9:16 )", label: "864x1536 (9:16)", width: 864, height: 1536 },
    { value: "1024x1536 ( 2:3 )", label: "1024x1536 (2:3)", width: 1024, height: 1536 },
  ];
}
