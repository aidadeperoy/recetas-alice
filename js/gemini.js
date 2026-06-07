import { GEMINI_API_KEY, GEMINI_MODEL } from "./config.js";
import { buildGeminiPrompt, parseGeminiRecipe } from "./utils.js";

export async function structureRecipe(transcript) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: buildGeminiPrompt(transcript) }] }],
    generationConfig: { temperature: 0.2 },
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
    throw new Error(`Gemini error ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseGeminiRecipe(text);
}
