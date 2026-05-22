import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

export function userDataDir(): string {
  return app.getPath('userData');
}

export function dbPath(): string {
  return path.join(userDataDir(), 'data.db');
}

export function settingsPath(): string {
  return path.join(userDataDir(), 'settings.json');
}

export function logsDir(): string {
  return path.join(userDataDir(), 'logs');
}

export function audioCacheDir(): string {
  return path.join(userDataDir(), 'audio-cache');
}

export function resourcesDir(): string {
  // electron-builder packs resources into Contents/Resources/resources
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'resources');
  }
  return path.join(__dirname, '..', '..', 'resources');
}

export function ensureUserDataDirs(): void {
  for (const dir of [userDataDir(), logsDir(), audioCacheDir()]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
