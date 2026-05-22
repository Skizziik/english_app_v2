// Defensive: clear ELECTRON_RUN_AS_NODE if a parent shell set it,
// otherwise Electron behaves as plain Node and require('electron') breaks.
if (process.env.ELECTRON_RUN_AS_NODE) delete process.env.ELECTRON_RUN_AS_NODE;

import { app, BrowserWindow, dialog, nativeTheme } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { createMainWindow } from './window';
import { buildAppMenu } from './menu';
import { registerAllIpcHandlers } from './ipc/handlers';
import { initDatabase } from './db';
import { ensureUserDataDirs, logsDir } from './lib/paths';
import { initSettings } from './lib/settings';

app.setName('LinguaForge');

let mainWindow: BrowserWindow | null = null;

function logToFile(msg: string) {
  try {
    const dir = logsDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'main.log'), `[${new Date().toISOString()}] ${msg}\n`);
  } catch {
    // best-effort
  }
}

async function bootstrap() {
  try {
    ensureUserDataDirs();
    logToFile('userdata dirs ok');
    await initDatabase();
    logToFile('db ok');
    initSettings();
    logToFile('settings ok');
    registerAllIpcHandlers();
    logToFile('handlers registered');

    nativeTheme.themeSource = 'dark';
    mainWindow = createMainWindow();
    logToFile('window created');
    buildAppMenu(mainWindow);
    logToFile('menu built');
  } catch (err: any) {
    logToFile('bootstrap error: ' + (err?.stack || err?.message || String(err)));
    dialog.showErrorBox('LinguaForge: ошибка запуска', err?.message ?? String(err));
    app.quit();
  }
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
    buildAppMenu(mainWindow);
  }
});

process.on('uncaughtException', (err) => {
  logToFile('uncaughtException: ' + (err?.stack || err?.message || String(err)));
  console.error('[main] uncaughtException', err);
});

process.on('unhandledRejection', (reason: any) => {
  logToFile('unhandledRejection: ' + (reason?.stack || reason?.message || String(reason)));
  console.error('[main] unhandledRejection', reason);
});
