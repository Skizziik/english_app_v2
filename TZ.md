# Техническое задание: LinguaForge (Mac Desktop App)

Нативное десктоп-приложение для macOS для изучения английского языка с нуля. Открывается двойным кликом из Finder. Без Xcode. Без браузера. Документ предназначен для Claude Code.

---

## 0. КОНТЕКСТ ДЛЯ CLAUDE CODE

### Кто пользователь
Максим, нулевое знание английского, нужно начать с самого начала. Платформа: macOS (актуальная версия Sequoia / Sonoma на Apple Silicon или Intel). Один локальный пользователь.

### Главная цель
Получить файл `LinguaForge.app`, который лежит в папке `/Applications` (или в Downloads), открывается двойным кликом и работает как обычная мак-приложуха. Иконка в Dock, своё окно, своё меню вверху экрана, нативные системные диалоги.

### Чего НЕ делаем
- Никакого Xcode и Swift
- Никакого `npm run dev` и браузера при каждом запуске
- Никакого аккаунта Apple Developer за $99/год
- Никакой регистрации, логинов, облака
- Никаких мобильных версий (только Mac)
- Никакого деплоя на сервер

### Главный принцип проектирования
Plug and Play. Один скрипт `build-mac.sh` собирает `.app` файл. Пользователь перетаскивает его в Applications и запускает. Внутри уже всё: словари, БД, движок, иконка. Интернет нужен только для AI-функций (Mistral) и опционально для качественного TTS.

### Главный принцип обучения
Супер плавное начало. Первые 5 минут пользователь должен почувствовать прогресс и НЕ испытать фрустрации. Сначала распознавание, потом узнавание, потом воспроизведение.

### Принципы кода
- TypeScript везде, strict mode
- Никаких длинных тире (—) и средних тире (–) в UI текстах, заголовках, комментариях, инстракшнах. Использовать двоеточие, запятую или дефис (-)
- Все UI тексты на русском (целевой пользователь русскоязычный)
- Тёмная тема по умолчанию, светлая опционально
- Mac-native ощущение: горячие клавиши Cmd+что-то, нативное меню в menubar

---

## 1. СТЕК ТЕХНОЛОГИЙ

### Главное решение: Electron + React + TypeScript

**Почему Electron, а не Tauri:**
- Tauri требует знания Rust для системных команд
- Tauri использует WebKit на Mac, что даёт расхождения с Chrome (Web Speech API хуже)
- Electron использует Chromium, поэтому Web Speech API и Speech Recognition работают идеально
- Claude Code в TS/JS-only стеке сделает меньше ошибок
- Размер `.app` 150 МБ - это нормально для локальной приложухи

### Подробный стек:

| Слой | Технология | Назначение |
|------|------------|------------|
| Shell | Electron 33+ | Обёртка .app, окно, меню, IPC |
| Билдер | electron-builder | Сборка .app и .dmg |
| Фронтенд | React 18 + TypeScript | UI |
| Сборка фронта | Vite | Быстрая разработка |
| Стилизация | Tailwind CSS 4 | Утилитарные классы |
| Компоненты | shadcn/ui | Копируемые в проект компоненты |
| Состояние клиента | Zustand | Лёгкий state manager |
| База данных | SQLite через better-sqlite3 | Локальная БД, один файл |
| ORM | Drizzle ORM | Типобезопасные миграции и запросы |
| AI | Mistral (@mistralai/mistralai) | Чат, проверка, генерация |
| TTS | Web Speech API + macOS say команда | Озвучка |
| STT | Web Speech Recognition API | Распознавание речи |
| SRS | ts-fsrs (npm) | Алгоритм повторений |
| Звуки UI | Howler.js | Звуки правильно/неправильно |
| Анимации | Framer Motion | Плавные переходы |
| Иконки | Lucide React | Набор иконок |
| Графики | Recharts | Статистика |
| Валидация | Zod | Схемы данных |
| Даты | date-fns | Работа с датами |
| Тосты | Sonner | Уведомления |

### Архитектура процессов Electron:

```
┌────────────────────────────────────────────────┐
│                LinguaForge.app                 │
│                                                │
│  ┌────────────────┐    IPC    ┌──────────────┐ │
│  │  Main Process  │ ◄────────► │   Renderer   │ │
│  │   (Node.js)    │            │  (React UI)  │ │
│  │                │            │              │ │
│  │  - SQLite      │            │  - все       │ │
│  │  - Mistral API │            │    экраны    │ │
│  │  - say команда │            │  - Web       │ │
│  │  - файловая    │            │    Speech    │ │
│  │    система     │            │  - локальный │ │
│  │  - меню        │            │    стейт     │ │
│  └────────────────┘            └──────────────┘ │
└────────────────────────────────────────────────┘
```

Main Process отвечает за всё что требует системных вызовов и Node API. Renderer это React приложение. Общаются через IPC (`ipcMain.handle` / `ipcRenderer.invoke`).

---

## 2. КАК ЭТО РАБОТАЕТ ДЛЯ ПОЛЬЗОВАТЕЛЯ

### Сценарий 1: Первая установка
1. Максим получает файл `LinguaForge-1.0.0-arm64.dmg` (или `-x64.dmg` для Intel)
2. Двойной клик: открывается окно DMG с иконкой приложения и стрелкой на папку Applications
3. Перетаскивает `LinguaForge.app` в Applications
4. Открывает Launchpad, кликает на LinguaForge

### Сценарий 2: Обход Gatekeeper (первый запуск)

Так как приложение не подписано Apple Developer сертификатом ($99/год), при первом запуске macOS покажет предупреждение. Решение:

**Вариант A: правый клик > Open (работает до macOS 15.0)**
- Правый клик на иконке `LinguaForge.app`
- Выбрать `Open` в контекстном меню
- В диалоге нажать `Open`

**Вариант B: System Settings (работает на 15.1+)**
- При попытке запуска появится "приложение не может быть открыто"
- Открыть `System Settings > Privacy & Security`
- Внизу будет блок "LinguaForge was blocked"
- Нажать `Open Anyway`
- Подтвердить паролем

**Вариант C: терминальная команда (универсальный, как fallback)**
- Открыть Terminal
- `xattr -dr com.apple.quarantine /Applications/LinguaForge.app`
- Запустить приложение нормально

Это нужно сделать ОДИН РАЗ при первом запуске. Дальше работает как обычная мак-приложуха.

В `README.md` дай чёткую пошаговую инструкцию с скриншотами или текстовыми описаниями для всех 3 вариантов.

### Сценарий 3: Обычное использование
1. Cmd+Space, набирает "Lingua", Enter
2. Открывается окно приложения
3. Учится
4. Cmd+W или Cmd+Q закрывает
5. Прогресс сохранён в локальной БД в `~/Library/Application Support/LinguaForge/data.db`

### Сценарий 4: Где хранятся данные

Electron предоставляет `app.getPath('userData')` который на Mac возвращает `~/Library/Application Support/LinguaForge/`. Внутри:

```
~/Library/Application Support/LinguaForge/
├── data.db                  # SQLite база (прогресс, SRS, статистика)
├── mistral-cache.db         # отдельный кеш Mistral ответов
├── settings.json            # настройки UI
├── logs/                    # логи приложения
└── audio-cache/             # опционально кеш аудио (если используем не Web Speech)
```

При первом запуске эти файлы создаются автоматически. Если пользователь удаляет приложение и переустанавливает, данные сохраняются.

---

## 3. СТРУКТУРА ПРОЕКТА

```
linguaforge/
├── README.md                        # Инструкция установки на Mac
├── package.json
├── tsconfig.json
├── electron-builder.yml             # Конфиг сборки .app и .dmg
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── .env.example                     # шаблон env
├── .gitignore
│
├── build/                           # ресурсы для сборки
│   ├── icon.icns                    # иконка macOS (1024х1024)
│   ├── icon.png                     # для других платформ
│   ├── background.png               # фон для DMG
│   └── entitlements.mac.plist       # права для microphone
│
├── scripts/
│   ├── build-mac.sh                 # ОДНА команда: собрать .app и .dmg
│   ├── dev.sh                       # запуск в режиме разработки
│   ├── build-dictionary.ts          # сборка словаря из открытых источников
│   ├── seed-db.ts                   # засев начальной БД
│   └── package-resources.ts         # упаковка словарей в asar
│
├── resources/                       # упаковываются внутрь .app
│   ├── seed-data/
│   │   ├── words_a1.json            # ~500 слов A1 с переводами
│   │   ├── words_a2.json            # ~1000 слов A2
│   │   ├── words_b1.json            # ~1500 слов B1
│   │   ├── words_b2.json            # ~2000 слов B2
│   │   ├── words_c1.json            # ~2000 слов C1
│   │   ├── grammar_topics.json
│   │   ├── lessons_path.json
│   │   ├── phrases.json
│   │   ├── stories.json
│   │   └── achievements.json
│   ├── sounds/
│   │   ├── correct.mp3
│   │   ├── wrong.mp3
│   │   ├── lesson-complete.mp3
│   │   ├── streak-fire.mp3
│   │   └── ui-click.mp3
│   └── images/
│       ├── mascot/                  # картинки маскота (несколько эмоций)
│       └── vocab/                   # ~200 картинок для базовых слов A1
│
├── electron/                        # Main Process
│   ├── main.ts                      # точка входа
│   ├── preload.ts                   # preload script (IPC bridge)
│   ├── menu.ts                      # нативное меню Mac
│   ├── window.ts                    # создание BrowserWindow
│   ├── ipc/
│   │   ├── handlers.ts              # все ipcMain.handle регистрации
│   │   ├── db-handlers.ts           # работа с SQLite
│   │   ├── mistral-handlers.ts      # запросы к Mistral
│   │   ├── tts-handlers.ts          # macOS say команда
│   │   └── settings-handlers.ts
│   ├── db/
│   │   ├── index.ts                 # инициализация Drizzle
│   │   ├── schema.ts                # все таблицы
│   │   ├── migrations/              # автогенерируемые
│   │   └── seed.ts                  # первоначальный засев
│   ├── lib/
│   │   ├── mistral-client.ts        # обёртка Mistral
│   │   ├── mistral-cache.ts         # SQLite кеш ответов
│   │   ├── mac-say.ts               # обёртка над командой `say`
│   │   └── paths.ts                 # пути к userData
│   └── types/
│       └── ipc.ts                   # типы IPC контракта
│
├── src/                             # Renderer Process (React)
│   ├── main.tsx                     # точка входа React
│   ├── App.tsx                      # корневой компонент
│   ├── index.css                    # Tailwind imports
│   │
│   ├── screens/                     # экраны (роутинг через react-router)
│   │   ├── Onboarding.tsx           # 8 шагов онбординга
│   │   ├── Home.tsx                 # главный хаб (карта уроков)
│   │   ├── Lesson.tsx               # экран урока
│   │   ├── Review.tsx               # SRS повторение
│   │   ├── Dictionary.tsx           # словарь и поиск
│   │   ├── Grammar.tsx              # грамматика
│   │   ├── GrammarTopic.tsx         # одна тема грамматики
│   │   ├── Stories.tsx              # список текстов
│   │   ├── Story.tsx                # чтение текста
│   │   ├── Chat.tsx                 # AI собеседник
│   │   ├── Listening.tsx            # аудирование
│   │   ├── Games.tsx                # хаб игр
│   │   ├── games/
│   │   │   ├── WordMatch.tsx
│   │   │   ├── SpeedTyping.tsx
│   │   │   ├── FillBlank.tsx
│   │   │   └── SentenceBuilder.tsx
│   │   ├── Stats.tsx                # статистика
│   │   └── Settings.tsx
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn компоненты
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── TitleBar.tsx         # кастомный titlebar для Mac
│   │   │   └── Mascot.tsx
│   │   ├── exercises/               # 15+ типов упражнений
│   │   │   ├── TranslationMC.tsx
│   │   │   ├── ReverseTranslationMC.tsx
│   │   │   ├── WordBank.tsx
│   │   │   ├── Typing.tsx
│   │   │   ├── ListeningType.tsx
│   │   │   ├── ListeningMC.tsx
│   │   │   ├── Speak.tsx
│   │   │   ├── Matching.tsx
│   │   │   ├── FillBlank.tsx
│   │   │   ├── ImageWord.tsx
│   │   │   ├── TransformSentence.tsx
│   │   │   ├── Dictation.tsx
│   │   │   ├── FlashcardSRS.tsx
│   │   │   ├── Cloze.tsx
│   │   │   ├── FreeWriting.tsx
│   │   │   └── AIConversation.tsx
│   │   ├── Flashcard.tsx
│   │   ├── WordCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StreakDisplay.tsx
│   │   ├── HeartsDisplay.tsx
│   │   ├── XpDisplay.tsx
│   │   ├── AchievementToast.tsx
│   │   └── LessonTree.tsx           # визуализация карты уроков
│   │
│   ├── stores/                      # Zustand
│   │   ├── userStore.ts             # XP, hearts, streak
│   │   ├── lessonStore.ts           # текущий урок
│   │   └── settingsStore.ts
│   │
│   ├── hooks/
│   │   ├── useIPC.ts                # обёртка над window.api
│   │   ├── useTTS.ts                # Web Speech API
│   │   ├── useSTT.ts                # Speech Recognition
│   │   ├── useShortcuts.ts          # Cmd+что-то горячие клавиши
│   │   └── useSounds.ts             # эффекты
│   │
│   ├── lib/
│   │   ├── srs/
│   │   │   ├── fsrs.ts              # обёртка над ts-fsrs
│   │   │   └── scheduler.ts         # подбор карточек на сегодня
│   │   ├── gamification/
│   │   │   ├── xp.ts
│   │   │   ├── streak.ts
│   │   │   ├── hearts.ts
│   │   │   └── achievements.ts
│   │   └── utils.ts
│   │
│   └── types/
│       └── index.ts
│
└── dist/                            # автоматически генерируется
    ├── LinguaForge-1.0.0-arm64.dmg
    ├── LinguaForge-1.0.0-x64.dmg
    └── mac/LinguaForge.app
```

---

## 4. КОНФИГУРАЦИЯ ELECTRON-BUILDER

Это критично для того, чтобы `.app` собирался правильно. Конфиг в `electron-builder.yml`:

```yaml
appId: com.linguaforge.app
productName: LinguaForge
copyright: Copyright © 2026

directories:
  output: dist
  buildResources: build

files:
  - "dist-electron/**/*"
  - "dist-react/**/*"
  - "node_modules/**/*"
  - "package.json"

extraResources:
  - from: resources
    to: resources
    filter: ["**/*"]

mac:
  category: public.app-category.education
  icon: build/icon.icns
  target:
    - target: dmg
      arch: [arm64, x64]
    - target: zip
      arch: [arm64, x64]
  hardenedRuntime: false
  gatekeeperAssess: false
  identity: null              # ВАЖНО: не подписываем
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  extendInfo:
    NSMicrophoneUsageDescription: "Для упражнений на произношение нужен доступ к микрофону"
    NSSpeechRecognitionUsageDescription: "Для распознавания речи при произношении слов"

dmg:
  title: "Install LinguaForge"
  icon: build/icon.icns
  background: build/background.png
  contents:
    - x: 130
      y: 220
      type: file
    - x: 410
      y: 220
      type: link
      path: /Applications
  window:
    width: 540
    height: 380
```

### entitlements.mac.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTD/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.device.audio-input</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

### Команды сборки в package.json

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"electron-vite dev\"",
    "build:react": "vite build",
    "build:electron": "tsc -p electron/tsconfig.json",
    "build:all": "npm run build:react && npm run build:electron",
    "build:mac": "npm run build:all && electron-builder --mac",
    "build:mac-arm": "npm run build:all && electron-builder --mac --arm64",
    "build:mac-intel": "npm run build:all && electron-builder --mac --x64",
    "db:generate": "drizzle-kit generate",
    "build-dict": "tsx scripts/build-dictionary.ts"
  }
}
```

### Скрипт scripts/build-mac.sh

```bash
#!/bin/bash
set -e

echo "🧹 Чищу старые билды..."
rm -rf dist dist-electron dist-react

echo "📦 Устанавливаю зависимости..."
npm install

echo "🏗️  Собираю React..."
npm run build:react

echo "🏗️  Собираю Electron Main..."
npm run build:electron

echo "📚 Подготавливаю ресурсы..."
npm run build-dict

echo "🍎 Собираю .app для Apple Silicon..."
npx electron-builder --mac --arm64

echo "✅ Готово!"
echo ""
echo "Файлы:"
ls -lh dist/*.dmg
echo ""
echo "Чтобы установить:"
echo "  1. Открой dist/LinguaForge-1.0.0-arm64.dmg"
echo "  2. Перетащи LinguaForge в Applications"
echo "  3. Открой через Launchpad"
echo "  4. Если macOS блокирует: System Settings > Privacy & Security > Open Anyway"
```

---

## 5. ОЗВУЧКА: ДВУХУРОВНЕВАЯ СИСТЕМА

Озвучка критична. Должна работать с момента первого запуска без интернета. Реализуем два уровня:

### Уровень 1 (основной): macOS команда `say`

Mac имеет встроенные ТОПОВЫЕ голоса (Samantha, Alex, Daniel, Karen, Tom, Ava) которые доступны через системную команду `say`. Они уже установлены, не требуют интернета, звучат лучше чем Web Speech API в большинстве случаев.

```typescript
// electron/lib/mac-say.ts
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

/** Список голосов macOS для английского */
export const MAC_ENGLISH_VOICES = [
  { id: 'Samantha', name: 'Samantha (US, ж)', lang: 'en_US' },
  { id: 'Alex',     name: 'Alex (US, м)',     lang: 'en_US' },
  { id: 'Ava',      name: 'Ava (US, ж)',      lang: 'en_US' },
  { id: 'Tom',      name: 'Tom (US, м)',      lang: 'en_US' },
  { id: 'Daniel',   name: 'Daniel (UK, м)',   lang: 'en_GB' },
  { id: 'Karen',    name: 'Karen (AU, ж)',    lang: 'en_AU' },
];

/** Произнести текст голосом macOS. Возвращает promise завершения. */
export function speakWithSay(text: string, voice = 'Samantha', rate = 200): Promise<void> {
  return new Promise((resolve, reject) => {
    // -v voice, -r rate (words per minute, default 175-200)
    const proc = spawn('say', ['-v', voice, '-r', String(rate), text]);
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`say exit ${code}`)));
    proc.on('error', reject);
  });
}

/** Сгенерировать аудиофайл для дальнейшего воспроизведения */
export async function generateAudioFile(text: string, voice = 'Samantha'): Promise<string> {
  const filename = join(tmpdir(), `lf-${Date.now()}.aiff`);
  await new Promise((resolve, reject) => {
    const proc = spawn('say', ['-v', voice, '-o', filename, text]);
    proc.on('exit', code => code === 0 ? resolve(null) : reject(new Error('say failed')));
    proc.on('error', reject);
  });
  return filename;
}
```

Регистрируется как IPC handler:

```typescript
// electron/ipc/tts-handlers.ts
ipcMain.handle('tts:speak', async (_, { text, voice, rate }) => {
  return speakWithSay(text, voice, rate);
});
ipcMain.handle('tts:listVoices', async () => {
  return MAC_ENGLISH_VOICES;
});
```

В renderer вызывается через `window.api.tts.speak(...)`.

### Уровень 2 (запасной): Web Speech API

Если по какой-то причине `say` не сработал (старая macOS, нет голоса), фолбэк на Web Speech API в renderer.

```typescript
// src/hooks/useTTS.ts
export function useTTS() {
  const speak = async (text: string, opts?: { voice?: string; rate?: number }) => {
    try {
      // Сначала пробуем macOS say
      await window.api.tts.speak({ text, voice: opts?.voice ?? 'Samantha', rate: opts?.rate ?? 200 });
    } catch {
      // Фолбэк на Web Speech
      if ('speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'en-US';
        utt.rate = (opts?.rate ?? 200) / 200;
        window.speechSynthesis.speak(utt);
      }
    }
  };
  return { speak };
}
```

### Распознавание речи (STT)

Web Speech Recognition API работает в Electron (Chromium). Нужно только разрешить микрофон через entitlements (уже выше).

```typescript
// src/hooks/useSTT.ts
export function useSTT(onResult: (text: string) => void) {
  const start = () => {
    const SR = (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
    rec.start();
    return rec;
  };
  return { start };
}
```

Сравнение результата STT с эталоном: Levenshtein distance, порог >= 0.85 = правильно, 0.7-0.85 = почти, ниже = неправильно.

---

## 6. БАЗА ДАННЫХ (DRIZZLE + SQLITE)

Расположение БД: `app.getPath('userData') + '/data.db'`. При первом запуске:
- Если файла нет, создаётся
- Применяются миграции из встроенных в `.app` ресурсов
- Засев из `resources/seed-data/*.json`

### Таблица users
Один локальный пользователь.

```
id: integer primary key
name: text                          // вводится в онбординге
nativeLanguage: text default 'ru'
targetLanguage: text default 'en'
currentLevel: text                  // 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
dailyGoalMinutes: integer           // 5, 10, 15, 20, 30
preferredLearningTime: text         // HH:MM для напоминаний
createdAt: timestamp
lastActiveAt: timestamp
onboardingCompleted: boolean default false
```

### Таблица user_stats
Геймификация.

```
userId: integer primary key
totalXp: integer default 0
currentStreak: integer default 0
longestStreak: integer default 0
lastStreakDate: text                // YYYY-MM-DD
hearts: integer default 5
heartsRefillAt: timestamp
gems: integer default 0
streakFreezes: integer default 0    // максимум 2
weeklyXp: integer default 0
```

### Таблица words (ЯДРО ПРИЛОЖЕНИЯ)

```
id: integer primary key
english: text NOT NULL              // 'book'
russian: text NOT NULL              // 'книга'
partOfSpeech: text                  // 'noun' | 'verb' | 'adj' | ...
cefrLevel: text                     // 'A1' | 'A2' | ...
ipa: text                           // '/bʊk/'
frequencyRank: integer              // ранг частотности
topic: text                         // 'food', 'family', 'travel'
exampleEn: text
exampleRu: text
imageUrl: text                      // относительный путь к ресурсу
synonyms: text                      // JSON массив
antonyms: text                      // JSON массив
collocations: text                  // JSON массив
notes: text
```

Индексы на: `english`, `cefrLevel`, `topic`, `frequencyRank`.

### Таблица user_words (SRS состояние)

```
id: integer primary key
userId: integer
wordId: integer
// FSRS параметры
stability: real default 0
difficulty: real default 0
elapsedDays: integer default 0
scheduledDays: integer default 0
reps: integer default 0
lapses: integer default 0
state: integer                      // 0=New, 1=Learning, 2=Review, 3=Relearning
lastReview: timestamp
dueDate: timestamp
// прогресс по типам упражнений
recognitionScore: integer default 0
productionScore: integer default 0
listeningScore: integer default 0
spellingScore: integer default 0
isLearned: boolean default false
firstSeenAt: timestamp
```

Индекс `(userId, dueDate)` для быстрой выборки карточек на повторение.

### Таблица units

```
id: integer primary key
order: integer
title: text                         // 'Базовая лексика'
description: text
cefrLevel: text
iconName: text                      // имя из lucide
color: text                         // hex
```

### Таблица lessons

```
id: integer primary key
unitId: integer
order: integer
title: text
description: text
type: text                          // 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'review' | 'story'
cefrLevel: text
estimatedMinutes: integer
xpReward: integer
wordIds: text                       // JSON массив id слов
grammarTopicIds: text               // JSON массив
exercises: text                     // JSON конфиг упражнений
prerequisites: text                 // JSON массив id уроков
```

### Таблица user_lesson_progress

```
userId: integer
lessonId: integer
status: text                        // 'locked' | 'available' | 'in_progress' | 'completed'
score: integer
mistakesCount: integer default 0
timeSpentSeconds: integer
completedAt: timestamp
attemptsCount: integer default 0
primary key: (userId, lessonId)
```

### Таблица grammar_topics

```
id: integer primary key
order: integer
cefrLevel: text
title: text                         // 'Present Simple'
titleRu: text                       // 'Настоящее простое время'
explanation: text                   // markdown
examplesJson: text                  // JSON
rules: text                         // JSON
commonMistakes: text
relatedTopics: text                 // JSON массив id
```

### Таблица phrases

```
id: integer primary key
english: text
russian: text
category: text                      // 'greetings' | 'travel' | 'restaurant' | ...
cefrLevel: text
context: text
```

### Таблица stories

```
id: integer primary key
title: text
cefrLevel: text
contentEn: text                     // полный текст
contentRu: text                     // перевод
wordCount: integer
estimatedReadMinutes: integer
topic: text
xpReward: integer
```

### Таблица user_story_progress

```
userId: integer
storyId: integer
isRead: boolean
readAt: timestamp
clickedWords: text                  // JSON
primary key: (userId, storyId)
```

### Таблица achievements

```
id: integer primary key
key: text unique
title: text
description: text
iconName: text
xpReward: integer
gemsReward: integer
conditionType: text
conditionValue: integer
```

### Таблица user_achievements

```
userId: integer
achievementId: integer
unlockedAt: timestamp
primary key: (userId, achievementId)
```

### Таблица study_sessions

```
id: integer primary key
userId: integer
startedAt: timestamp
endedAt: timestamp
xpEarned: integer
wordsReviewed: integer
exercisesCompleted: integer
correctAnswers: integer
totalAnswers: integer
activityType: text                  // 'lesson' | 'review' | 'story' | 'chat' | 'game'
```

### Таблица user_settings

```
userId: integer primary key
theme: text default 'dark'
soundEffects: boolean default true
animations: boolean default true
autoPlayAudio: boolean default true
preferredVoice: text default 'Samantha'
voiceRate: integer default 200
showIpaTranscription: boolean default true
fsrsDesiredRetention: real default 0.9
useMacSay: boolean default true     // использовать macOS say или Web Speech
```

### Таблица mistral_cache
Кеш ответов Mistral.

```
cacheKey: text primary key          // sha256 хеш промпта
prompt: text
response: text
model: text
createdAt: timestamp
expiresAt: timestamp
```

---

## 7. ИСТОЧНИКИ ДАННЫХ (СЛОВАРЬ И КОНТЕНТ)

### 7.1 Базовый словарь по уровням CEFR

**Главный источник: openlanguageprofiles/olp-en-cefrj (GitHub)**
- URL: https://github.com/openlanguageprofiles/olp-en-cefrj
- Файл: `cefrj-vocabulary-profile-1.5.csv`
- Содержит ~7000 слов с CEFR уровнями A1-C2 и частями речи
- Лицензия: CC BY-SA (свободно)

**Дополнительный: Oxford 3000/5000 по CEFR**
- URL: https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf
- Используется для топ-3000 самых нужных слов

**Для переводов на русский: Mueller English-Russian Dictionary**
- URL: https://mueller-dict.sourceforge.net/
- Формат: DICT, ~46000 переводов
- Лицензия: GPL (свободная)

### 7.2 Алгоритм сборки словаря

`scripts/build-dictionary.ts` запускается ОДИН РАЗ разработчиком перед сборкой `.app`. Не во время работы у пользователя.

Шаги:
1. Скачать CEFR-J CSV (~7000 слов с уровнями и частями речи)
2. Скачать Mueller DICT (~46000 переводов)
3. Для каждого слова из CEFR-J найти перевод в Mueller
4. Если перевода нет (10-15% случаев), сделать запрос к Mistral:

```
Translate English word "{word}" (part of speech: {pos}) to Russian.
Return ONLY the most common 1-3 word translation, no explanations.
```

5. Для каждого слова сгенерировать пример предложения через Mistral:

```
Generate one simple example sentence using English word "{word}" appropriate for {cefrLevel} learners (max 8 words).
Then translate the sentence to Russian.
Return JSON: {"en": "...", "ru": "..."}
```

6. Для топ-200 слов A1 добавить ссылки на картинки (можно использовать Unsplash API или подготовить заранее)
7. Сохранить в `resources/seed-data/words_{level}.json`

При сборке `.app` эти JSON файлы упаковываются в bundle.

**Цели по объёму:**
- A1: ~500 слов
- A2: ~1000 слов (кумулятивно 1500)
- B1: ~1500 слов (кумулятивно 3000)
- B2: ~2000 слов (кумулятивно 5000)
- C1: ~2000 слов (кумулятивно 7000)

### 7.3 Грамматические темы

Сгенерировать через Mistral по канонической программе CEFR. Или прописать вручную в `resources/seed-data/grammar_topics.json`.

**A1:** to be, have, личные местоимения, артикли a/an/the, множественное число, Present Simple, this/that, can для умений, числа, время, дни недели

**A2:** Present Continuous, Past Simple (правильные и неправильные), Future с will/going to, степени сравнения, much/many/a lot of, предлоги места и времени, союзы, must/should/have to

**B1:** Present Perfect, Past Continuous, условные 0/1/2, пассивный залог (Simple), герундий и инфинитив, относительные местоимения

**B2:** Past Perfect, Future Perfect, условные 3 типа + mixed, пассив во всех временах, reported speech, модальные глаголы детально, phrasal verbs

**C1+:** причастные обороты, инверсия, эллипсис, продвинутые модальные конструкции

Каждая тема: объяснение в markdown, 5-10 примеров EN/RU, частые ошибки, 3-5 связанных тем.

### 7.4 Тексты для чтения

Для A1-A2 сгенерировать через Mistral простые тексты по 80-150 слов на повседневные темы (мой день, моя семья, в магазине, в кафе, погода). Для B1+ можно использовать упрощённые тексты из open source проектов или генерировать.

### 7.5 Готовые фразы

~500 повседневных фраз по категориям: greetings, travel, restaurant, shopping, work, health, weather, hobbies, emotions, time. Можно нагенерить через Mistral одним запросом на категорию.

---

## 8. ТИПЫ УПРАЖНЕНИЙ (16 шт.)

Каждый тип это отдельный React компонент. Все имеют единый интерфейс:

```typescript
interface ExerciseProps {
  data: ExerciseData;
  onComplete: (result: ExerciseResult) => void;
}

interface ExerciseResult {
  correct: boolean;
  timeMs: number;
  attemptsCount: number;
  userAnswer: string;
}
```

### 8.1 TranslationMC (Перевод с выбором)
Слово EN вверху, 4 варианта RU внизу. Клик по правильному. Уровни: A1+

### 8.2 ReverseTranslationMC (Обратный перевод)
Слово RU вверху, 4 варианта EN. Уровни: A1+

### 8.3 WordBank (Собери предложение)
Дано RU предложение. Из набора кнопок-слов собрать английский перевод. Уровни: A1+

### 8.4 Typing (Напечатай перевод)
Дано RU. Напечатать английский. Уровни: A2+

### 8.5 ListeningType (Послушай и напечатай)
Воспроизводится аудио. Напечатать что услышал. Уровни: A1+

### 8.6 ListeningMC (Послушай и выбери)
Аудио + 4 варианта. Уровни: A1+

### 8.7 Speak (Произнеси)
Показывается слово/фраза EN. Кнопка микрофона. Распознавание. Сравнение с эталоном (Levenshtein distance, порог 0.85). Уровни: A1+

### 8.8 Matching (Сопоставь пары)
Две колонки: EN и RU. Соединить парами. Уровни: A1+

### 8.9 FillBlank (Заполни пропуск)
Предложение с пропуском, 3-4 варианта. Уровни: A2+

### 8.10 ImageWord (Картинка и слово)
Картинка + 4 слова. Выбрать что изображено. Уровни: A1

### 8.11 TransformSentence (Преобразуй предложение)
"Сделай отрицательным" / "Преобразуй в Past Simple". Уровни: A2+

### 8.12 Dictation (Диктант)
Длинный текст на слух (3-5 предложений). Напечатать дословно. Уровни: B1+

### 8.13 FlashcardSRS (Карточка повторения)
Anki-style. Front: EN. Back: RU + IPA + пример + аудио. Кнопки Again/Hard/Good/Easy. Уровни: все

### 8.14 Cloze (Открытый пропуск)
Текст с пропуском, вписать любое подходящее слово. Проверка через Mistral. Уровни: B1+

### 8.15 FreeWriting (Свободное письмо)
Тема. Написать 50+ слов. Mistral проверяет и даёт фидбек. Уровни: A2+

### 8.16 AIConversation (Диалог с AI)
Отдельный режим в `/chat`. Mistral играет роль. Подсказки если застрял. Уровни: A1+ с подсказками, B1+ свободно

### Логика урока:
- Урок = последовательность 8-15 упражнений разных типов
- При ошибке упражнение возвращается в конец очереди ещё 1 раз
- 3 ошибки на одном слове = "учебная вставка": показ перевода, IPA, примера
- В конце урока: экран с XP, диаграмма ошибок, кнопка "Дальше"

---

## 9. АЛГОРИТМ SRS: FSRS-6

Используем FSRS вместо устаревшего SM-2. Доказано на бенчмарках 700M+ ревью что нужно на 20-30% меньше повторений для той же ретенции.

### Параметры карточки:
- **D (Difficulty):** 1-10, индивидуальная сложность
- **S (Stability):** дней до забывания (R падает до 0.9)
- **R (Retrievability):** вероятность вспомнить прямо сейчас

### Используем библиотеку ts-fsrs
URL: https://github.com/open-spaced-repetition/ts-fsrs

```typescript
import { createEmptyCard, FSRS, Rating, generatorParameters } from 'ts-fsrs';

const params = generatorParameters({ enable_fuzz: true, request_retention: 0.9 });
const f = new FSRS(params);

// При создании нового слова
const card = createEmptyCard();

// При ответе пользователя
const schedulingCards = f.repeat(card, new Date());
// schedulingCards имеет 4 ключа: Again, Hard, Good, Easy
const updatedCard = schedulingCards[Rating.Good].card;
// updatedCard содержит обновлённые stability, difficulty, due
```

### Очередь повторений

Логика подбора карточек на сессию `/review`:
1. Просроченные `dueDate < now` (приоритет 1)
2. Новые слова (10-20 в день в зависимости от настройки)
3. "Trouble cards" с `lapses > 2`

Лимит на сессию: 20-50 карточек.

---

## 10. ОНБОРДИНГ (СУПЕР ПЛАВНЫЙ СТАРТ)

8 экранов. Цель: пользователь с нулевым английским не должен испугаться в первую минуту. За 5 минут он должен сделать первый мини-урок и почувствовать прогресс.

### Экран 1: Приветствие
- Маскот Луми появляется с анимацией
- Текст: "Привет! Я Луми. Будем учить английский вместе."
- Кнопка: "Поехали"

### Экран 2: Имя
- "Как тебя зовут?"
- Поле ввода → `users.name`

### Экран 3: Зачем учишь?
Multi-select (для будущей персонализации):
- Путешествия
- Работа и карьера
- Учёба
- Игры и фильмы
- Общение с людьми
- Просто интересно

### Экран 4: Цель в день
Single select → `users.dailyGoalMinutes`:
- 5 минут (легко)
- 10 минут (норма)
- 15 минут (серьёзно)
- 20 минут (интенсивно)

### Экран 5: Тест уровня (опционально)
Кнопка "Я с нуля, скипнуть" ставит A0/A1. Если не скипнул: 10 простых вопросов растущей сложности. На основе ответов ставится уровень.

### Экран 6: ПЕРВЫЙ МИНИ-УРОК (тут самое важное!)
Цель: дать почувствовать успех за 60 секунд.

5 упражнений:
1. Картинка собаки + слово "dog" + автоматическое озвучивание. "Это слово 'dog' = собака. Послушай как звучит." Кнопка "Понял"
2. Картинка кошки + слово "cat" + озвучивание. То же самое
3. MC: показывается слово "dog", 2 картинки (собака и кошка). Выбрать
4. MC: показывается слово "cat", 2 картинки. Выбрать
5. Сборка: показывается фраза "I have a dog" + перевод "У меня есть собака". Кнопка "Дальше"

После этого: confetti анимация, "Ты выучил 2 первых слова! +10 XP!", появляется streak счётчик с цифрой 1.

### Экран 7: Объяснение системы
Маскот показывает:
- "Это твой XP" → 10
- "Это огонёк streak" → 1
- "Это твои сердца" → 5. "Если ошибёшься 5 раз, придётся подождать. Не страшно!"
- "Каждый день учись хотя бы {dailyGoal} минут"

### Экран 8: Готово
"Ты готов к большому пути! Открываю карту уроков." Редирект на Home.

---

## 11. ГЕЙМИФИКАЦИЯ

### XP (опыт)
- Правильный ответ: +1 XP
- Завершение урока: +10 XP базово, +5 за perfect (без ошибок), +5 за speed
- SRS правильный ответ: +2 XP
- Серия 5+ правильных: множитель x1.5

### Streak (огонёк)
- Растёт +1 за каждый день, в который пользователь набрал >= dailyGoalMinutes
- Сбрасывается при пропуске
- Streak Freeze: до 2 шт, автоматически восстанавливают streak
- Покупка freeze: 200 gems
- Визуал: пламя растёт с увеличением streak (10/30/100/365)

### Hearts (сердца)
- Старт: 5 сердец
- Ошибка в уроке: -1
- 0 сердец: нельзя продолжить урок (но повторение и чтение доступны)
- Восстановление: 1 сердце каждые 30 минут (или 100 gems за полную заправку)
- Можно отключить hearts в настройках (бесконечный режим)

### Gems
- Зарабатываются за челленджи, юниты, ачивки
- Тратятся на heart refill, streak freeze, бустеры XP

### Ачивки (минимум 30 штук)
- "Первые шаги" - закончи 1 урок
- "Неделя огня" - streak 7 дней
- "Месяц огня" - streak 30 дней
- "Полиглот A1" - выучи 500 слов A1
- "Ранняя пташка" - занимайся до 8 утра 5 раз
- "Сова" - занимайся после 22:00 5 раз
- "Без ошибок" - 10 perfect уроков подряд
- "Скоростной" - завершённый урок быстрее estimatedMinutes 20 раз
- "Слушатель" - 100 упражнений на аудирование
- "Болтун" - 50 ответов через speech recognition
- "AI-собеседник" - 10 диалогов с Mistral
- "Грамотей" - изучи 20 грамматических тем
- "Чтец" - прочитай 10 текстов
- "Ночной охотник" - 50 повторений между 22:00 и 02:00
- ...

### Карта уроков (Home)
Визуальное "дерево" уроков по типу Duolingo. Юниты как разделы, в каждом 5-10 уроков. Закрытые с замком. Текущий доступный пульсирует.

---

## 12. ИНТЕГРАЦИЯ MISTRAL API

### Конфигурация

```typescript
// electron/lib/mistral-client.ts
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY || 'omuPDQIstHg8D0ZLilaqQPO1jpGJTze4';
export const mistral = new Mistral({ apiKey });

export const MODELS = {
  fast: 'mistral-small-latest',    // дешёвый, для генерации
  smart: 'mistral-large-latest',   // умный, для диалогов
} as const;
```

Ключ хранится в коде. При желании пользователь может переопределить через `~/Library/Application Support/LinguaForge/.env`.

### Use case 1: AI-собеседник (Chat)

Сценарии: знакомство, в кафе, заказ такси, у врача, на работе, путешествие. Каждый сценарий имеет роль AI, сложность CEFR, подсказки.

Промпт:

```
You are a friendly {role} in {scenario}. Speak in simple English appropriate for {cefrLevel} level. The user is learning English. If they make grammar mistakes, gently correct them. Use only vocabulary they likely know. After each user message, respond naturally and ask a follow-up question. Reply in 1-3 sentences max.

If the user writes in Russian, gently encourage them to try in English and provide the English phrase they might need.
```

### Use case 2: Проверка свободного письма

```
Check this English text written by an A2 level Russian speaker.
Text: "{userText}"
Topic: "{topic}"

Provide:
1. Corrected version
2. List of errors (max 5) with brief explanations in Russian
3. One suggestion for improvement
4. Score 0-100

Return as JSON: { corrected, errors: [{original, correction, explanation}], suggestion, score }
```

### Use case 3: Объяснение слова в контексте

Когда пользователь кликает на слово в тексте Stories:

```
Explain the meaning and usage of the word "{word}" in this sentence: "{sentence}". Provide:
- Russian translation in this context
- Why this word is used here
- 1 similar example

In Russian. Brief, 2-3 sentences.
```

### Use case 4: Cloze проверка

```
Is the word "{userWord}" a valid completion for this sentence: "{sentenceWithBlank}"? Consider grammar and meaning. Return JSON: { valid: boolean, suggestion?: string, explanation: string (in Russian) }
```

### Rate Limiting и кеширование

Free tier Mistral имеет лимиты. Реализовать:
- Простой rate limiter в Main процессе: max 1 req/sec, max 60 req/min
- Кеш результатов в SQLite таблице `mistral_cache` (key = sha256 промпта, TTL 30 дней)
- Если лимит превышен: показать "AI отдыхает, попробуй через минуту"
- При отсутствии интернета: graceful degradation, AI-фичи показывают "Нет интернета, попробуйте позже"

```typescript
// electron/lib/mistral-cache.ts
import { createHash } from 'crypto';
import { db } from '../db';

export async function cachedRequest(prompt: string, model: string, ttlDays = 30) {
  const key = createHash('sha256').update(model + prompt).digest('hex');
  const cached = await db.select().from(mistralCache).where(eq(mistralCache.cacheKey, key));
  if (cached.length && new Date(cached[0].expiresAt) > new Date()) {
    return cached[0].response;
  }
  const response = await mistral.chat.complete({ model, messages: [{ role: 'user', content: prompt }] });
  const content = response.choices[0].message.content;
  await db.insert(mistralCache).values({
    cacheKey: key,
    prompt,
    response: content,
    model,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + ttlDays * 86400 * 1000),
  });
  return content;
}
```

---

## 13. КЛЮЧЕВЫЕ ЭКРАНЫ

### Home (главный хаб)
Дерево юнитов и уроков. Сверху: streak, hearts, XP, gems. Сайдбар: Учить / Повторить / Словарь / Грамматика / Чтение / Диалог / Аудирование / Игры / Статистика / Настройки.

### Lesson
Прогресс-бар сверху (8/12). По одному упражнению на экране. Анимации перехода. Звуки. В конце: экран результатов с XP, диаграммой ошибок.

### Review (SRS)
Стопка карточек. Кнопки Again/Hard/Good/Easy с подсказками интервалов ("Again - через 10 минут, Good - через 3 дня, Easy - через 7 дней"). Возможность отметить как "сложное".

### Dictionary
Поиск с автокомплитом. Фильтры: по уровню, теме, "только выученные", "только новые". Карточка слова: EN, RU, IPA, кнопка озвучки, примеры, синонимы, антонимы, частота, кнопка "добавить в SRS".

### Grammar
Список тем по уровням. Внутри темы: markdown объяснение, примеры, мини-упражнения, "связанные темы".

### Stories
Список текстов по уровням. Внутри: текст с tagged словами. Клик на слово - всплывает перевод + кнопка "добавить в SRS" + Mistral объяснение в контексте.

### Chat
Слева список сценариев. Справа окно чата. Внизу: инпут, кнопка микрофона, кнопка "перевести моё сообщение".

### Listening
Отдельный режим:
- Подкасты-симуляторы (Mistral генерирует короткие диалоги, macOS say их озвучивает разными голосами)
- Диктанты
- Shadowing (повторяй за диктором с записью)

### Games
- Word Match: memory game с переводами
- Speed Typing: напечатай как можно больше слов за 60 сек
- Fill Blank: марафон, скорость растёт
- Sentence Builder: собери предложение из перемешанных слов на время

### Stats
Графики (recharts):
- XP за последние 30 дней
- Streak календарь (как GitHub contributions)
- Слова по уровням (pie chart)
- Точность по типам упражнений
- Время изучения по дням недели
- Прогноз: "при текущем темпе достигнешь B1 через X месяцев"

### Settings
- Имя, аватар
- Тема (тёмная/светлая/системная)
- Голос TTS (выбор из macOS голосов через `say -v ?`)
- Скорость речи
- Звуки on/off
- Анимации on/off
- Hearts on/off (бесконечный режим)
- FSRS retention target (0.85-0.95)
- Сброс прогресса
- Экспорт прогресса (JSON в Downloads)
- Импорт прогресса
- О приложении (версия, ссылка на репозиторий)

---

## 14. МАК-СПЕЦИФИЧНЫЕ ДЕТАЛИ

### Нативное меню в menubar

```typescript
// electron/menu.ts
const template: MenuItemConstructorOptions[] = [
  {
    label: 'LinguaForge',
    submenu: [
      { label: 'О LinguaForge', click: openAboutWindow },
      { type: 'separator' },
      { label: 'Настройки...', accelerator: 'Cmd+,', click: () => navigate('/settings') },
      { type: 'separator' },
      { label: 'Скрыть LinguaForge', accelerator: 'Cmd+H', role: 'hide' },
      { label: 'Скрыть остальные', accelerator: 'Cmd+Alt+H', role: 'hideOthers' },
      { type: 'separator' },
      { label: 'Выйти', accelerator: 'Cmd+Q', click: () => app.quit() },
    ]
  },
  {
    label: 'Учить',
    submenu: [
      { label: 'Главная', accelerator: 'Cmd+1', click: () => navigate('/') },
      { label: 'Повторить', accelerator: 'Cmd+2', click: () => navigate('/review') },
      { label: 'Словарь', accelerator: 'Cmd+3', click: () => navigate('/dictionary') },
      { label: 'Грамматика', accelerator: 'Cmd+4', click: () => navigate('/grammar') },
      { label: 'Чтение', accelerator: 'Cmd+5', click: () => navigate('/stories') },
      { label: 'Диалог', accelerator: 'Cmd+6', click: () => navigate('/chat') },
    ]
  },
  {
    label: 'Окно',
    submenu: [
      { label: 'Свернуть', accelerator: 'Cmd+M', role: 'minimize' },
      { label: 'Закрыть', accelerator: 'Cmd+W', role: 'close' },
      { label: 'Во весь экран', accelerator: 'Ctrl+Cmd+F', role: 'togglefullscreen' },
    ]
  },
];
```

### Иконка в Dock
- Файл `build/icon.icns` 1024х1024
- При наличии уведомлений (например, истёкший hearts таймер): показывать badge

### Уведомления
Использовать `new Notification(...)` из Electron для:
- Ежедневное напоминание учиться (если пропустил время `preferredLearningTime`)
- "Сердца восстановлены! Можно продолжить"
- "Streak в опасности! Осталось 2 часа"

### Размер окна
- Минимальный: 1100x700
- По умолчанию: 1400x900
- Запоминать размер и позицию в `settings.json`
- На повторном запуске восстанавливать

### Тёмная тема
- Использовать `nativeTheme` из Electron
- Подписаться на изменения системной темы: `nativeTheme.on('updated', ...)`
- Применять `dark`/`light` классы к `<html>`

---

## 15. ВАЖНЫЕ ПРИНЦИПЫ

### Принцип плавности
- Никогда не показывай пользователю английский текст без поддержки (озвучка, перевод, контекст) на уровне A0-A1
- Первые 100 слов: каждое идёт с картинкой
- Сложность нарастает максимум на 1 новый элемент за упражнение

### Принцип "без боли"
- При ошибке: дружелюбное сообщение, не "Wrong!", а "Почти! Правильно: ..."
- 3 неправильных подряд = автоматическая подсказка
- Никаких таймеров на ответ (только в speed-typing игре)
- Hearts можно отключить полностью

### Принцип "видимого прогресса"
- После каждого упражнения: анимация XP
- После урока: confetti
- Видимые числа: words learned, streak, XP today vs goal
- Ежедневный пуш в UI: "Ты сегодня молодец, на 73% к цели"

### Принцип отсутствия длинных тире
В UI, контенте, комментариях, инструкциях НЕ использовать:
- — (длинное тире)
- – (среднее тире)

Использовать:
- двоеточие
- запятую
- дефис -

### Принцип "контент-первый"
Без хорошего словаря приложение мёртвое. Удели максимум внимания фазе сборки словаря.

---

## 16. ПЛАН РЕАЛИЗАЦИИ ПО ФАЗАМ

### Фаза 1: Скелет Electron (день 1)
- Init Electron + Vite + React + TypeScript
- Main process с минимальным window
- Preload script с базовым IPC
- Tailwind + shadcn/ui
- Тестовая сборка `.app` через electron-builder
- Проверка что `.app` открывается на Mac

### Фаза 2: База данных (день 2)
- Drizzle ORM + better-sqlite3 в main
- Все таблицы из секции 6
- IPC handlers для CRUD
- Миграции
- Создание БД при первом запуске в userData

### Фаза 3: Контент (день 3)
- `scripts/build-dictionary.ts`: парсинг CEFR-J + Mueller
- Генерация недостающих переводов и примеров через Mistral
- ~500 слов A1 для старта (потом расширить)
- Дерево уроков: 5 юнитов A1 по 5 уроков
- 20 грамматических тем A1-A2
- Упаковка JSON в `resources/`

### Фаза 4: Озвучка (день 3-4)
- Wrapper над macOS `say`
- IPC handler для TTS
- React hook `useTTS` с фолбэком на Web Speech
- Speech Recognition через Web Speech API
- Тестирование на Mac: проверить что голоса работают

### Фаза 5: Онбординг (день 5)
- Все 8 экранов
- Маскот компонент с эмоциями
- Первый плавный мини-урок с картинками собаки и кошки
- Анимация confetti в конце

### Фаза 6: Базовые упражнения (день 6-7)
- TranslationMC, ReverseTranslationMC
- WordBank, Matching
- Typing
- ListeningType, ListeningMC
- Игровой UX: анимации, звуки, прогресс-бар

### Фаза 7: Геймификация (день 8)
- XP, hearts, streak, gems логика
- Achievements система с автоматической проверкой
- Шапка с показателями
- Карта уроков на Home
- Тосты для ачивок

### Фаза 8: SRS (день 9)
- Интеграция ts-fsrs
- Экран Review
- Карточки FlashcardSRS
- Логика подбора карточек на сегодня

### Фаза 9: Расширенные упражнения (день 10)
- Speak (Web Speech Recognition + Levenshtein)
- FillBlank, Cloze
- TransformSentence, Dictation
- ImageWord

### Фаза 10: Mistral интеграции (день 11)
- Чат-сценарии (Chat)
- Проверка свободного письма
- Объяснение слов в контексте Stories
- Cloze валидация
- Rate limiter + кеш

### Фаза 11: Дополнительные модули (день 12-13)
- Dictionary с поиском
- Grammar справочник
- Stories с tagged словами
- Listening (диктанты)
- 4 мини-игры

### Фаза 12: Полировка (день 14)
- Stats графики
- Settings экран
- Тёмная/светлая тема через nativeTheme
- Анимации Framer Motion везде
- Звуки и микро-интеракции
- Иконка приложения и DMG background
- Тестирование на чистом Mac

### Фаза 13: Финальная сборка
- `scripts/build-mac.sh` собирает финальный `.dmg`
- README с инструкцией обхода Gatekeeper
- Проверка на Apple Silicon и Intel

---

## 17. ЧТО НЕ ДЕЛАТЬ (out of scope MVP)

- ❌ Регистрация и логин (один локальный пользователь)
- ❌ Социальные функции, друзья, реальные лиги
- ❌ Платежи и In-App Purchase
- ❌ Веб-версия и мобильные приложения
- ❌ Поддержка других языков кроме en/ru
- ❌ Авто-обновления приложения
- ❌ Подпись Apple Developer
- ❌ Notarization Apple
- ❌ App Store

---

## 18. ИСТОЧНИКИ И ССЫЛКИ

**Словари и корпусы:**
- https://github.com/openlanguageprofiles/olp-en-cefrj
- https://mueller-dict.sourceforge.net/
- https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf
- https://github.com/Badestrand/russian-dictionary

**SRS:**
- https://github.com/open-spaced-repetition/ts-fsrs
- https://faqs.ankiweb.net/what-spaced-repetition-algorithm

**Mistral:**
- https://docs.mistral.ai/
- https://github.com/mistralai/client-ts

**Electron:**
- https://www.electronjs.org/docs/latest/
- https://www.electron.build/
- https://github.com/electron/electron-quick-start

**UI:**
- https://ui.shadcn.com/
- https://www.framer.com/motion/

**macOS say команда:**
- `man say` в терминале
- `say -v ?` чтобы посмотреть все доступные голоса

**Обход Gatekeeper для unsigned apps:**
- `xattr -dr com.apple.quarantine /Applications/YourApp.app`
- System Settings > Privacy & Security > Open Anyway

---

## 19. КРИТЕРИИ ПРИЁМКИ

Приложение готово, если:

- [x] `./scripts/build-mac.sh` собирает `LinguaForge.dmg` файл
- [x] После перетаскивания в Applications и обхода Gatekeeper, приложение запускается из Launchpad
- [x] Иконка приложения видна в Dock и нативное меню в menubar
- [x] БД и настройки создаются в `~/Library/Application Support/LinguaForge/`
- [x] Пользователь может пройти онбординг и сделать первый урок без единого знания английского
- [x] БД содержит 3000+ слов с переводами, CEFR уровнями, IPA, примерами
- [x] Работают все 16 типов упражнений
- [x] SRS планирует повторения корректно через ts-fsrs
- [x] macOS `say` озвучивает слова голосом Samantha (или выбранным)
- [x] Speech Recognition принимает голос для упражнений на произношение
- [x] Mistral отвечает в диалоге через бесплатный ключ
- [x] Кеш Mistral работает (повторные запросы не идут в API)
- [x] Геймификация работает: XP, streak, hearts, achievements, тосты
- [x] UI красивый, тёмная тема, плавные анимации
- [x] Никаких длинных тире в UI и контенте
- [x] Cmd+1..Cmd+6 переключают между разделами
- [x] При закрытии окна (Cmd+W) приложение продолжает работать (Mac-style)
- [x] При Cmd+Q приложение закрывается, состояние сохранено
- [x] При следующем запуске состояние восстанавливается

---

**Всё. Это финальное ТЗ. Приступай к Фазе 1.**
