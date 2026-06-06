import {
  escapeHtml,
  youtubeIdFromUrl, youtubeEmbedUrl,
  formatMinutes, totalTime, validateRecipe,
  buildGeminiPrompt, parseGeminiRecipe, CATEGORIES,
} from "../js/utils.js";

test("escapeHtml escapes angle brackets and quotes", () => {
  assertEqual(escapeHtml('<script>"x"</script>'), "&lt;script&gt;&quot;x&quot;&lt;/script&gt;");
});

test("escapeHtml returns empty string for null/undefined", () => {
  assertEqual(escapeHtml(null), "");
  assertEqual(escapeHtml(undefined), "");
});

test("youtubeIdFromUrl extracts id from watch url", () => {
  assertEqual(youtubeIdFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});

test("youtubeIdFromUrl extracts id from youtu.be url", () => {
  assertEqual(youtubeIdFromUrl("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});

test("youtubeIdFromUrl extracts id from shorts url", () => {
  assertEqual(youtubeIdFromUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});

test("youtubeIdFromUrl returns null for empty or invalid", () => {
  assertEqual(youtubeIdFromUrl(""), null);
  assertEqual(youtubeIdFromUrl("https://example.com"), null);
});

test("youtubeEmbedUrl builds embed url from any youtube url", () => {
  assertEqual(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube.com/embed/dQw4w9WgXcQ");
});

test("youtubeEmbedUrl returns null when no id", () => {
  assertEqual(youtubeEmbedUrl(""), null);
});

test("formatMinutes handles minutes only", () => {
  assertEqual(formatMinutes(45), "45 min");
});

test("formatMinutes handles whole hours", () => {
  assertEqual(formatMinutes(120), "2 h");
});

test("formatMinutes handles hours and minutes", () => {
  assertEqual(formatMinutes(90), "1 h 30 min");
});

test("formatMinutes handles zero or missing", () => {
  assertEqual(formatMinutes(0), "");
  assertEqual(formatMinutes(null), "");
});

test("totalTime sums prep and cook", () => {
  assertEqual(totalTime({ tiempo_prep: 20, tiempo_coccion: 40 }), 60);
});

test("totalTime treats missing as zero", () => {
  assertEqual(totalTime({ tiempo_prep: 20 }), 20);
});

test("validateRecipe passes with title and one ingredient and one step", () => {
  const r = { titulo: "Arroz", ingredientes: ["200g arroz"], pasos: ["Cocer"] };
  assertEqual(validateRecipe(r), []);
});

test("validateRecipe reports missing title", () => {
  const r = { titulo: "", ingredientes: ["x"], pasos: ["y"] };
  assertEqual(validateRecipe(r), ["El titulo es obligatorio"]);
});

test("validateRecipe reports empty ingredients and steps", () => {
  const r = { titulo: "X", ingredientes: [], pasos: [] };
  assertEqual(validateRecipe(r), [
    "Anade al menos un ingrediente",
    "Anade al menos un paso",
  ]);
});

test("buildGeminiPrompt includes the transcript and asks for JSON", () => {
  const prompt = buildGeminiPrompt("Para el arroz necesito agua");
  if (!prompt.includes("Para el arroz necesito agua")) throw new Error("missing transcript");
  if (!prompt.toLowerCase().includes("json")) throw new Error("missing json instruction");
});

test("parseGeminiRecipe parses clean JSON", () => {
  const raw = '{"titulo":"Arroz","ingredientes":["agua"],"pasos":["hervir"]}';
  const r = parseGeminiRecipe(raw);
  assertEqual(r.titulo, "Arroz");
  assertEqual(r.ingredientes, ["agua"]);
});

test("parseGeminiRecipe strips ```json fences", () => {
  const raw = '```json\n{"titulo":"Sopa","ingredientes":[],"pasos":[]}\n```';
  const r = parseGeminiRecipe(raw);
  assertEqual(r.titulo, "Sopa");
});

test("parseGeminiRecipe normalizes missing arrays to empty arrays", () => {
  const raw = '{"titulo":"X"}';
  const r = parseGeminiRecipe(raw);
  assertEqual(r.ingredientes, []);
  assertEqual(r.pasos, []);
});

test("parseGeminiRecipe throws on non-json", () => {
  let threw = false;
  try { parseGeminiRecipe("lo siento, no puedo"); } catch { threw = true; }
  assertEqual(threw, true);
});

test("CATEGORIES contains Postres", () => {
  assertEqual(CATEGORIES.includes("Postres"), true);
});
