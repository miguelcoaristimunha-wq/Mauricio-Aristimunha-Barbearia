
import React from 'react';

interface LoadingOverlayProps {
    message?: string;
    subMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    message = "CARREGANDO...",
    subMessage = "Preparando sua experiência premium"
}) => {
    return (
        <div className="fixed inset-0 z-[500] bg-premium-black/60 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
            {/* Container Principal */}
            <div className="relative w-24 h-24 mb-8">
                {/* Glow de fundo */}
                <div className="absolute inset-0 bg-gold/20 rounded-full blur-2xl animate-pulse-slow"></div>

                {/* Spinner de Arco Dourado */}
                <div className="absolute inset-0 border-[3px] border-gold/10 rounded-full"></div>
                <div className="absolute inset-0 border-[3px] border-t-gold rounded-full animate-spin"></div>

                {/* Ícone central discreto */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-icons-round text-gold/40 text-2xl animate-pulse">content_cut</span>
                </div>
            </div>

            {/* Texto de Carregamento */}
            <div className="text-center">
                <h3 className="text-gold font-display text-lg font-bold tracking-[0.4em] uppercase mb-2 animate-pulse">
                    {message}
                </h3>
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">
                    {subMessage}
                </p>
            </div>

            {/* Detalhe de linha de progresso infinita no fundo */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-white/5 overflow-hidden">
                <div className="w-24 h-full bg-gradient-to-r from-transparent via-gold/50 to-transparent animate-[shimmer-loading_2s_linear_infinite]"></div>
            </div>
        </div>
    );
};
