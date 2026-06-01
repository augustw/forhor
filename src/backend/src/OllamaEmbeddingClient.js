class OllamaEmbeddingClient {
  constructor(options = {}) {
    this.endpoint = options.endpoint ?? 'http://localhost:11434/api/embed';
    this.model = options.model ?? 'nomic-embed-text';
    this.timeoutMs = options.timeoutMs ?? 120000;
  }

  async embed(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          input: text,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Ollama embedding request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Ollama embedding failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data?.embeddings || !Array.isArray(data.embeddings)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    if (data.embeddings.length === 0) {
      throw new Error('No embeddings returned from Ollama');
    }

    // Return the first embedding if it's a single text
    return data.embeddings[0];
  }

  async embedMultiple(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          input: texts,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Ollama embedding request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Ollama embedding failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data?.embeddings || !Array.isArray(data.embeddings)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    if (data.embeddings.length !== texts.length) {
      throw new Error(
        `Expected ${texts.length} embeddings but got ${data.embeddings.length}`
      );
    }

    return data.embeddings;
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must be of the same length');
    }

    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0; // Avoid division by zero; treat zero-vector similarity as 0
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
}

module.exports = { OllamaEmbeddingClient };
