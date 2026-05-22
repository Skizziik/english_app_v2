import { ipcMain } from 'electron';
import { spawn, ChildProcess } from 'node:child_process';

export const MAC_ENGLISH_VOICES = [
  { id: 'Samantha', name: 'Samantha (US, ж)', lang: 'en_US' },
  { id: 'Alex', name: 'Alex (US, м)', lang: 'en_US' },
  { id: 'Ava', name: 'Ava (US, ж)', lang: 'en_US' },
  { id: 'Tom', name: 'Tom (US, м)', lang: 'en_US' },
  { id: 'Daniel', name: 'Daniel (UK, м)', lang: 'en_GB' },
  { id: 'Karen', name: 'Karen (AU, ж)', lang: 'en_AU' },
];

let activeProc: ChildProcess | null = null;

function speak(text: string, voice = 'Samantha', rate = 200): Promise<void> {
  return new Promise((resolve, reject) => {
    if (activeProc && !activeProc.killed) {
      try {
        activeProc.kill();
      } catch {
        // ignore
      }
    }
    const proc = spawn('say', ['-v', voice, '-r', String(rate), text]);
    activeProc = proc;
    proc.on('exit', (code) => {
      activeProc = null;
      if (code === 0 || code === null) resolve();
      else reject(new Error(`say exit ${code}`));
    });
    proc.on('error', (err) => {
      activeProc = null;
      reject(err);
    });
  });
}

function stop(): void {
  if (activeProc && !activeProc.killed) {
    try {
      activeProc.kill();
    } catch {
      // ignore
    }
    activeProc = null;
  }
}

export function registerTtsHandlers(): void {
  ipcMain.handle('tts:speak', async (_e, { text, voice, rate }: { text: string; voice?: string; rate?: number }) => {
    if (process.platform !== 'darwin') {
      throw new Error('TTS via say only on macOS');
    }
    return speak(text, voice ?? 'Samantha', rate ?? 200);
  });
  ipcMain.handle('tts:listVoices', async () => MAC_ENGLISH_VOICES);
  ipcMain.handle('tts:stop', async () => stop());
}
