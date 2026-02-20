const { GoogleGenAI } = require("@google/genai");

let ai = null;

function getClient() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

async function getNamesForImage(preparedImage) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const client = getClient();

  const response = await client.models.generateContent({
    model: "gemma-3-4b-it",
    contents: [
      {
        inlineData: {
          mimeType: preparedImage.mimeType,
          data: preparedImage.base64,
        },
      },
      {
        text: "Look at this image carefully. If it contains a cat (domestic or wild), respond ONLY with a JSON array of exactly 4 unique names based directly and specifically on the cat's visible features, drawing inspiration across different cultures and nations. Example: [\"Tora\",\"Baghira\",\"Koshka\",\"Gato\"]. If the image does NOT contain a cat, respond ONLY with exactly: {\"notACat\":true}. No explanation, no other text, just the JSON.",
      },
    ],
  });

  const raw = (response.text || "").trim();

  if (!raw) {
    throw new Error("Gemini response did not contain text output");
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Unable to parse names array from Gemini response");
    }
    parsed = JSON.parse(raw.slice(start, end + 1));
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.notACat) {
    const err = new Error("That doesn't look like a cat. Please upload a photo of a cat!");
    err.statusCode = 422;
    throw err;
  }

  const names = Array.isArray(parsed) ? parsed : [];

  return names
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, 4);
}

module.exports = {
  getNamesForImage,
};
