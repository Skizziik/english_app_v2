import { NavLink } from 'react-router-dom';
import {
  Home as HomeIcon,
  RotateCcw,
  BookOpen,
  GraduationCap,
  ScrollText,
  MessageCircle,
  Headphones,
  Gamepad2,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Главная', icon: HomeIcon, hotkey: '⌘1' },
  { to: '/review', label: 'Повторить', icon: RotateCcw, hotkey: '⌘2' },
  { to: '/dictionary', label: 'Словарь', icon: BookOpen, hotkey: '⌘3' },
  { to: '/grammar', label: 'Грамматика', icon: GraduationCap, hotkey: '⌘4' },
  { to: '/stories', label: 'Чтение', icon: ScrollText, hotkey: '⌘5' },
  { to: '/chat', label: 'Диалог', icon: MessageCircle, hotkey: '⌘6' },
  { to: '/listening', label: 'Аудирование', icon: Headphones, hotkey: '⌘7' },
  { to: '/games', label: 'Игры', icon: Gamepad2, hotkey: '⌘8' },
  { to: '/stats', label: 'Статистика', icon: BarChart3, hotkey: '⌘9' },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-ink-900/40 border-r border-ink-800 flex flex-col py-3 px-2">
      <nav className="flex flex-col gap-1 flex-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'bg-brand-500/15 text-brand-200' : 'text-ink-300 hover:bg-ink-800/60 hover:text-ink-100',
              )
            }
          >
            <it.icon size={16} />
            <span className="flex-1">{it.label}</span>
            <span className="text-[10px] text-ink-500 tabular-nums">{it.hotkey}</span>
          </NavLink>
        ))}
      </nav>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
            isActive ? 'bg-brand-500/15 text-brand-200' : 'text-ink-400 hover:bg-ink-800/60 hover:text-ink-100',
          )
        }
      >
        <SettingsIcon size={16} />
        <span>Настройки</span>
      </NavLink>
    </aside>
  );
}
