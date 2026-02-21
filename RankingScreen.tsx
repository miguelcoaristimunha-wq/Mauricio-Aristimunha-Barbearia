
import React, { useEffect, useState } from 'react';
import { RankingItem, ShopConfig } from './types';
import { dataRepository } from './dataRepository';

export const RankingScreen: React.FC<{
  shopConfig: ShopConfig | null;
  currentUserId?: string;
}> = ({ shopConfig, currentUserId }) => {
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    const loadRanking = async () => {
      const data = await dataRepository.getRanking();
      setRanking(data);

      // Auto-scroll para o usuário atual
      if (currentUserId && data.length > 0) {
        setTimeout(() => {
          const userIndex = data.findIndex(item => item.id === currentUserId);
          if (userIndex !== -1) {
            const element = document.getElementById(`rank-${currentUserId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('ring-2', 'ring-gold', 'scale-[1.02]');
              setTimeout(() => element.classList.remove('scale-[1.02]'), 1000);
            }
          }
        }, 500);
      }
    };
    loadRanking();

    // Opcional: Inscrever para atualizações se houver mirroring no ranking também
    return dataRepository.subscribe(loadRanking);
  }, [currentUserId]);

  return (
    <div className="flex-1 px-6 pt-12 pb-32 animate-slide-up overflow-y-auto scrollbar-hide">
      <header className="mb-8 text-center">
        <div className="inline-block p-3 bg-gold/10 rounded-full mb-4">
          <span className="material-icons-round text-gold text-4xl">workspace_premium</span>
        </div>
        <h2 className="text-3xl font-bold dark:text-white">Elite VIP</h2>
        <p className="text-gray-500 text-sm mt-2 font-medium">Os clientes mais fiéis da {shopConfig?.app_name || 'Maurício Aristimunha Barbearia'}</p>
      </header>

      <div className="space-y-4">
        {ranking.length > 0 ? (
          ranking.map((item, index) => {
            const isCurrentUser = item.id === currentUserId;
            return (
              <div
                key={item.id}
                id={`rank-${item.id}`}
                className={`relative flex items-center gap-4 p-5 rounded-premium transition-all border shadow-lg ${index === 0
                  ? 'bg-gradient-to-r from-gold/20 to-gold/5 border-gold shadow-gold-glow-strong'
                  : isCurrentUser
                    ? 'bg-gold/10 border-gold/50 shadow-gold-glow'
                    : 'bg-white dark:bg-premium-gray/50 border-white/5'
                  }`}
              >
                {/* Medal/Rank */}
                <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-lg ${index === 0 ? 'bg-gold text-premium-black' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-premium-charcoal text-gray-400'
                  }`}>
                  {index === 0 ? <span className="material-icons-round">emoji_events</span> : index + 1}
                </div>

                {/* Avatar */}
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 ${index === 0 ? 'border-gold bg-gold/5' : 'border-white/10 bg-premium-gray/50'}`}>
                    {item.avatar ? (
                      <img src={item.avatar} className="w-full h-full object-cover" alt={item.name} />
                    ) : (
                      <span className={`material-icons-round ${index === 0 ? 'text-gold' : 'text-gray-500'} text-3xl`}>person</span>
                    )}
                  </div>
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 bg-gold text-premium-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-premium-black shadow-lg">
                      <span className="material-icons-round text-[14px]">auto_awesome</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className={`font-bold ${index === 0 ? 'text-gold text-lg' : 'dark:text-white'} ${isCurrentUser ? 'text-gold' : ''}`}>
                    {item.name} {isCurrentUser && '(Você)'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-icons-round text-[12px] text-gray-400">content_cut</span>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{item.cuts} Atendimentos</p>
                  </div>
                </div>

                {/* Label for First Place */}
                {index === 0 && (
                  <div className="absolute top-2 right-4">
                    <span className="text-[8px] font-black bg-gold/20 text-gold px-2 py-1 rounded-full uppercase tracking-tighter">Líder do Mês</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 opacity-50">
            <span className="material-icons-round text-4xl mb-2">military_tech</span>
            <p className="text-sm font-bold uppercase tracking-widest">Nenhum dado de ranking</p>
          </div>
        )}
      </div>

      <div className="mt-10 p-6 bg-gold/5 border border-gold/10 rounded-premium text-center">
        <p className="text-xs text-gold font-bold uppercase tracking-widest mb-2">Como subir no ranking?</p>
        <p className="text-[10px] text-gray-500 font-medium">Cada serviço realizado garante 1 ponto. Os Top 3 ganham benefícios exclusivos no final do mês.</p>
      </div>
    </div>
  );
};

