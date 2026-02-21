
import React, { useState, useEffect } from 'react';
import { AppScreen, User, Service, Professional, BookingStep, Appointment, ShopConfig } from './types';
import { BottomNav as Navigation } from './Navigation.tsx';
import { SplashScreen } from './SplashScreen.tsx';
import { AuthScreen } from './AuthScreen.tsx';
import { HomeScreen } from './HomeScreen.tsx';
import { BookingFlow } from './BookingFlow.tsx';
import { AppointmentsScreen } from './AppointmentsScreen.tsx';
import { ProfileScreen } from './ProfileScreen.tsx';
import { RankingScreen } from './RankingScreen.tsx';
import { AllServicesScreen } from './AllServicesScreen.tsx';
import { NotificationSettings } from './NotificationSettings.tsx';
import { dataRepository } from './dataRepository';
import { supabase } from './supabase';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.SPLASH);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('luxury_barber_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [shopConfig, setShopConfig] = useState<ShopConfig | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Expose navigation for children without prop drilling
  useEffect(() => {
    (window as any).setAppScreen = setScreen;
  }, []);

  // Sincronização e Mirroring
  useEffect(() => {
    // ... logic inside ...
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('luxury_barber_user');
        if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Erro ao carregar usuário do cache:', e);
        localStorage.removeItem('luxury_barber_user');
      }
    };

    const loadAppointments = async () => {
      try {
        const savedUser = localStorage.getItem('luxury_barber_user');
        if (user?.id || (savedUser && savedUser !== 'undefined' && savedUser !== 'null')) {
          const sessionUser = user || JSON.parse(savedUser || '{}');
          if (sessionUser?.id) {
            const appts = await dataRepository.getAppointments(sessionUser.id);
            setAppointments(appts);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar agendamentos:', e);
      }
    };

    const loadShopConfig = async () => {
      try {
        const config = await dataRepository.getConfig();
        if (config) {
          setShopConfig(config);
          applyDynamicTheme(config);
        }
      } catch (e) {
        console.error('Erro ao carregar configuração da barbearia:', e);
      }
    };

    const applyDynamicTheme = (config: ShopConfig) => {
      if (config.primary_hsl) {
        document.documentElement.style.setProperty('--gold-hsl', config.primary_hsl);
        // Tenta extrair valores para variações (escuro/claro)
        const [h, s, l] = config.primary_hsl.split(',').map(v => parseInt(v.trim()));
        if (!isNaN(h)) {
          document.documentElement.style.setProperty('--gold-hsl-light', `${h}, ${s}%, ${Math.min(l + 20, 95)}%`);
          document.documentElement.style.setProperty('--gold-hsl-dark', `${h}, ${Math.min(s + 10, 100)}%, ${Math.max(l - 15, 10)}%`);
        }
      }
      if (config.app_name) {
        document.title = config.app_name;
      }
    };

    const init = async () => {
      setDataLoading(true);
      try {
        loadUser();

        // Espera pelos dados e pelas fontes
        await Promise.all([
          loadAppointments(),
          loadShopConfig(),
          document.fonts.ready.then(() => {
            document.body.classList.add('fonts-loaded');
          })
        ]);
      } finally {
        // Pequeno delay para suavidade da transição
        setTimeout(() => setDataLoading(false), 800);
      }
    };

    init();

    const unsubscribe = dataRepository.subscribe(() => {
      loadAppointments();
      loadShopConfig();
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const handleAuth = async (userData: { name: string; whatsapp: string; birthday: string }, mode: 'login' | 'register') => {
    try {
      console.log(`Iniciando ${mode} para:`, userData.whatsapp);

      let existingUser = await dataRepository.getUserData(userData.whatsapp);

      if (mode === 'register') {
        if (existingUser) {
          alert('Este número de WhatsApp já está cadastrado. Por favor, utilize a aba "Entrar".');
          return false;
        }
        console.log('Criando novo cliente...');
        existingUser = await dataRepository.createClient(userData);
      } else {
        // Modo Login
        if (!existingUser) {
          alert('Número não encontrado. Verifique se o número está correto ou utilize a aba "Cadastrar".');
          return false;
        }
      }

      if (existingUser) {
        console.log('Autenticação bem-sucedida:', existingUser);

        // Salva no localStorage ANTES de mudar o estado para garantir persistência
        localStorage.setItem('luxury_barber_user', JSON.stringify(existingUser));

        // Atualiza os estados
        setUser(existingUser);

        // Pequeno delay para garantir que o estado do usuário foi processado
        setTimeout(() => {
          setScreen(AppScreen.HOME);
        }, 100);

        return true;
      } else {
        console.error('Falha ao obter ou criar usuário');
        // Se chegou aqui sem dar erro no dataRepository, algo retornou vazio
        alert('Não foi possível carregar seu perfil. Reinicie o app e tente novamente.');
        return false;
      }
    } catch (error: any) {
      console.error('Erro detalhado na autenticação:', error);
      alert('Erro ao entrar: ' + (error.message || 'Erro desconhecido. Verifique sua conexão.'));
      return false;
    }
  };

  const handleBookingComplete = (appointment: Appointment) => {
    setAppointments(prev => [appointment, ...prev]);
    setScreen(AppScreen.MY_APPOINTMENTS);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const showNav = user && [AppScreen.HOME, AppScreen.MY_APPOINTMENTS, AppScreen.PROFILE, AppScreen.BOOKING, AppScreen.RANKING].includes(screen);

  return (
    <div className={`min-h-screen flex flex-col max-w-lg mx-auto overflow-x-hidden ${isDarkMode ? 'dark' : ''}`}>
      <main className="flex-1 flex flex-col bg-premium-pearl dark:bg-premium-black">
        {(screen === AppScreen.SPLASH || dataLoading) && (
          <SplashScreen
            onFinish={() => {
              if (!dataLoading) {
                setScreen(user ? AppScreen.HOME : AppScreen.AUTH);
              }
            }}
            shopConfig={shopConfig}
          />
        )}
        {!dataLoading && screen !== AppScreen.SPLASH && (
          <>
            {screen === AppScreen.AUTH && <AuthScreen onLogin={handleAuth} shopConfig={shopConfig} />}
            {screen === AppScreen.HOME && (
              <HomeScreen
                user={user}
                onStartBooking={() => setScreen(AppScreen.BOOKING)}
                onViewRanking={() => setScreen(AppScreen.RANKING)}
                onViewAllServices={() => setScreen(AppScreen.ALL_SERVICES)}
                shopConfig={shopConfig}
              />
            )}
            {screen === AppScreen.BOOKING && (
              <BookingFlow
                onCancel={() => setScreen(AppScreen.HOME)}
                onComplete={handleBookingComplete}
                userId={user?.id || ''}
                shopConfig={shopConfig}
              />
            )}
            {screen === AppScreen.MY_APPOINTMENTS && <AppointmentsScreen appointments={appointments} />}
            {screen === AppScreen.RANKING && <RankingScreen shopConfig={shopConfig} currentUserId={user?.id} />}
            {screen === AppScreen.ALL_SERVICES && <AllServicesScreen onBack={() => setScreen(AppScreen.HOME)} shopConfig={shopConfig} />}
            {screen === AppScreen.PROFILE && <ProfileScreen user={user} shopConfig={shopConfig} toggleTheme={toggleTheme} isDarkMode={isDarkMode} onLogout={() => {
              localStorage.clear(); // Limpa TUDO para garantir o "novinho em folha"
              setUser(null);
              setAppointments([]);
              setScreen(AppScreen.AUTH);
            }} />}
            {screen === AppScreen.NOTIFICATIONS_SETTINGS && <NotificationSettings onBack={() => setScreen(AppScreen.PROFILE)} />}
          </>
        )}
      </main>

      {showNav && <Navigation currentScreen={screen} onNavigate={setScreen} />}
    </div>
  );
};

export default App;

