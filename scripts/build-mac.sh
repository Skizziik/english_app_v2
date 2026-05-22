#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🧹 Чищу старые билды..."
rm -rf dist dist-electron dist-react

echo "📦 Проверяю зависимости..."
if [ ! -d node_modules ]; then
  npm install
fi

echo "🏗️  Собираю React..."
npm run build:react

echo "🏗️  Собираю Electron Main..."
npm run build:electron

echo "🍎 Собираю .app и .dmg для Apple Silicon..."
npx electron-builder --mac --arm64

echo "✅ Готово!"
echo ""
echo "Файлы в dist/:"
ls -lh dist/*.dmg 2>/dev/null || true
echo ""
echo "Чтобы установить:"
echo "  1. Открой dist/LinguaForge-1.0.0-arm64.dmg"
echo "  2. Перетащи LinguaForge.app в Applications"
echo "  3. Если macOS блокирует: System Settings > Privacy & Security > Open Anyway"
echo "     Или в Terminal: xattr -dr com.apple.quarantine /Applications/LinguaForge.app"
