
import React from 'react';
import { AppScreen, ShopConfig } from './types';
import { isShopOpen } from './dataRepository';

interface BottomNavProps {
    currentScreen: AppScreen;
    onNavigate: (screen: AppScreen) => void;
    shopConfig: ShopConfig | null;
}

const tabs = [
    { screen: AppScreen.HOME, icon: 'grid_view', label: 'Início' },
    { screen: AppScreen.MY_APPOINTMENTS, icon: 'calendar_today', label: 'Agenda' },
    { screen: AppScreen.BOOKING, icon: 'add', label: 'Agendar', isFab: true },
    { screen: AppScreen.RANKING, icon: 'workspace_premium', label: 'Ranking' },
    { screen: AppScreen.PROFILE, icon: 'person', label: 'Perfil' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, shopConfig }) => {
    const isOpen = isShopOpen(shopConfig);
    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50">
            <div className="bg-white/95 dark:bg-premium-black/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 px-2 pb-safe">
                <div className="flex items-center justify-center h-14 relative gap-0.5">
                    {tabs.map(tab => {
                        const isActive = currentScreen === tab.screen;

                        if (tab.isFab) {
                            return (
                                <div key={tab.screen} className={`flex-1 flex justify-center -mt-8 ${!isOpen ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <button
                                        onClick={() => isOpen && onNavigate(tab.screen)}
                                        disabled={!isOpen}
                                        className="w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-gold-glow-strong border-4 border-white dark:border-premium-black active:scale-95 transition-all"
                                    >
                                        <span className="material-icons-round text-premium-black text-3xl">add</span>
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <button
                                key={tab.screen}
                                onClick={() => onNavigate(tab.screen)}
                                className={`flex-1 flex flex-col items-center justify-center h-full transition-all gap-0.5 ${isActive ? 'text-gold' : 'text-gray-400 dark:text-gray-500'}`}
                            >
                                <span className={`material-icons-round text-[24px] transition-transform ${isActive ? 'scale-110' : ''}`}>
                                    {tab.icon}
                                </span>
                                <span className={`text-[6px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-gold' : ''}`}>
                                    {tab.label}
                                </span>
                                <div className={`w-1 h-1 bg-gold rounded-full transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};
