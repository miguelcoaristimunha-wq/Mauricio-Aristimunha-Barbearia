
import React, { useEffect, useState } from 'react';
import { Service, ShopConfig } from './types';
import { dataRepository } from './dataRepository';
import { ServiceImage } from './ServiceImage';

export const AllServicesScreen: React.FC<{ onBack: () => void; shopConfig: ShopConfig | null }> = ({ onBack, shopConfig }) => {
    const [services, setServices] = useState<Service[]>([]);

    useEffect(() => {
        const loadServices = async () => {
            const fetchedServices = await dataRepository.getServices();
            setServices(fetchedServices);
        };
        loadServices();
    }, []);

    return (
        <div className="flex-1 flex flex-col bg-premium-pearl dark:bg-premium-black animate-fade-in">
            <header className="relative px-6 pt-16 pb-8 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-premium-black/80 backdrop-blur-xl sticky top-0 z-30">
                <button
                    onClick={onBack}
                    className="absolute left-6 top-16 w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold active:scale-90 transition-all border border-gold/20"
                >
                    <span className="material-icons-round text-2xl">arrow_back</span>
                </button>

                <div className="text-center">
                    <p className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-1">Catálogo Completo</p>
                    <h2 className="text-3xl font-display font-bold text-premium-black dark:text-white">Nossos Serviços</h2>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32 space-y-6 scrollbar-hide">
                {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-20 h-20 rounded-full bg-gold/5 flex items-center justify-center mb-6 animate-pulse">
                            <span className="material-icons-round text-5xl text-gold/20">content_cut</span>
                        </div>
                        <p className="text-xs uppercase tracking-[0.2em] font-black text-gray-500">Buscando serviços...</p>
                    </div>
                ) : (
                    services.map((service, idx) => (
                        <div
                            key={service.id}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                            className="bg-premium-cream dark:bg-premium-gray p-6 rounded-[32px] flex items-center gap-6 shadow-luxury border border-white/50 dark:border-white/5 active:border-gold/30 transition-all group animate-slide-up"
                        >
                            <div className="w-20 h-20 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-500 bg-premium-charcoal/5 dark:bg-premium-charcoal/30 flex items-center justify-center">
                                <ServiceImage src={service.imageUrl} name={service.name} iconSize="text-4xl" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-bold text-premium-charcoal dark:text-white group-hover:text-gold transition-colors truncate">{service.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black bg-gold/10 text-gold px-2 py-0.5 rounded uppercase tracking-widest">{service.category}</span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{service.duration} MIN</span>
                                </div>
                                {service.description && (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 line-clamp-2 leading-relaxed font-medium">
                                        {service.description}
                                    </p>
                                )}
                            </div>

                            <div className="text-right shrink-0">
                                <p className="text-2xl font-black text-gold tracking-tighter">
                                    <span className="text-xs mr-0.5">R$</span>{service.price.toFixed(0)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
