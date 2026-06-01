const { TextChunker } = require('../TextChunker');

const textChunker = new TextChunker({ maxChunkSize: 400, overlap: 0 });
const { OllamaEmbeddingClient } = require('../OllamaEmbeddingClient');
const ollamaEmbeddingClient = new OllamaEmbeddingClient();
const text = `Förhörsobjekt: Johan Berg, bagagehanterare
Plats: Luleå Airport
Förhörsledare: Konstapel Fläskläpp

Fläskläpp: Du arbetade kvällsskiftet den 14 april?
Johan: Ja, från fem till midnatt ungefär.

Fläskläpp: Såg du något ovanligt?
Johan: Det var två resväskor som stack ut. De var ovanligt tunga och hade inga vanliga bagagetaggar. Bara handskrivna lappar.

Fläskläpp: Vem hanterade väskorna?
Johan: En man i mörkgrön jacka lämnade dem sent vid incheckningen. Han verkade stressad.

Fläskläpp: Kan du beskriva honom?
Johan: Kort skägg, runt fyrtio. Han pratade svenska men med finsk brytning.

Fläskläpp: Något mer?
Johan: Jag hörde honom säga till en annan person att “bilen måste bort innan kontrollen börjar”.

Fläskläpp: Vilken bil?
Johan: Ingen aning. Men senare såg jag en svart skåpbil stå bakom fraktterminalen. Motorn var igång hela tiden.

Fläskläpp: Gjorde du någon anmälan då?
Johan: Nej… jag trodde bara det var smuggelgods eller något svartjobb.`;


const chunks = textChunker.rowChunk(text);

chunks.forEach((chunk, index) => {
    console.log("Chunk", chunk);
    const embedding = ollamaEmbeddingClient.embed(chunk.text);
    embedding.then((embedding) => {
    console.log(`Embedding`, embedding);
    }).catch((err) => {        console.error(`Error embedding chunk #${index}:`, err);
})
});