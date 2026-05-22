import { app, Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron';

function navigate(win: BrowserWindow, route: string) {
  win.webContents.send('navigate', route);
}

export function buildAppMenu(win: BrowserWindow): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'LinguaForge',
      submenu: [
        { label: 'О LinguaForge', click: () => navigate(win, '/about') },
        { type: 'separator' },
        { label: 'Настройки...', accelerator: 'Cmd+,', click: () => navigate(win, '/settings') },
        { type: 'separator' },
        { label: 'Скрыть LinguaForge', accelerator: 'Cmd+H', role: 'hide' },
        { label: 'Скрыть остальные', accelerator: 'Cmd+Alt+H', role: 'hideOthers' },
        { label: 'Показать все', role: 'unhide' },
        { type: 'separator' },
        { label: 'Выйти', accelerator: 'Cmd+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Правка',
      submenu: [
        { label: 'Отменить', accelerator: 'Cmd+Z', role: 'undo' },
        { label: 'Повторить', accelerator: 'Shift+Cmd+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Вырезать', accelerator: 'Cmd+X', role: 'cut' },
        { label: 'Копировать', accelerator: 'Cmd+C', role: 'copy' },
        { label: 'Вставить', accelerator: 'Cmd+V', role: 'paste' },
        { label: 'Выделить всё', accelerator: 'Cmd+A', role: 'selectAll' },
      ],
    },
    {
      label: 'Учить',
      submenu: [
        { label: 'Главная', accelerator: 'Cmd+1', click: () => navigate(win, '/') },
        { label: 'Повторить', accelerator: 'Cmd+2', click: () => navigate(win, '/review') },
        { label: 'Словарь', accelerator: 'Cmd+3', click: () => navigate(win, '/dictionary') },
        { label: 'Грамматика', accelerator: 'Cmd+4', click: () => navigate(win, '/grammar') },
        { label: 'Чтение', accelerator: 'Cmd+5', click: () => navigate(win, '/stories') },
        { label: 'Диалог', accelerator: 'Cmd+6', click: () => navigate(win, '/chat') },
        { type: 'separator' },
        { label: 'Аудирование', accelerator: 'Cmd+7', click: () => navigate(win, '/listening') },
        { label: 'Игры', accelerator: 'Cmd+8', click: () => navigate(win, '/games') },
        { label: 'Статистика', accelerator: 'Cmd+9', click: () => navigate(win, '/stats') },
      ],
    },
    {
      label: 'Окно',
      submenu: [
        { label: 'Свернуть', accelerator: 'Cmd+M', role: 'minimize' },
        { label: 'Закрыть окно', accelerator: 'Cmd+W', role: 'close' },
        { label: 'Во весь экран', accelerator: 'Ctrl+Cmd+F', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Перезагрузить', accelerator: 'Cmd+R', role: 'reload' },
        { label: 'DevTools', accelerator: 'Alt+Cmd+I', role: 'toggleDevTools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
