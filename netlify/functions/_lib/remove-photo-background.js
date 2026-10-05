// Uses Gemini's image generation/editing capability to cut a player's photo
// out onto a transparent background, for the trading card portrait frame.
// This is the first image-in/image-out call in this codebase (the article
// generator only ever sends and receives text), and it has not been
// verified live from this environment (no outbound network access here).
// The exact model name and response shape are the most likely things to be
// wrong the first time this actually runs; if it fails, the error message
// below is built to say so plainly rather than hide behind a generic 500.
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

async function removePhotoBackground(base64Image, contentType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const prompt =
    "Remove the background from this photo completely, leaving only the person, on a fully transparent background. " +
    "Keep her exact pose, framing, expression, and likeness unchanged. Do not add, invent, or alter anything else in the image.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }, { inlineData: { mimeType: contentType, data: base64Image } }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const hint =
      res.status === 404
        ? ` The model "${GEMINI_IMAGE_MODEL}" may not exist or may not be available on this API key; set GEMINI_IMAGE_MODEL to the correct current image generation model name.`
        : res.status === 429
        ? " This is likely a quota limit on Gemini's image generation specifically, separate from plain text generation."
        : "";
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}${hint}`);
  }

  const data = await res.json();
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  const imagePart = parts.find((p) => p.inlineData && p.inlineData.data);
  if (!imagePart) {
    throw new Error("Gemini did not return an image for this photo. It may have responded with text instead; try again or use a different photo.");
  }

  return { dataBase64: imagePart.inlineData.data, contentType: imagePart.inlineData.mimeType || "image/png" };
}

module.exports = { removePhotoBackground };
