// Server-side route: the browser POSTs here, and this code calls Claude.
// It runs on the server (Vercel), so ANTHROPIC_API_KEY is never sent to the browser.
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

// The exact JSON shape we want back. Claude's structured outputs feature
// forces the reply to match this schema, so JSON.parse below won't break.
const feedbackSchema = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description: "The character's spoken reply, in simple English (1-2 short sentences).",
    },
    strengths: { type: "array", items: { type: "string" } },
    tips: { type: "array", items: { type: "string" } },
    vocabularyUsed: {
      type: "array",
      items: { type: "string" },
      description: "Target words the learner actually used.",
    },
  },
  required: ["reply", "strengths", "tips", "vocabularyUsed"],
  additionalProperties: false,
};

export interface ChatRequest {
  role: string; // Friend | Professor | Manager | Customer
  scenario: string; // the scenario's opening line
  message: string; // what the learner said (from speech recognition or typing)
  targetWords: string[];
}

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is empty" }, { status: 400 });
  }
  if (message.length > 1000) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  }

  const system = `You are a role-play partner in an English practice app for refugees and newcomers with low literacy.
You are playing a ${body.role}. The scenario started with: "${body.scenario}"
Stay in character and reply in very simple English: short sentences, common words, no idioms.
Then give gentle feedback on the learner's sentence: up to 2 strengths and up to 2 tips. Each item must be under 12 words.
Target vocabulary for this scenario: ${body.targetWords.join(", ")}.`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-5-5", // fast and cheap, good enough for short replies
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: message }],
      output_config: { format: { type: "json_schema", schema: feedbackSchema } },
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No reply from Claude" }, { status: 502 });
    }
    return NextResponse.json(JSON.parse(textBlock.text));
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json({ error: "Claude request failed" }, { status: 502 });
  }
}
