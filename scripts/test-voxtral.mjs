import { Mistral } from '@mistralai/mistralai';
import fs from 'node:fs';

const key = process.env.MISTRAL_API_KEY || 'omuPDQIstHg8D0ZLilaqQPO1jpGJTze4';
const m = new Mistral({ apiKey: key });

console.log('Testing chat...');
try {
  const chat = await m.chat.complete({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: 'Say hi briefly' }],
  });
  console.log('CHAT OK:', chat.choices[0].message.content.slice(0, 80));
} catch (err) {
  console.error('CHAT FAILED:', err.statusCode, err.body || err.message);
}

console.log('\nTesting voxtral TTS...');
const candidates = ['voxtral-mini-latest', 'voxtral-mini-tts-2603', 'voxtral-tts-mini', 'voxtral-mini'];
for (const model of candidates) {
  try {
    const tts = await m.audio.speech.complete({
      model,
      input: 'Hello world',
      responseFormat: 'mp3',
    });
    const audio = tts.audioData ?? tts.audio_data;
    if (audio) {
      console.log(`TTS OK with model=${model}: ${audio.length} chars of base64`);
      fs.writeFileSync('/tmp/voxtral-test.mp3', Buffer.from(audio, 'base64'));
      console.log('  saved to /tmp/voxtral-test.mp3');
      break;
    }
    console.log(`TTS empty with model=${model}`);
  } catch (err) {
    console.error(`TTS FAILED with model=${model}:`, err.statusCode || '', (err.body || err.message || '').toString().slice(0, 200));
  }
}

console.log('\nTesting voice list...');
try {
  const v = await m.audio.voices.list({});
  console.log('VOICES:', JSON.stringify(v).slice(0, 300));
} catch (err) {
  console.error('VOICES FAILED:', err.statusCode, (err.body || err.message || '').toString().slice(0, 200));
}
