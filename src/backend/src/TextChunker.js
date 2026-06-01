class TextChunker {
    constructor(options = {}) {
        this.maxChunkSize = options.maxChunkSize || 400;
        this.overlap = options.overlap || 50;
    }

    rowChunk(text) {
        const chunks = [];
        const rows = text.replace('\n\n', '\n').split('\n').filter(s => s.trim());
        for(let i = 0; i < rows.length; i++) {
            chunks.push(this.buildChunk(rows[i], i, text));
        }
        return chunks;
    }

    splitIntoSentences(text) {
        return text
            .replace(/\s+/g, " ")
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(Boolean);
    }

    smartChunk(text) {
        const sentences = this.splitIntoSentences(text);

        const chunks = [];
        let current = "";
        let chunkIndex = 0;

        // track position i originaltext
        let cursor = 0;

        for (const sentence of sentences) {
            const sentenceStart = text.indexOf(sentence, cursor);
            const sentenceEnd = sentenceStart + sentence.length;

            // 1. för lång mening → hård split
            if (sentence.length > this.maxChunkSize) {
                if (current) {
                    chunks.push(this.buildChunk(current, chunkIndex++, text));
                    current = "";
                }

                for (let i = 0; i < sentence.length; i += this.maxChunkSize) {
                    const part = sentence.slice(i, i + this.maxChunkSize);
                    chunks.push(this.buildChunk(part, chunkIndex++, text));
                }

                cursor = sentenceEnd;
                continue;
            }

            // 2. overflow → flush + overlap
            if ((current + " " + sentence).length > this.maxChunkSize) {
                chunks.push(this.buildChunk(current.trim(), chunkIndex++, text));

                current = current.slice(-this.overlap);
            }

            current += (current ? " " : "") + sentence;
            cursor = sentenceEnd;
        }

        if (current.trim()) {
            chunks.push(this.buildChunk(current.trim(), chunkIndex++, text));
        }

        return chunks;
    }

    buildChunk(textChunk, index, fullText) {
        const start = fullText.indexOf(textChunk);
        const end = start + textChunk.length;

        return {
            index,
            text: textChunk,
            start,
            end
        };
    }
}

module.exports = { TextChunker };