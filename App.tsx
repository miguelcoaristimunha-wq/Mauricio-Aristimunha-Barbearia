
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
import { dataRepository, isShopOpen } from './dataRepository';
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
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [shopConfig, setShopConfig] = useState<ShopConfig | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Expose navigation for children without prop drilling
  useEffect(() => {
    (window as any).setAppScreen = setScreen;
  }, []);

  // Reset scroll on screen change
  useEffect(() => {
    window.scrollTo(0, 0);
    // Force nested scrollable elements to top if they exist
    const scrollables = document.querySelectorAll('.overflow-y-auto');
    scrollables.forEach(el => el.scrollTop = 0);
  }, [screen]);

  // Total Lock: Se a loja fechar e o usuário estiver tentando agendar, volta pro início
  useEffect(() => {
    if (screen === AppScreen.BOOKING && !isShopOpen(shopConfig)) {
      setScreen(AppScreen.HOME);
    }
  }, [screen, shopConfig]);

  // Sincronização e Mirroring
  useEffect(() => {
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

    const loadGlobalData = async () => {
      try {
        const [s, p, config] = await Promise.all([
          dataRepository.getServices(),
          dataRepository.getProfessionals(),
          dataRepository.getConfig()
        ]);
        setServices(s);
        setProfessionals(p);
        if (config) {
          setShopConfig(config);
          applyDynamicTheme(config);
        }
      } catch (e) {
        console.error('Erro ao carregar dados globais:', e);
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
          loadGlobalData(),
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

    const unsubscribeAppointments = dataRepository.subscribeToChanges('appointments', (payload) => {
      console.log('Real-time appointment update:', payload);
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setAppointments(prev => {
        if (eventType === 'INSERT') {
          if (prev.some(a => a.id === newRecord.id)) return prev;

          const mappedRecord = {
            ...newRecord,
            clientId: newRecord.client_id,
            serviceId: newRecord.service_id,
            professionalId: newRecord.professional_id,
            totalPrice: newRecord.price || newRecord.totalPrice
          };
          return [mappedRecord, ...prev];
        }
        if (eventType === 'UPDATE') {
          return prev.map(a => a.id === newRecord.id ? {
            ...a,
            ...newRecord,
            clientId: newRecord.client_id || a.clientId,
            serviceId: newRecord.service_id || a.serviceId,
            professionalId: newRecord.professional_id || (a as any).professionalId,
            totalPrice: newRecord.price || newRecord.total_price || a.totalPrice
          } : a);
        }
        if (eventType === 'DELETE') return prev.filter(a => a.id !== oldRecord.id);
        return prev;
      });
    });

    const unsubscribeGlobal = dataRepository.subscribeToAll(() => {
      console.log('🔄 Sincronização Global Ativada...');
      loadGlobalData();
    });

    const unsubscribeProfile = dataRepository.subscribeToChanges('clients', (payload) => {
      const { eventType, new: newRecord } = payload;
      if (user?.id && (newRecord?.id === user.id || payload.old?.id === user.id)) {
        console.log('Real-time profile update:', payload);
        if (eventType === 'DELETE') {
          localStorage.clear();
          setUser(null);
          setScreen(AppScreen.AUTH);
          return;
        }
        if (newRecord) {
          const updatedUser = {
            ...user,
            ...newRecord,
            whatsapp: newRecord.phone || user.whatsapp
          };
          setUser(updatedUser);
          localStorage.setItem('luxury_barber_user', JSON.stringify(updatedUser));
        }
      }
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeGlobal();
      unsubscribeProfile();
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
    <div className={`h-[100dvh] flex flex-col max-w-lg mx-auto overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      <main className="flex-1 overflow-y-auto min-h-0 bg-premium-pearl dark:bg-premium-black scrollbar-hide overscroll-contain">
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
                services={services}
              />
            )}
            {screen === AppScreen.BOOKING && (
              <BookingFlow
                onCancel={() => setScreen(AppScreen.HOME)}
                onComplete={handleBookingComplete}
                userId={user?.id || ''}
                shopConfig={shopConfig}
                services={services}
                professionals={professionals}
              />
            )}
            {screen === AppScreen.MY_APPOINTMENTS && <AppointmentsScreen appointments={appointments} />}
            {screen === AppScreen.RANKING && <RankingScreen shopConfig={shopConfig} currentUserId={user?.id} />}
            {screen === AppScreen.ALL_SERVICES && <AllServicesScreen onBack={() => setScreen(AppScreen.HOME)} shopConfig={shopConfig} services={services} />}
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

      {showNav && <Navigation currentScreen={screen} onNavigate={setScreen} shopConfig={shopConfig} />}
    </div>
  );
};

export default App;

