
import React, { useState, useEffect } from 'react';
import { Appointment } from './types';
import { dataRepository } from './dataRepository';

export const AppointmentsScreen: React.FC<{ appointments: Appointment[] }> = ({ appointments: initialAppointments }) => {
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [loading, setLoading] = useState(false);

    const refreshAppointments = async () => {
        try {
            setLoading(true);
            const savedUser = localStorage.getItem('luxury_barber_user');
            if (!savedUser) return;
            const user = JSON.parse(savedUser);
            if (!user?.id) return;
            const fresh = await dataRepository.getAppointments(user.id);
            setAppointments(fresh);
        } catch (e) {
            console.error('Erro ao recarregar agendamentos:', e);
        } finally {
            setLoading(false);
        }
    };

    // Refresh on mount and subscribe to realtime changes
    useEffect(() => {
        refreshAppointments();

        const unsubscribe = dataRepository.subscribe(() => {
            refreshAppointments();
        });

        // Also poll every 30s as fallback for Realtime latency
        const interval = setInterval(refreshAppointments, 30000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="flex-1 px-6 pt-12 pb-32 animate-fade-in">
            <header className="mb-8">
                <p className="text-gold text-xs font-bold tracking-widest uppercase mb-1">Seu Histórico</p>
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold dark:text-white">Minha Agenda</h2>
                    <button
                        onClick={refreshAppointments}
                        disabled={loading}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-gold/10 transition-opacity"
                        title="Atualizar"
                    >
                        <span className={`material-icons-round text-gold text-lg ${loading ? 'animate-spin' : ''}`}>
                            {loading ? 'sync' : 'refresh'}
                        </span>
                    </button>
                </div>
            </header>

            {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <div className="w-20 h-20 bg-premium-gray rounded-full flex items-center justify-center mb-6">
                        <span className="material-icons-round text-4xl text-gray-600">event_busy</span>
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum agendamento ativo</p>
                    <p className="text-gray-500 text-sm mt-2">Seus futuros cortes aparecerão aqui.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {appointments.map(appt => (
                        <div key={appt.id} className={`bg-white dark:bg-premium-gray rounded-premium p-6 relative overflow-hidden shadow-md border-l-4 ${appt.status === 'pending' ? 'border-gray-400' :
                            appt.status === 'confirmed' ? 'border-gold shadow-gold-glow' :
                                (appt.status === 'canceled' || appt.status === 'cancelled') ? 'border-red-500 opacity-60' :
                                    'border-green-500'
                            }`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${appt.status === 'pending' ? 'bg-gray-100 text-gray-500 dark:bg-white/5' :
                                            appt.status === 'confirmed' ? 'bg-gold/10 text-gold' :
                                                (appt.status === 'canceled' || appt.status === 'cancelled') ? 'bg-red-500/10 text-red-500' :
                                                    'bg-green-500/10 text-green-500'
                                            }`}>
                                            {appt.status === 'pending' ? 'Aguardando Admin...' :
                                                appt.status === 'confirmed' ? 'Confirmado' :
                                                    (appt.status === 'canceled' || appt.status === 'cancelled') ? 'Cancelado' : 'Concluído'}
                                        </span>
                                        {appt.status === 'pending' && (
                                            <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold dark:text-white mt-2">{appt.service?.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">com {appt.professional?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold dark:text-white">{appt.time}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{appt.date}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                <button
                                    onClick={async () => {
                                        if (appt.status === 'canceled' || appt.status === 'cancelled' || appt.status === 'completed') return;
                                        if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
                                            await dataRepository.cancelAppointment(appt.id);
                                            await refreshAppointments();
                                        }
                                    }}
                                    disabled={appt.status === 'canceled' || appt.status === 'cancelled' || appt.status === 'completed'}
                                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors ${appt.status === 'canceled' || appt.status === 'cancelled' || appt.status === 'completed'
                                        ? 'bg-gray-100 text-gray-300 dark:bg-white/5 cursor-not-allowed border-none'
                                        : 'text-gray-400 border border-gray-100 dark:border-white/5 hover:bg-red-50 hover:text-red-500 hover:border-red-100'
                                        }`}
                                >
                                    {(appt.status === 'canceled' || appt.status === 'cancelled') ? 'Cancelado' : appt.status === 'completed' ? 'Concluído' : 'Cancelar'}
                                </button>
                                <button
                                    onClick={() => window.open('https://maps.app.goo.gl/KgcpvTgWGBxtUztn7', '_blank')}
                                    className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-gold border border-gold/30 rounded-xl hover:bg-gold/10 transition-colors"
                                >
                                    Localização
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
