import { ipcMain } from 'electron';
import { getSettings, updateSettings } from '../lib/settings';

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:set', (_e, patch) => updateSettings(patch ?? {}));
}
