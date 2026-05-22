import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { useSettings } from '@/stores/settingsStore';
import { TitleBar } from '@/components/layout/TitleBar';
import { Sidebar } from '@/components/layout/Sidebar';
import Onboarding from '@/screens/Onboarding';
import Home from '@/screens/Home';
import Lesson from '@/screens/Lesson';
import Review from '@/screens/Review';
import Dictionary from '@/screens/Dictionary';
import Grammar from '@/screens/Grammar';
import GrammarTopic from '@/screens/GrammarTopic';
import Stories from '@/screens/Stories';
import Story from '@/screens/Story';
import Chat from '@/screens/Chat';
import Listening from '@/screens/Listening';
import Games from '@/screens/Games';
import Stats from '@/screens/Stats';
import Settings from '@/screens/Settings';
import About from '@/screens/About';

export default function App() {
  const { user, loaded, load } = useUserStore();
  const loadSettings = useSettings((s) => s.load);
  const navigate = useNavigate();
  const location = useLocation();
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await loadSettings();
        await load();
      } catch (err: any) {
        setBootError(err?.message ?? 'init error');
      }
    })();
  }, []);

  useEffect(() => {
    const off = window.api?.onNavigate?.((route) => {
      navigate(route);
    });
    return () => off?.();
  }, [navigate]);

  if (bootError) {
    return (
      <div className="h-screen flex items-center justify-center bg-ink-950 text-ink-100 p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Ошибка инициализации</h1>
          <p className="text-ink-400">{bootError}</p>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-ink-950 text-ink-100">
        <div className="animate-pulse text-brand-300">Загрузка...</div>
      </div>
    );
  }

  const onboardingDone = user?.onboardingCompleted;
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');

  if (!onboardingDone && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingDone && isOnboardingRoute) {
    return <Navigate to="/" replace />;
  }

  if (!onboardingDone) {
    return (
      <div className="h-screen flex flex-col bg-ink-950 text-ink-50">
        <TitleBar showNav={false} />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/onboarding/*" element={<Onboarding />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-ink-950 text-ink-50">
      <TitleBar showNav />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lesson/:id" element={<Lesson />} />
            <Route path="/review" element={<Review />} />
            <Route path="/dictionary" element={<Dictionary />} />
            <Route path="/grammar" element={<Grammar />} />
            <Route path="/grammar/:id" element={<GrammarTopic />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/stories/:id" element={<Story />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/listening" element={<Listening />} />
            <Route path="/games" element={<Games />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
