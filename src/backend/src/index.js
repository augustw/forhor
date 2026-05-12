// Testkör: node src/index.js
// curl -X POST http://localhost:3000/chat   -H "Content-Type: application/json"   -d '{"prompt":"Testttt"}'
const forhorText = "Vittnet uppger att händelsen inträffade den 3 maj vid 22-tiden utanför en butik på Storgatan. Två personer, senare identifierade som A: 'Hasse Hansson' och B: 'Greta Grytlapp', sågs bråka med en tredje man, C: 'Jonny'. A bar mörk jacka och B hade ljus huva. C föll till marken efter ett slag. Vittnet hörde höga rop och såg därefter att A och B lämnade platsen snabbt i riktning mot centrum. Vittnet kan inte med säkerhet säga vem som slog, men beskriver A som den mest aggressiva. Vittnet uppmanas att lämna ytterligare detaljer vid behov";
const express = require("express");
const { z } = require("zod");
const { DBManager } = require("./DBManager");
const { OllamaClient } = require("./OllamaClient");

const app = express();
app.use(express.json());

const PORT = 3000;

const dbManager = new DBManager();
const ollamaClient = new OllamaClient();

const RequestSchema = z.object({
  prompt: z.string().min(1),
});

app.post("/chat", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  const prompt = forhorText;

  try {
    const highlights = await ollamaClient.extractHighlights(prompt);

    res.json({ text: forhorText, highlights });
  } catch (err) {
    res.status(500).json({
      error: "Failed to contact Ollama",
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
