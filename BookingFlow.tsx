
import React, { useState, useEffect } from 'react';
import { BookingStep, Service, Professional, Appointment } from './types';
import { TIME_SLOTS } from './constants';
import { PremiumButton } from './PremiumButton';
import { dataRepository, isManuallyClosed } from './dataRepository';
import { ServiceImage } from './ServiceImage';
import { notificationService } from './notificationService';


interface BookingFlowProps {
  onCancel: () => void;
  onComplete: (appointment: Appointment) => void;
  userId: string;
  shopConfig: any; // Using any to avoid strict type mismatch if versions differ slightly
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ onCancel, onComplete, userId, shopConfig }) => {
  const [step, setStep] = useState<BookingStep>(BookingStep.SERVICE);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  // Generating dates for the next 14 days and filtering by work_days defined in Admin
  const workDays = shopConfig?.work_days || [1, 2, 3, 4, 5, 6]; // Default: Segunda a Sábado

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().split('T')[0],
      display: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', ''),
      weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      full: d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
      dayOfWeek: d.getDay()
    };
  }).filter(date => workDays.includes(date.dayOfWeek))
    .slice(0, 7); // Pega os primeiros 7 dias úteis a partir de hoje

  const [selectedDateIso, setSelectedDateIso] = useState(availableDates[0]?.iso || '');
  const [selectedDate, setSelectedDate] = useState(availableDates[0]?.full || '');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);

  // Guard: Se a barbearia estiver fechada manualmente, mostra tela de erro/aviso
  if (isManuallyClosed(shopConfig)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-icons-round text-red-500 text-4xl">store_front</span>
        </div>
        <h2 className="font-display text-2xl text-premium-black dark:text-white mb-2">Barbearia Fechada</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Desculpe o transtorno, mas o administrador desativou novos agendamentos temporariamente. <br />
          Tente novamente mais tarde!
        </p>
        <button
          onClick={onCancel}
          className="w-full py-4 bg-premium-black dark:bg-white dark:text-premium-black text-white rounded-premium font-bold uppercase tracking-widest active:scale-95 transition-all"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  useEffect(() => {
    const loadData = async () => {
      const [s, p] = await Promise.all([
        dataRepository.getServices(),
        dataRepository.getProfessionals()
      ]);
      setServices(s);
      setProfessionals(p);
    };
    loadData();
    return dataRepository.subscribe(loadData);
  }, []);

  // Fetch availability when entering TIME step or when professional changes
  useEffect(() => {
    if (step === BookingStep.TIME && selectedProfessional) {
      const checkAvailability = async () => {
        try {
          const appointments = await dataRepository.getAppointmentsForDate(selectedDateIso);

          const taken = appointments
            .filter((appt: any) => {
              // 1. Slot occupied by THIS professional (regardless of who booked)
              const isProfessionalBusy = appt.professional_id === selectedProfessional.id;

              // 2. Slot occupied by THIS user (regardless of professional)
              // We need to parse session again or assume userId passed prop is correct
              // The user ID check handles "prevent same user double booking"
              const sessionUser = JSON.parse(localStorage.getItem('luxury_barber_user') || '{}');
              const currentUserId = sessionUser.id || userId;
              const isUserBusy = appt.client_id === currentUserId;

              return isProfessionalBusy || isUserBusy;
            })
            .map(appt => appt.time);

          setUnavailableSlots(taken);
        } catch (err) {
          console.error('Error checking availability:', err);
        }
      };

      checkAvailability();
    }
  }, [step, selectedProfessional, selectedDateIso, userId]);

  const handleNext = () => {
    if (step === BookingStep.SERVICE) setStep(BookingStep.PROFESSIONAL);
    else if (step === BookingStep.PROFESSIONAL) setStep(BookingStep.TIME);
    else if (step === BookingStep.TIME) setStep(BookingStep.CONFIRMATION);
  };

  const handleBack = () => {
    if (step === BookingStep.SERVICE) onCancel();
    else if (step === BookingStep.PROFESSIONAL) setStep(BookingStep.SERVICE);
    else if (step === BookingStep.TIME) setStep(BookingStep.PROFESSIONAL);
    else if (step === BookingStep.CONFIRMATION) setStep(BookingStep.TIME);
  };

  const confirmBooking = async () => {
    if (selectedService && selectedProfessional && selectedTime && !isSubmitting) {
      setIsSubmitting(true);
      const appointmentData = {
        service: selectedService,
        professional: selectedProfessional,
        date: selectedDateIso, // Use ISO format for DB
        time: selectedTime,
        status: 'pending' as const,
        totalPrice: selectedService.price
      };

      const sessionUser = JSON.parse(localStorage.getItem('luxury_barber_user') || '{}');
      const newAppointment = await dataRepository.createAppointment(appointmentData, sessionUser.id || userId);

      setIsSubmitting(false);
      if (newAppointment) {
        // Agendar lembrete se estiver ativado
        notificationService.scheduleReminder(
          newAppointment.date,
          newAppointment.time,
          newAppointment.service.name
        );
        onComplete(newAppointment);
      } else {
        console.error('Falha ao criar agendamento: Retorno nulo do repositório.');
        alert('Não foi possível realizar o agendamento. Verifique sua conexão e tente novamente.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-32 animate-slide-up">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={handleBack} className="w-10 h-10 rounded-full bg-white dark:bg-premium-gray flex items-center justify-center">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-bold dark:text-white">Agendamento</h2>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition-colors ${(step === BookingStep.SERVICE && i === 1) ||
                  (step === BookingStep.PROFESSIONAL && i <= 2) ||
                  (step === BookingStep.TIME && i <= 3) ||
                  (step === BookingStep.CONFIRMATION && i <= 4)
                  ? 'bg-gold' : 'bg-gray-300 dark:bg-gray-800'
                  }`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Contents */}
      <div className="flex-1">
        {step === BookingStep.SERVICE && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Selecione o Serviço</h3>
            <div className="space-y-4">
              {services.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className={`p-4 rounded-premium border-2 transition-all cursor-pointer relative shadow-luxury ${selectedService?.id === s.id ? 'border-gold bg-gold/5' : 'border-transparent bg-premium-cream dark:bg-premium-gray'
                    }`}
                >
                  {s.tag && (
                    <span className="absolute -top-1 -right-1 bg-gold text-premium-black text-[8px] font-black px-2 py-0.5 rounded shadow-sm z-10 uppercase tracking-tighter">
                      {s.tag}
                    </span>
                  )}
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-premium-charcoal/5 dark:bg-premium-charcoal/30 flex items-center justify-center border border-gray-100 dark:border-white/5 overflow-hidden shrink-0 shadow-inner">
                      <ServiceImage src={s.imageUrl} name={s.name} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold dark:text-white">{s.name}</h4>
                        <span className="text-gold font-bold">R$ {s.price}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{s.description}</p>
                      <p className="text-[10px] font-bold text-gold uppercase mt-1 tracking-widest">{s.duration} MIN • {s.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === BookingStep.PROFESSIONAL && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Selecione o Barbeiro</h3>
            <div className="grid grid-cols-2 gap-4">
              {professionals.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProfessional(p)}
                  className={`p-4 rounded-premium border-2 text-center transition-all cursor-pointer group shadow-luxury ${selectedProfessional?.id === p.id ? 'border-gold bg-gold/5' : 'border-transparent bg-premium-cream dark:bg-premium-gray'
                    }`}
                >
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-transparent group-hover:border-gold overflow-hidden bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-icons-round text-gray-400 text-4xl">person</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold dark:text-white">{p.name}</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{p.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === BookingStep.TIME && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Escolha o Horário</h3>

            {/* Seletor de Data Horizontal */}
            <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide -mx-6 px-6">
              {availableDates.map(date => (
                <button
                  key={date.iso}
                  onClick={() => {
                    setSelectedDateIso(date.iso);
                    setSelectedDate(date.full);
                    setSelectedTime(null); // Limpa o horário ao trocar de dia
                  }}
                  className={`flex flex-col items-center min-w-[70px] p-4 rounded-2xl border-2 transition-all ${selectedDateIso === date.iso
                    ? 'border-gold bg-gold/10 shadow-gold-glow'
                    : 'border-transparent bg-premium-cream dark:bg-premium-gray opacity-60'
                    }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedDateIso === date.iso ? 'text-gold' : 'text-gray-400'}`}>
                    {date.weekday}
                  </span>
                  <span className={`text-lg font-black ${selectedDateIso === date.iso ? 'text-gold' : 'dark:text-white'}`}>
                    {date.display.split(' de')[0]}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-sm text-gold font-bold mb-4 capitalize">
              {selectedDate}
            </p>

            <div className="grid grid-cols-3 gap-3">
              {(shopConfig?.time_slots || TIME_SLOTS).map(time => {
                const isTaken = unavailableSlots.includes(time);

                // --- Past Time Check with Buffer ---
                let isPast = false;
                const today = new Date();
                const todayIso = today.toISOString().split('T')[0];

                // Só bloqueia horários passados se o dia selecionado for HOJE
                if (selectedDateIso === todayIso) {
                  const now = new Date();
                  const [slotHour, slotMin] = time.split(':').map(Number);
                  const slotTime = new Date();
                  slotTime.setHours(slotHour, slotMin, 0, 0);

                  // Buffer de 15 minutos (não permite agendar algo que começa em menos de 15 min)
                  const bufferTime = new Date(now.getTime() + 15 * 60000);

                  if (slotTime < bufferTime) {
                    isPast = true;
                  }
                }

                const isDisabled = isTaken || isPast;

                return (
                  <button
                    key={time}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && setSelectedTime(time)}
                    className={`py-3 rounded-premium font-bold text-sm transition-all relative shadow-luxury ${selectedTime === time
                      ? 'bg-gold text-premium-black shadow-gold-glow'
                      : isDisabled
                        ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/10 cursor-not-allowed border-none shadow-none'
                        : 'bg-premium-cream dark:bg-premium-gray text-gray-400 hover:border-gold/50 border-2 border-transparent'
                      }`}
                  >
                    {time}
                    {isTaken && !isPast && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-6 mt-4">
              Horários indisponíveis estão bloqueados.
            </p>
          </div>
        )}

        {step === BookingStep.CONFIRMATION && (
          <div className="animate-slide-up flex flex-col items-center">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-6">
              <span className="material-icons-round text-gold text-3xl">verified</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white text-center">Revisar Reserva</h3>
            <p className="text-gray-500 text-sm mb-8 text-center">Confirme se os detalhes abaixo estão corretos.</p>

            <div className="w-full bg-premium-cream dark:bg-premium-gray rounded-premium p-6 shadow-luxury border border-white/50 dark:border-white/5 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Serviço</span>
                <span className="text-sm font-bold dark:text-white">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Barbeiro</span>
                <span className="text-sm font-bold dark:text-white">{selectedProfessional?.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Data & Hora</span>
                <span className="text-sm font-bold dark:text-white">{selectedDate}, {selectedTime}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total</span>
                <span className="text-xl font-bold text-gold">R$ {selectedService?.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persistence Button */}
      <div className="mt-8">
        <PremiumButton
          disabled={
            isSubmitting ||
            (step === BookingStep.SERVICE && !selectedService) ||
            (step === BookingStep.PROFESSIONAL && !selectedProfessional) ||
            (step === BookingStep.TIME && !selectedTime)
          }
          onClick={step === BookingStep.CONFIRMATION ? confirmBooking : handleNext}
        >
          {isSubmitting ? 'Agendando...' : (step === BookingStep.CONFIRMATION ? 'Confirmar Agendamento' : 'Próximo')}
        </PremiumButton>
      </div>
    </div>
  );
};

