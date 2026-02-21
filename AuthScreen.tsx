
import React, { useState } from 'react';
import { PremiumButton } from './PremiumButton';
import { ShopConfig } from './types';

export const AuthScreen: React.FC<{
    onLogin: (data: { name: string; whatsapp: string; birthday: string }, mode: 'login' | 'register') => Promise<boolean>;
    shopConfig: ShopConfig | null
}> = ({ onLogin, shopConfig }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [birthday, setBirthday] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'login' && whatsapp.length === 11) {
            setIsLoading(true);
            try {
                // No modo login, tentamos entrar apenas com o WhatsApp
                const success = await onLogin({ name: '', whatsapp, birthday: '' }, 'login');
                if (!success) {
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Erro ao processar login:', err);
                setIsLoading(false);
            }
        } else if (mode === 'register' && name && whatsapp.length === 11 && birthday) {
            setIsLoading(true);
            try {
                const success = await onLogin({ name, whatsapp, birthday }, 'register');
                if (!success) {
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Erro ao processar cadastro:', err);
                setIsLoading(false);
            }
        }
    };

    const appName = shopConfig?.app_name || 'Maurício Aristimunha Barbearia';
    const logoSrc = shopConfig?.admin_photo || '/logo.jpg';

    return (
        <div className="flex-1 px-6 pt-16 flex flex-col bg-premium-pearl dark:bg-premium-black animate-fade-in pb-12">
            <div className="flex justify-center mb-8">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold/30 shadow-gold-glow">
                    <img src={shopConfig?.admin_photo || '/logo.jpg'} alt={appName} className="w-full h-full object-cover" />
                </div>
            </div>

            <div className="mb-8 text-center">
                <p className="text-gold text-xs font-bold tracking-widest uppercase mb-1">Seja Bem-vindo</p>
                <h2 className="text-3xl font-bold text-premium-black dark:text-white">
                    {mode === 'login' ? 'Acesse sua conta' : 'Crie seu perfil'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-[250px] mx-auto">
                    {mode === 'login'
                        ? 'Entre com seu WhatsApp para ver seus agendamentos.'
                        : 'Cadastre-se para aproveitar nossos serviços exclusivos.'}
                </p>
            </div>

            <div className="flex bg-gray-100 dark:bg-premium-gray p-1 rounded-2xl mb-8 relative z-20 shadow-inner">
                <button
                    onClick={() => setMode('login')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-gold text-premium-black shadow-md' : 'text-gray-500 hover:text-gold'}`}
                >
                    Entrar
                </button>
                <button
                    onClick={() => setMode('register')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'register' ? 'bg-gold text-premium-black shadow-md' : 'text-gray-500 hover:text-gold'}`}
                >
                    Cadastrar
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
                {mode === 'register' && (
                    <div className="space-y-2 relative z-10 transition-all">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Seu Nome</label>
                        <div className="relative">
                            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                            <input
                                type="text"
                                placeholder="Ex: João da Silva"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/70 dark:bg-premium-gray border border-gray-100 dark:border-white/5 rounded-premium py-4 pl-12 pr-4 text-sm focus:ring-1 focus:ring-gold transition-all text-premium-black dark:text-white shadow-sm cursor-text select-text"
                                required={mode === 'register'}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2 relative z-10">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Seu WhatsApp</label>
                    <div className="relative">
                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">chat</span>
                        <input
                            type="tel"
                            placeholder="48988687531"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            className="w-full bg-white/70 dark:bg-premium-gray border border-gray-100 dark:border-white/5 rounded-premium py-4 pl-12 pr-4 text-sm focus:ring-1 focus:ring-gold transition-all text-premium-black dark:text-white shadow-sm cursor-text select-text"
                            required
                        />
                    </div>
                </div>

                {mode === 'register' && (
                    <div className="space-y-2 relative z-10 transition-all">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Data de Nascimento</label>
                        <div className="relative">
                            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">cake</span>
                            <input
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                className="w-full bg-white/70 dark:bg-premium-gray border border-gray-100 dark:border-white/5 rounded-premium py-4 pl-12 pr-4 text-sm focus:ring-1 focus:ring-gold transition-all text-premium-black dark:text-white shadow-sm cursor-text select-text"
                                required={mode === 'register'}
                            />
                        </div>
                    </div>
                )}

                <div className="pt-6">
                    <PremiumButton
                        icon={isLoading ? "refresh" : mode === 'login' ? "login" : "person_add"}
                        disabled={
                            isLoading ||
                            whatsapp.length < 11 ||
                            (mode === 'register' && (!name || !birthday))
                        }
                    >
                        {isLoading ? 'Processando...' : mode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'}
                    </PremiumButton>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gold transition-colors"
                        >
                            {mode === 'login' ? 'Ainda não é cliente? Cadastre-se' : 'Já tem cadastro? Entre aqui'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
