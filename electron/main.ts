import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'node:path';
import { createMainWindow } from './window';
import { buildAppMenu } from './menu';
import { registerAllIpcHandlers } from './ipc/handlers';
import { initDatabase } from './db';
import { ensureUserDataDirs } from './lib/paths';
import { initSettings } from './lib/settings';

let mainWindow: BrowserWindow | null = null;

async function bootstrap() {
  ensureUserDataDirs();
  await initDatabase();
  initSettings();
  registerAllIpcHandlers();

  nativeTheme.themeSource = 'dark';
  mainWindow = createMainWindow();
  buildAppMenu(mainWindow);
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
  console.error('[main] uncaughtException', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection', reason);
});
