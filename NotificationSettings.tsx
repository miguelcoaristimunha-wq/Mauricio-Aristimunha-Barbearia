
import React, { useState } from 'react';
import { PremiumButton } from './PremiumButton';
import { notificationService } from './notificationService';

interface NotificationSettingsProps {
    onBack: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'denied'
    );
    const [isEnabled, setIsEnabled] = useState(notificationService.isEnabled());

    const handleToggleCapture = async () => {
        if (permissionStatus !== 'granted') {
            const status = await notificationService.requestPermission();
            setPermissionStatus(status);
            if (status === 'granted') {
                notificationService.setEnabled(true);
                setIsEnabled(true);
            }
        } else {
            const nextState = !isEnabled;
            notificationService.setEnabled(nextState);
            setIsEnabled(nextState);
        }
    };

    return (
        <div className="flex-1 px-6 pt-12 pb-32 animate-fade-in flex flex-col">
            <header className="flex items-center gap-4 mb-10">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-premium-cream dark:bg-premium-gray flex items-center justify-center shadow-luxury">
                    <span className="material-icons-round text-gold">arrow_back</span>
                </button>
                <h2 className="text-xl font-bold dark:text-white">Notificações</h2>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 mb-12">
                <div className="w-24 h-24 rounded-[32px] bg-gold/10 flex items-center justify-center shadow-gold-glow relative">
                    <span className="material-icons-round text-5xl text-gold animate-float">notifications_active</span>
                    <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">30m</div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-2xl font-bold dark:text-white tracking-tight">Lembretes de Corte</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed font-medium">
                        Nunca mais esqueça um agendamento. Nós te avisamos <span className="text-gold font-bold">30 minutos antes</span> de cada horário marcado para você chegar no estilo e com calma.
                    </p>
                </div>

                <div className="w-full bg-premium-cream/50 dark:bg-premium-gray/50 p-6 rounded-premium border border-dashed border-gold/30">
                    <div className="flex items-start gap-3 text-left">
                        <span className="material-icons-round text-gold text-lg">verified_user</span>
                        <p className="text-[11px] text-gray-400 uppercase font-black tracking-widest leading-relaxed">
                            Respeitamos sua privacidade. Você receberá apenas lembretes dos seus próprios agendamentos confirmados.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {permissionStatus === 'denied' && (
                    <p className="text-[10px] text-rose-500 font-bold text-center uppercase tracking-tighter">
                        ⚠️ Notificações bloqueadas no navegador. Redefina as permissões no cadeado da barra de endereço.
                    </p>
                )}

                <PremiumButton
                    variant={isEnabled ? "secondary" : "primary"}
                    onClick={handleToggleCapture}
                    disabled={permissionStatus === 'denied' && !isEnabled}
                >
                    {isEnabled ? 'Desativar Lembretes' : 'Ativar Lembretes (30 min antes)'}
                </PremiumButton>

                <p className="text-center text-[10px] text-gray-400 font-medium">
                    Ao clicar em ativar, seu navegador solicitará permissão para exibir avisos.
                </p>
            </div>
        </div>
    );
};
