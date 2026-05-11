// Testkör: node src/index.js
// curl -X POST http://localhost:3000/chat   -H "Content-Type: application/json"   -d '{"prompt":"Testttt"}'
const forhorText = "Vittnet uppger att händelsen inträffade den 3 maj vid 22-tiden utanför en butik på Storgatan. Två personer, senare identifierade som A: 'Hasse Hansson' och B: 'Greta Grytlapp', sågs bråka med en tredje man, C: 'Jonny'. A bar mörk jacka och B hade ljus huva. C föll till marken efter ett slag. Vittnet hörde höga rop och såg därefter att A och B lämnade platsen snabbt i riktning mot centrum. Vittnet kan inte med säkerhet säga vem som slog, men beskriver A som den mest aggressiva. Vittnet uppmanas att lämna ytterligare detaljer vid behov";
const highlightsPrompt = "Extrahera ord från förhörsmaterialet som ger en brottsutredare en bra översikt av vad som framkom i förhöret. Saker som kan vara intressant är namn, eventuella brott och ledtrådar som kan vara intressanta för utredningen. Formattera datum enligt yyyy-MM-dd hh:mm:ss. Skicka endast med hela ord eller meningar, inga enskilda bokstäver eller siffror";
const express = require("express");
const { z } = require("zod");
const { DBManager } = require("./DBManager");

const app = express();
app.use(express.json());

const PORT = 3000;

// Initiera databas
const dbManager = new DBManager();

// 1. Schema för inkommande request
const RequestSchema = z.object({
  prompt: z.string().min(1),
});

// 2. Schema för Ollama-svar
const OllamaResponseSchema = z.object({
  message: z.object({
    role: z.string(),
    content: z.string(),
  }),
});

// 3. Schema för highlights (string[])
const HighlightsSchema = z.array(z.string());

app.post("/chat", async (req, res) => {
  // VALIDERA INPUT
  const parsed = RequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  //const { prompt } = parsed.data;
  const prompt = forhorText;

  try {
    // 4. Anropa Ollama
    const ollamaRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5:7b",
        messages: [
          {
            role: "user",
            content: `${highlightsPrompt} Förhörsmaterial: ${prompt}

Returnera ENDAST en JSON-array av strings, utan extra text.
Exempel:
["person", "plats", "tid", "händelse"]`,
          },
        ],
        stream: false,
      }),
    });

    const data = await ollamaRes.json();

    // 5. Validera Ollama-svar
    const validated = OllamaResponseSchema.safeParse(data);

    if (!validated.success) {
      return res.status(500).json({
        error: "Invalid response from model",
        raw: data,
      });
    }

    const content = validated.data.message.content;

    // 6. Parse JSON-array
    let highlights;

    try {
      highlights = JSON.parse(content);
    } catch (err) {
      return res.status(500).json({
        error: "Model returned invalid JSON",
        raw: content,
      });
    }

    // 7. Validera att det är string[]
    const highlightsValidated = HighlightsSchema.safeParse(highlights);

    if (!highlightsValidated.success) {
      return res.status(500).json({
        error: "Expected string[] from model",
        raw: highlights,
      });
    }

    // 8. Spara till databas och returnera resultat
    await dbManager.saveForhorAndHighlights(prompt, forhorText, highlightsValidated.data);

    res.json({text: forhorText, highlights: highlightsValidated.data});

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
