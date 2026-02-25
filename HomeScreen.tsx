
import React, { useEffect, useState } from 'react';
import { User, Service, ShopConfig } from './types.ts';
import { dataRepository, isShopOpen, isManuallyClosed } from './dataRepository.ts';
import { ServiceImage } from './ServiceImage.tsx';
import logoImg from './logo.jpg';
import mapaImg from './mapa_final.jpg';


export const HomeScreen: React.FC<{
  user: User | null;
  onStartBooking: () => void;
  onViewRanking: () => void;
  onViewAllServices: () => void;
  shopConfig: ShopConfig | null
}> = ({ user, onStartBooking, onViewRanking, onViewAllServices, shopConfig }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleMapClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRedirecting(true);
    setTimeout(() => {
      window.open("https://maps.app.goo.gl/KgcpvTgWGBxtUztn7", "_blank");
      setIsRedirecting(false);
    }, 1500);
  };

  // Calcula se a loja está aberta automaticamente com base no horário
  const isOpen = isShopOpen(shopConfig);
  const isClosedManually = isManuallyClosed(shopConfig);

  useEffect(() => {
    const loadData = async () => {
      const fetchedServices = await dataRepository.getServices();
      setServices(fetchedServices);
    };

    loadData();
    return dataRepository.subscribe(loadData);
  }, []);

  return (
    <div className="px-5 pt-10 pb-36 animate-fade-in">
      {/* Overlay de Redirecionamento Premium */}
      {isRedirecting && (
        <div className="fixed inset-0 z-[200] bg-premium-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
          <div className="w-20 h-20 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-6"></div>
          <p className="text-gold font-display text-xl font-bold tracking-widest animate-pulse">ABRINDO MAPA...</p>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] mt-2">Preparando sua rota premium</p>
        </div>
      )}
      <header className="flex justify-between items-center mb-10 animate-slide-up">
        <div>
          <p className="text-gold text-[10px] font-black tracking-[0.3em] uppercase mb-1">Olá, {user?.name.split(' ')[0]}</p>
          <h2 className="font-display text-3xl text-premium-black dark:text-white leading-tight">
            Pronto para um <br /> <span className="text-gold">novo estilo?</span>
          </h2>
          {shopConfig && (
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {isOpen ? `Aberto hoje: ${shopConfig.opening_hours}` : 'Fechada no momento'}
              </p>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border border-gold/20 shadow-gold-glow bg-premium-gray flex items-center justify-center">
          <img
            src={shopConfig?.admin_photo || logoImg}
            alt={shopConfig?.app_name || 'MA Barbearia'}
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Aviso de Barbearia Fechada */}
      {!isOpen && (
        <div className={`mb-8 p-6 rounded-premium animate-bounce ${isClosedManually ? 'bg-red-500/10 border-red-500/20' : 'bg-gold/5 border-gold/10'}`}>
          <div className={`flex items-center gap-3 ${isClosedManually ? 'text-red-500' : 'text-gold'}`}>
            <span className="material-icons-round">{isClosedManually ? 'error_outline' : 'schedule'}</span>
            <p className="text-sm font-bold uppercase tracking-widest">
              {isClosedManually ? 'Barbearia Fechada no Momento' : 'Fora do Horário de Atendimento'}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 font-medium ml-9">
            {isClosedManually
              ? 'O administrador desativou novos agendamentos temporariamente.'
              : 'Agendamentos ficam disponíveis apenas durante nosso horário de funcionamento.'}
          </p>
        </div>
      )}

      {/* Card de Localização (Mapa Final) */}
      <a
        href="https://maps.app.goo.gl/KgcpvTgWGBxtUztn7"
        onClick={handleMapClick}
        className="relative block w-full h-56 rounded-premium overflow-hidden mb-8 shadow-2xl group active:scale-[0.96] transition-all border border-gold/20 bg-premium-gray"
      >
        {/* Shimmer de Carregamento */}
        {mapLoading && (
          <div className="absolute inset-0 shimmer-loading animate-shimmer-premium z-10"></div>
        )}

        <img
          src={mapaImg}
          alt="Localização"
          onLoad={() => setMapLoading(false)}
          onError={() => {
            setMapLoading(false);
            setMapError(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ${mapLoading || mapError ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Fallback caso a imagem falhe */}
        {mapError && (
          <div className="absolute inset-0 bg-premium-charcoal flex flex-col items-center justify-center p-6 text-center">
            <span className="material-icons-round text-gold/20 text-6xl mb-2">map</span>
            <p className="text-gold/40 text-[10px] font-black uppercase tracking-[0.2em]">Mapa indisponível no momento</p>
          </div>
        )}

        {/* Overlay com Gradiente para Legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

        {/* Indicadores Visuais (Ícone e Frases) */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-center gap-3">
            {/* Ícone de Mapa Dourado */}
            <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center shadow-gold-glow group-hover:scale-110 transition-transform">
              <span className="material-icons-round text-premium-black text-2xl">location_on</span>
            </div>

            <div>
              {/* Badge Indicadora */}
              <span className="bg-gold/20 text-gold text-[9px] font-black uppercase px-2 py-1 rounded tracking-widest border border-gold/30 backdrop-blur-sm">
                Nossa Localização
              </span>

              {/* Frases Explicativas */}
              <p className="text-white text-lg font-bold mt-1 drop-shadow-md">
                Como chegar na <span className="text-gold">Barbearia</span>
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 opacity-90">
                <span className="material-icons-round text-gold text-[14px]">explore</span>
                <p className="text-white text-[10px] uppercase font-black tracking-widest">
                  Abrir no Google Maps
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ícone de Mapa Flutuante no Canto */}
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-2 group-hover:bg-gold transition-colors">
          <span className="material-icons-round text-white/80 group-hover:text-premium-black transition-colors">map</span>
        </div>
      </a>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button
          onClick={!isOpen ? undefined : onStartBooking}
          disabled={!isOpen}
          className={`p-6 rounded-premium text-left shadow-luxury border border-transparent transition-all ${isOpen
            ? 'bg-premium-cream dark:bg-premium-gray active:border-gold/50 active:scale-95'
            : 'bg-gray-100 dark:bg-premium-charcoal opacity-50 cursor-not-allowed'
            }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${!isClosedManually ? 'bg-gold/10' : 'bg-gray-200 dark:bg-white/5'}`}>
            <span className={`material-icons-round text-2xl ${!isClosedManually ? 'text-gold' : 'text-gray-400'}`}>event_note</span>
          </div>
          <p className="text-[11px] font-black text-premium-charcoal dark:text-white uppercase tracking-widest leading-tight">Novo<br />Agendamento</p>
        </button>
        <button
          onClick={onViewRanking}
          className="bg-premium-cream dark:bg-premium-gray p-6 rounded-premium text-left shadow-luxury border border-transparent active:border-gold/50 transition-all active:scale-95"
        >
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-icons-round text-gold text-2xl">loyalty</span>
          </div>
          <p className="text-[11px] font-black text-premium-charcoal dark:text-white uppercase tracking-widest leading-tight">Ver meus<br />pontos</p>
        </button>
      </div>

      {/* Serviços em Destaque */}
      <section className="pb-10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Nossos Serviços</h3>
        </div>
        <div className="space-y-4">
          {services.slice(0, 3).map(service => (
            <div key={service.id} className="bg-premium-cream dark:bg-premium-gray p-4 rounded-premium flex items-center gap-4 shadow-luxury group active:scale-[0.98] transition-all relative border border-transparent active:border-gold/30">
              {service.tag && (
                <span className="absolute -top-1 -right-1 bg-gold text-premium-black text-[8px] font-black px-2 py-0.5 rounded shadow-sm z-10 uppercase tracking-tighter">
                  {service.tag}
                </span>
              )}
              <div className="w-14 h-14 rounded-2xl bg-premium-charcoal/5 dark:bg-premium-charcoal/30 flex items-center justify-center grayscale-[30%] group-hover:grayscale-0 transition-all border border-gray-100 dark:border-white/5 overflow-hidden shadow-inner">
                <ServiceImage src={service.imageUrl} name={service.name} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-premium-charcoal dark:text-white group-hover:text-gold transition-colors truncate">{service.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{service.duration} min • {service.category}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-gold">R$ {service.price.toFixed(0)}</p>
              </div>
            </div>
          ))}

          {services.length > 3 && (
            <button
              onClick={onViewAllServices}
              className="w-full py-4 mt-2 border border-gold/20 rounded-premium bg-gold/5 text-gold text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gold/10 active:scale-[0.98] transition-all"
            >
              Ver todos os serviços
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
