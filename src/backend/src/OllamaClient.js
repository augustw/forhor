class OllamaClient {
  constructor(options = {}) {
    this.endpoint = options.endpoint ?? 'http://localhost:11434/api/chat';
    this.model = options.model ?? 'qwen2.5:7b';
    this.timeoutMs = options.timeoutMs ?? 4 * 60 * 1000;
    this.promptTemplate = options.promptTemplate ??
      `Extrahera ord från förhörsmaterialet som ger en brottsutredare en bra översikt av vad som framkom i förhöret. 
      Saker som kan vara intressant är namn, eventuella brott och ledtrådar som kan vara intressanta för utredningen. 
      Formattera datum enligt yyyy-MM-dd hh:mm:ss. Skicka endast med hela ord eller väldigt korta meningar, inga enskilda bokstäver eller siffror. Försök hålla dig under 30 tecken.`;
  }

  async extractHighlights(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: `${this.promptTemplate}. 
              Förhörsmaterial: ${prompt}

              Returnera ENDAST en JSON-array av strings, utan extra text.
              Exempel:
              ["person", "plats", "tid", "händelse"]`,
            },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Ollama request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!data?.message?.content || typeof data.message.content !== 'string') {
      throw new Error('Invalid response from Ollama');
    }

    const content = data.message.content;
    const highlights = this.parseHighlights(content);

    if (!Array.isArray(highlights) || !highlights.every((item) => typeof item === 'string')) {
      throw new Error('Expected string[] from model');
    }

    return highlights;
  }

  parseHighlights(content) {
    const trimmed = content.trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      const jsonArrayText = this.extractFirstJsonArray(trimmed);
      if (!jsonArrayText) {
        throw new Error('Model returned invalid JSON');
      }
      return JSON.parse(jsonArrayText);
    }
  }

  extractFirstJsonArray(text) {
    const startIndex = text.indexOf('[');
    if (startIndex === -1) {
      return null;
    }

    let depth = 0;
    for (let i = startIndex; i < text.length; i += 1) {
      const char = text[i];
      if (char === '[') {
        depth += 1;
      } else if (char === ']') {
        depth -= 1;
        if (depth === 0) {
          return text.slice(startIndex, i + 1);
        }
      }
    }

    return null;
  }

  async rerankChunks(prompt, chunks) {
    // Reranka en array av chunk-objekt efter relevans för en given prompt.
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Prompt must be a non-empty string');
    }

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return [];
    }

    const promptRerankingTemplate = `
    Reranka följande Textchunks baserat på hur relevanta de är för att besvara frågan.\n
    Returnera ENDAST en JSON-array med objekt i formatet { "index": 0, "rank": 1 } där "index" motsvarar positionen i den ursprungliga listan och "rank" är ett heltal där 1 = mest relevant och 10 är minst relevant. Ingen övrig förklarande text.`;

    // Bygg en kort representation av chunks med index för säker mapping
    const shortChunks = chunks.map((c, i) => ({ index: i, text: c.chunk }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;
    try {
      console.log("Sending reranking request to Ollama with chunks:", shortChunks);
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: `${promptRerankingTemplate}\n\nFråga: ${prompt}\n\nTextchunks: ${JSON.stringify(shortChunks)}`,
            },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Ollama request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!data?.message?.content || typeof data.message.content !== 'string') {
      throw new Error('Invalid response from Ollama when reranking');
    }

    const content = data.message.content;
    // Försök parsa responsen som JSON; om det misslyckas, extrahera första JSON-arrayen
    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      const jsonArrayText = this.extractFirstJsonArray(content);
      if (!jsonArrayText) {
        throw new Error('Model returned invalid JSON for reranking');
      }
      parsed = JSON.parse(jsonArrayText);
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Expected an array from reranking response');
    }

    // Validate and map ranks
    const indexToRank = new Map();
    for (const item of parsed) {
      if (typeof item !== 'object' || item == null) continue;
      const idx = Number(item.index);
      const rank = Number(item.rank);
      if (Number.isFinite(idx) && Number.isFinite(rank)) {
        indexToRank.set(idx, rank);
      }
    }

    const ranked = chunks.map((c, i) => ({
      ...c,
      rank: indexToRank.has(i) ? indexToRank.get(i) : undefined,
    }));

    ranked.sort((a, b) => a.rank - b.rank);

    // Returnera endast de som fick en rankning
    return ranked.filter(c => c.rank);
  }

  async sammanfattning(forhortext) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const prompt = `Sammanfatta förhöret nedan i några korta meningar. 
              Fokusera på de mest relevanta och viktiga detaljerna som kan vara av intresse för en brottsutredare.
              Sammanfattningen ska vara kort och koncis, max 5 meningar eller 300 tecken.\n\n
              Förhörsmaterial: ${forhortext}`;
    console.log(`Sending sammanfattning request to Ollama with prompt:`, prompt);

    let response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Ollama request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!data?.message?.content || typeof data.message.content !== 'string') {
      throw new Error('Invalid response from Ollama for sammanfattning');
    }

    return data.message.content.trim();
  }
}

module.exports = { OllamaClient };
