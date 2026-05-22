# LinguaForge

Нативное Mac приложение для изучения английского с нуля. Без браузера, без облака, без подписок. Двойной клик и учишься.

## Что внутри
- 8-шаговый онбординг с первым мини-уроком (Луми + картинки)
- Карта юнитов и уроков по уровням CEFR (A1, A2, B1+)
- 10+ типов упражнений: перевод, аудирование, произношение, наборка предложений, диктант, заполнение пропусков
- SRS повторение по алгоритму FSRS (ts-fsrs)
- Словарь с поиском и фильтрами
- Справочник грамматики
- Чтение текстов с переводом и AI-объяснением слов в контексте
- Диалог с Mistral по сценариям
- Игры: Word Match, Speed Typing, Sentence Builder
- Геймификация: XP, streak, hearts, gems, 30+ ачивок
- Озвучка через системный голос macOS (`say`) и fallback на Web Speech
- Распознавание речи через Web Speech Recognition

## Технологии
- Electron 33 (main + renderer)
- React 18 + TypeScript + Vite
- Tailwind 3 + Framer Motion
- better-sqlite3 + Drizzle ORM
- ts-fsrs (SRS)
- Mistral SDK (с локальным кэшем в SQLite)
- Web Speech API + macOS `say`

## Сборка

Требуется macOS, Node 20+, npm.

```bash
npm install
./scripts/build-mac.sh
```

В `dist/` появится `LinguaForge-1.0.0-arm64.dmg`.

### Команды
- `npm run dev` запустить в режиме разработки
- `npm run build:mac-arm` собрать .app + .dmg для Apple Silicon
- `npm run build:mac-intel` собрать .app + .dmg для Intel

## Установка

1. Открой `LinguaForge-1.0.0-arm64.dmg`
2. Перетащи `LinguaForge.app` в `Applications`
3. Открой через Launchpad

## Обход Gatekeeper (первый запуск)

Приложение не подписано Apple Developer сертификатом ($99/год), поэтому при первом запуске macOS покажет предупреждение. Решение:

### Вариант A (до macOS 15.0)
- Правый клик на `LinguaForge.app` → `Open`
- В диалоге нажми `Open`

### Вариант B (macOS 15.1+)
- При попытке запуска появится предупреждение
- Открой `System Settings → Privacy & Security`
- Внизу будет блок `LinguaForge was blocked`
- Нажми `Open Anyway` и подтверди паролем

### Вариант C (универсальный)
В Terminal:
```bash
xattr -dr com.apple.quarantine /Applications/LinguaForge.app
```

Делается один раз. Дальше приложение запускается обычным двойным кликом.

## Где данные

```
~/Library/Application Support/LinguaForge/
├── data.db          # прогресс, SRS, статистика
├── settings.json    # настройки UI
├── logs/
└── audio-cache/
```

При переустановке данные сохраняются.

## Хоткеи
- `Cmd+1` главная
- `Cmd+2` повторить
- `Cmd+3` словарь
- `Cmd+4` грамматика
- `Cmd+5` чтение
- `Cmd+6` диалог
- `Cmd+7` аудирование
- `Cmd+8` игры
- `Cmd+9` статистика
- `Cmd+,` настройки
- `Cmd+W` закрыть окно
- `Cmd+Q` выйти

## Mistral

API-ключ зашит в коде (free-tier). Перезаписать можно в настройках или через переменную окружения `MISTRAL_API_KEY`.

## Лицензия

MIT
