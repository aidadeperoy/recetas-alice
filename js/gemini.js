import { GEMINI_API_KEY, GEMINI_MODEL } from "./config.js";
import { buildGeminiPrompt, parseGeminiRecipe } from "./utils.js";

export async function structureRecipe(transcript) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const body = {
    model: GEMINI_MODEL,
    messages: [{ role: "user", content: buildGeminiPrompt(transcript) }],
    temperature: 0.2,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq error ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content || "";
  return parseGeminiRecipe(text);
}
