import { Mistral } from '@mistralai/mistralai';
import fs from 'node:fs';

const key = process.env.MISTRAL_API_KEY || 'omuPDQIstHg8D0ZLilaqQPO1jpGJTze4';
const m = new Mistral({ apiKey: key });

const voiceId = 'c69964a6-ab8b-4f8a-9465-ec0925096ec8'; // Paul - Neutral
const slug = 'en_paul_neutral';

console.log('--- Try voiceId field ---');
try {
  const r = await m.audio.speech.complete({
    model: 'voxtral-mini-latest',
    input: 'Hello, this is a test of the LinguaForge voice.',
    voiceId,
    responseFormat: 'mp3',
  });
  const audio = r.audioData ?? r.audio_data;
  console.log('OK voiceId, audio bytes:', audio?.length);
  if (audio) {
    fs.writeFileSync('/tmp/vox1.mp3', Buffer.from(audio, 'base64'));
    console.log('saved /tmp/vox1.mp3');
  }
} catch (err) {
  console.error('FAIL voiceId:', err.statusCode, (err.body || err.message || '').toString().slice(0, 200));
}

console.log('\n--- Try voice field via catchall ---');
try {
  const r = await m.audio.speech.complete({
    model: 'voxtral-mini-latest',
    input: 'Hello world.',
    voice: voiceId,
    responseFormat: 'mp3',
  });
  const audio = r.audioData ?? r.audio_data;
  console.log('OK voice, audio bytes:', audio?.length);
} catch (err) {
  console.error('FAIL voice:', err.statusCode, (err.body || err.message || '').toString().slice(0, 200));
}

console.log('\n--- Try slug ---');
try {
  const r = await m.audio.speech.complete({
    model: 'voxtral-mini-latest',
    input: 'Hello.',
    voiceId: slug,
    responseFormat: 'mp3',
  });
  const audio = r.audioData ?? r.audio_data;
  console.log('OK slug, audio bytes:', audio?.length);
} catch (err) {
  console.error('FAIL slug:', err.statusCode, (err.body || err.message || '').toString().slice(0, 200));
}
