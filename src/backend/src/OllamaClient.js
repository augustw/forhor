class OllamaClient {
  constructor(options = {}) {
    this.endpoint = options.endpoint ?? 'http://localhost:11434/api/chat';
    this.model = options.model ?? 'qwen2.5:7b';
    this.promptTemplate = options.promptTemplate ??
      `Extrahera ord från förhörsmaterialet som ger en brottsutredare en bra översikt av vad som framkom i förhöret. Saker som kan vara intressant är namn, eventuella brott och ledtrådar som kan vara intressanta för utredningen. Formattera datum enligt yyyy-MM-dd hh:mm:ss. Skicka endast med hela ord eller meningar, inga enskilda bokstäver eller siffror`;
  }

  async extractHighlights(prompt) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: `${this.promptTemplate} Förhörsmaterial: ${prompt}

Returnera ENDAST en JSON-array av strings, utan extra text.
Exempel:
["person", "plats", "tid", "händelse"]`,
          },
        ],
        stream: false,
      }),
    });

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
    try {
      return JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\[.*\]/s);
      if (!jsonMatch) {
        throw new Error('Model returned invalid JSON');
      }
      return JSON.parse(jsonMatch[0]);
    }
  }
}

module.exports = { OllamaClient };
