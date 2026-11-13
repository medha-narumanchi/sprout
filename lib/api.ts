// Browser-side helpers that call our own API routes (never the external APIs directly).

export interface ChatFeedback {
  reply: string;
  strengths: string[];
  tips: string[];
  vocabularyUsed: string[];
}

export async function getChatFeedback(input: {
  role: string;
  scenario: string;
  message: string;
  targetWords: string[];
}): Promise<ChatFeedback> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error);
  }
  return response.json();
}

// Fetches MP3 audio for the text and plays it. Returns the Audio element so callers can stop it.
export async function speak(text: string): Promise<HTMLAudioElement> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Text-to-speech failed");

  const blob = await response.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  audio.onended = () => URL.revokeObjectURL(audio.src); // free the memory once it finishes
  await audio.play();
  return audio;
}
