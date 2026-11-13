// Server-side route: turns text into speech with ElevenLabs and streams back MP3 audio.
// ELEVENLABS_API_KEY stays on the server.
import { NextResponse } from "next/server";

// Any voice ID from your ElevenLabs Voice Library works; set ELEVENLABS_VOICE_ID to change it.
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY is not set" }, { status: 500 });
  }

  const { text } = (await request.json().catch(() => ({}))) as { text?: string };
  if (!text?.trim() || text.length > 500) {
    // the length cap limits how many credits one request can use
    return NextResponse.json({ error: "Text missing or too long" }, { status: 400 });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  let response: Response;
  try {
    response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_id: "eleven_flash_v2_5" }), // low-latency model
      },
    );
  } catch (error) {
    // network failure (ElevenLabs down, DNS, etc.)
    console.error("ElevenLabs request failed:", error);
    return NextResponse.json({ error: "Text-to-speech failed" }, { status: 502 });
  }

  if (!response.ok) {
    console.error("ElevenLabs error:", response.status, await response.text());
    return NextResponse.json({ error: "Text-to-speech failed" }, { status: 502 });
  }

  // Pass the audio straight through to the browser.
  return new Response(response.body, { headers: { "Content-Type": "audio/mpeg" } });
}
