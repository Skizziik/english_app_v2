import { Mistral } from '@mistralai/mistralai';

const key = process.env.MISTRAL_API_KEY || 'omuPDQIstHg8D0ZLilaqQPO1jpGJTze4';
const m = new Mistral({ apiKey: key });

const v = await m.audio.voices.list({});
const items = v.items ?? v.data ?? v.voices ?? [];
const enVoices = items.filter((x) =>
  (x.languages || []).some((l) => l.startsWith('en')),
);
console.log(`Total voices: ${items.length}, English: ${enVoices.length}`);
console.log();
for (const voice of enVoices) {
  console.log(`${voice.name}`);
  console.log(`  id: ${voice.id}`);
  console.log(`  slug: ${voice.slug}`);
  console.log(`  langs: ${(voice.languages || []).join(', ')}, gender: ${voice.gender}, tags: ${(voice.tags || []).join(', ')}`);
  console.log();
}
