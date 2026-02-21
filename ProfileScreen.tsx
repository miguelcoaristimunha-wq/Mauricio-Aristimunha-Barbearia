
import React from 'react';
import { User, ShopConfig } from './types';
import { PremiumButton } from './PremiumButton';

interface ProfileScreenProps {
  user: User | null;
  shopConfig: ShopConfig | null;
  toggleTheme: () => void;
  isDarkMode: boolean;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, shopConfig, toggleTheme, isDarkMode, onLogout }) => {
  return (
    <div className="flex-1 px-6 pt-12 pb-32 animate-fade-in">
      <header className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-full border-4 border-gold p-1 mb-4 shadow-gold-glow bg-white">
          <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=D4AF37&color=000`} className="w-full h-full rounded-full" alt="Profile" />
        </div>
        <h2 className="text-2xl font-bold text-premium-black dark:text-white">{user?.name}</h2>
      </header>

      <div className="space-y-3 mb-10">
        <div className="bg-premium-cream/80 dark:bg-premium-gray p-5 rounded-premium flex items-center justify-between shadow-luxury border border-white/50 dark:border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <span className="material-icons-round text-gold">dark_mode</span>
            </div>
            <span className="text-sm font-bold text-premium-charcoal dark:text-white">Modo Noturno</span>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition-all duration-500 relative ${isDarkMode ? 'bg-gold shadow-gold-glow' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm bg-white transition-all ${isDarkMode ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        {[
          { icon: 'notifications', label: 'Notificações', onClick: () => (window as any).setAppScreen?.('NOTIFICATIONS_SETTINGS') },
          {
            icon: 'help_outline',
            label: 'Central de Ajuda',
            onClick: () => window.open('https://wa.me/5548988278656?text=Olá! Preciso de ajuda com o app.', '_blank')
          }
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={item.onClick}
            className={`bg-premium-cream/80 dark:bg-premium-gray p-5 rounded-premium flex items-center justify-between shadow-luxury border border-white/50 dark:border-white/5 backdrop-blur-sm active:scale-[0.98] transition-transform ${item.onClick ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                <span className="material-icons-round text-gold">{item.icon}</span>
              </div>
              <span className="text-sm font-bold text-premium-charcoal dark:text-white">{item.label}</span>
            </div>
            <span className="material-icons-round text-gray-400 text-lg">chevron_right</span>
          </div>
        ))}
      </div>

      <PremiumButton variant="secondary" onClick={onLogout}>
        Sair da Conta
      </PremiumButton>

    </div>
  );
};
