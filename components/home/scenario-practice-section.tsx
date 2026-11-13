"use client";

import { useState } from "react";
import { roleOptions } from "@/data/role-options";
import { getChatFeedback, speak, type ChatFeedback } from "@/lib/api";
import { useVoiceRecognition } from "@/lib/useVoiceRecognition";
import type { ConversationVocabularyItem, Role, TranslationContent } from "@/types/app";

interface ScenarioPracticeSectionProps {
  t: TranslationContent;
  role: Role;
  typedMessage: string;
  onRoleChange: (role: Role) => void;
  onTypedMessageChange: (value: string) => void;
  vocabulary: ConversationVocabularyItem[];
  onSubmit: (feedback: ChatFeedback) => void;
}

export function ScenarioPracticeSection({
  t,
  role,
  typedMessage,
  onRoleChange,
  onTypedMessageChange,
  vocabulary,
  onSubmit,
}: ScenarioPracticeSectionProps) {
  const scenario = t.scenario[role];
  const [feedback, setFeedback] = useState<ChatFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const showAiResponse = feedback !== null;

  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: voiceSupported,
  } = useVoiceRecognition();

  const handleStartRecording = () => {
    resetTranscript();
    startListening();
  };

  const handleStopRecording = async () => {
    const finalTranscript = await stopListening();
    if (finalTranscript && finalTranscript.trim()) {
      const newText = typedMessage
        ? `${typedMessage} ${finalTranscript.trim()}`
        : finalTranscript.trim();
      onTypedMessageChange(newText);
    }
  };

  const playReply = (text: string) => {
    // Audio is a bonus: if text-to-speech fails, the written reply is still shown.
    speak(text).catch(() => setApiError("Couldn't play audio. You can still read the reply."));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const result = await getChatFeedback({
        role,
        scenario: scenario.opening,
        message: typedMessage,
        targetWords: vocabulary.map((item) => item.word),
      });
      setFeedback(result);
      onSubmit(result);
      playReply(result.reply);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setFeedback(null);
    setApiError(null);
    onTypedMessageChange("");
    resetTranscript();
  };

  return (
    <div className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(148,113,73,0.12)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">
            {t.sec2Tag}
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t.sec2Title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {roleOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onRoleChange(option)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${role === option
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[1.5rem] bg-amber-50 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700">
            {t.convSetup}
          </p>
          <h3 className="mt-4 text-xl font-bold sm:text-2xl">{scenario.label}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">{scenario.opening}</p>
          <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-900">{t.aiCoachStyle}</p>
            <p className="mt-2">{scenario.style}</p>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-white/85">
            <p className="font-semibold text-amber-300">{t.helperLang}</p>
            <p className="mt-2">{scenario.helper}</p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            {t.typePaste}
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-3xl rounded-bl-md bg-slate-100 p-4 text-sm leading-6 text-slate-700">
              {scenario.opening}
            </div>

            {/* Voice Input Section */}
            {voiceSupported ? (
              <div className="space-y-2 rounded-2xl bg-blue-50 p-3 border border-blue-200">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                  {t.voiceInput}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={isListening}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${isListening
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                  >
                    {isListening ? `${t.listeningMsg}` : t.startRecording}
                  </button>
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    disabled={!isListening}
                    className="rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    {t.stopRecording}
                  </button>
                </div>
                {voiceError && (
                  <p className="text-xs text-red-600 bg-red-100 p-2 rounded">{voiceError}</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-yellow-50 p-3 border border-yellow-200">
                <p className="text-xs font-semibold text-yellow-700">⚠️ Voice input not available</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {voiceError || "Your browser doesn't support voice input. Try Chrome, Edge, or Safari."}
                </p>
              </div>
            )}

            <textarea
              value={isListening
                ? (typedMessage ? typedMessage + " " : "") + (transcript || "") + (interimTranscript || "")
                : typedMessage
              }
              onChange={(event) => !isListening && onTypedMessageChange(event.target.value)}
              disabled={isListening}
              className={`min-h-32 w-full rounded-3xl rounded-br-md border-2 ${isListening
                ? "border-blue-400 bg-blue-50"
                : "border-amber-200 bg-amber-50"
                } px-4 py-4 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 ${isListening ? "opacity-70 cursor-not-allowed" : "focus:border-amber-400"
                }`}
              placeholder={isListening ? "Listening... speak now" : t.placeholderType}
            />

            {/* Submit Button - Show if typed text exists */}
            {typedMessage.trim() && !isListening && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-green-500 text-white px-4 py-2 text-sm font-semibold hover:bg-green-600 transition disabled:opacity-60"
                >
                  {isLoading ? "Thinking..." : "✓ Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTypedMessageChange("");
                    resetTranscript();
                  }}
                  className="rounded-lg bg-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-400 transition"
                >
                  ✕ Clear
                </button>
              </div>
            )}

            {apiError && (
              <p className="rounded bg-red-100 p-2 text-xs text-red-600">{apiError}</p>
            )}

            {/* AI Response Section - filled in by Claude via /api/chat */}
            {feedback && (
              <div className="rounded-3xl rounded-bl-md bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{t.aiResponse}</p>
                  <button
                    type="button"
                    onClick={() => playReply(feedback.reply)}
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    🔊 Play again
                  </button>
                </div>
                <p className="mt-2">{feedback.reply}</p>

                <div className="mt-4 pt-4 border-t border-emerald-200 space-y-3">
                  <p className="font-semibold text-emerald-900">📊 Analysis of Your Response:</p>

                  <div className="bg-white/60 rounded-lg p-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">✓ Strengths:</p>
                      {feedback.strengths.map((item) => (
                        <p key={item} className="text-xs text-emerald-700 mt-1">• {item}</p>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-emerald-800">💡 Tips for Improvement:</p>
                      {feedback.tips.map((item) => (
                        <p key={item} className="text-xs text-emerald-700 mt-1">• {item}</p>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-emerald-800">🎯 Vocabulary Used:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {feedback.vocabularyUsed.length > 0 ? (
                          feedback.vocabularyUsed.map((word) => (
                            <span key={word} className="inline-block bg-emerald-200 text-emerald-900 px-2 py-1 rounded text-xs">
                              {word}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-700">None yet - try one of the target words!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="w-full mt-3 rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-semibold hover:bg-emerald-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            {!showAiResponse && !typedMessage && (
              <div className="rounded-3xl rounded-bl-md bg-slate-50 p-4 text-sm text-slate-500 italic">
                💬 Speak or type something above, then press Submit to see the AI response...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
