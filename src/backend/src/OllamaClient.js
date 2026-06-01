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
}

module.exports = { OllamaClient };
