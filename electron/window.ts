import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { getSettings, updateSettings } from './lib/settings';

const isDev = process.env.NODE_ENV === 'development';

export function createMainWindow(): BrowserWindow {
  const settings = getSettings();
  const bounds = settings.windowBounds ?? { width: 1400, height: 900 };

  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#020617',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist-react/index.html'));
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', () => {
    const b = win.getBounds();
    updateSettings({ windowBounds: b });
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}
