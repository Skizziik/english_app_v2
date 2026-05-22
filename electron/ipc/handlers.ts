import { registerTtsHandlers } from './tts-handlers';
import { registerSettingsHandlers } from './settings-handlers';
import { registerDbHandlers } from './db-handlers';
import { registerMistralHandlers } from './mistral-handlers';

export function registerAllIpcHandlers(): void {
  registerSettingsHandlers();
  registerDbHandlers();
  registerTtsHandlers();
  registerMistralHandlers();
}
