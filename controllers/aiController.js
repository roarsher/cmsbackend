 const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateChatResponse(req, res) {
  try {
    const { message } = req.body;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",   // use model from your list
      contents: message,
    });

    const reply = result.text;   // ✅ correct way

    res.json({ reply });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
}

module.exports = { generateChatResponse };
