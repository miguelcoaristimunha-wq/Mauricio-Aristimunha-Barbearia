import { supabase } from './supabase';
import { Service, Professional, Appointment, User, ShopConfig, RankingItem } from './types';

/**
 * Utility to get current local date in YYYY-MM-DD format (prevents UTC issues at night)
 */
export const getLocalDateISO = (date: Date = new Date()): string => {
    // Manually offset to local time or use locale string components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Checks ONLY if the admin manually closed the shop
 */
export const isManuallyClosed = (config: ShopConfig | null): boolean => {
    return config?.is_open === false;
};

/**
 * Utility to check if a specific "HH:MM" time is within an "HH:MM - HH:MM" range
 */
export const isTimeWithinRange = (time: string, range: string | undefined): boolean => {
    if (!range) return true;
    try {
        const parts = range.split('-').map(p => p.trim());
        if (parts.length !== 2) return true;

        const [tH, tM] = time.split(':').map(Number);
        const [startH, startM] = parts[0].split(':').map(Number);
        const [endH, endM] = parts[1].split(':').map(Number);

        const tMinutes = tH * 60 + tM;
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (isNaN(tMinutes) || isNaN(startMinutes) || isNaN(endMinutes)) return true;

        return tMinutes >= startMinutes && tMinutes < endMinutes;
    } catch (e) {
        return true;
    }
};

/**
 * Utility to check if shop is open based on config flag and current time/opening_hours
 */
export const isShopOpen = (config: ShopConfig | null): boolean => {
    if (!config) return true;
    if (isManuallyClosed(config)) return false; // Manual override (Emergency Close)

    const now = new Date();
    const currentDay = now.getDay(); // 0 (Domingo) a 6 (Sábado)

    // Check if current day is a work day (if work_days is defined)
    if (config.work_days && config.work_days.length > 0) {
        if (!config.work_days.includes(currentDay)) return false;
    } else if (config.work_days && config.work_days.length === 0) {
        // If explicitly empty, shop is closed
        return false;
    }

    if (!config.opening_hours) return true;

    return isTimeWithinRange(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, config.opening_hours);
};

// Chaves de LocalStorage para Mirroring
const KEYS = {
    SERVICES: 'luxury_barber_services',
    PROFESSIONALS: 'luxury_barber_professionals',
    APPOINTMENTS: 'luxury_barber_appointments',
    USER: 'luxury_barber_user',
    CONFIG: 'luxury_barber_config',
};

class DataRepository {
    private static instance: DataRepository;
    private listeners: (() => void)[] = [];

    private constructor() {
        this.setupListeners();
        this.setupRealtime();
    }

    private setupRealtime() {
        console.log('📡 Iniciando canal Realtime unificado...');

        const channel = supabase
            .channel('db_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
                console.log('🔄 Sincronização: Serviços atualizados', payload.eventType);
                this.notifyListeners();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'professionals' }, (payload) => {
                console.log('🔄 Sincronização: Profissionais atualizados', payload.eventType);
                this.notifyListeners();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, (payload) => {
                console.log('🔄 Sincronização: Configuração do Shop atualizada', payload.eventType);
                this.notifyListeners();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
                console.log('🔄 Sincronização: Dados de clientes atualizados', payload.eventType);
                this.notifyListeners();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
                console.log('🔄 Sincronização: Agenda atualizada', payload.eventType);
                this.notifyListeners();
            })
            .subscribe((status) => {
                console.log('📡 Status do Canal Realtime:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Cliente conectado ao fluxo de dados ao vivo.');
                }
            });
    }

    public static getInstance(): DataRepository {
        if (!DataRepository.instance) {
            DataRepository.instance = new DataRepository();
        }
        return DataRepository.instance;
    }

    private setupListeners() {
        window.addEventListener('storage', (e) => {
            if (Object.values(KEYS).includes(e.key || '')) {
                this.notifyListeners();
            }
        });
    }

    public subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Subscribe to ANY change in services, professionals or config
     * This allows App.tsx to handle data refresh reactively and centrally
     */
    public subscribeToAll(callback: () => void) {
        const channel = supabase
            .channel('global_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, callback)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'professionals' }, callback)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_config' }, callback)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    private notifyListeners() {
        console.log('Notificando ouvintes de mudança nos dados...');
        this.listeners.forEach(l => l());
    }

    /**
     * Subscribe to real-time changes on specific table
     */
    public subscribeToChanges(table: string, callback: (payload: any) => void) {
        const channel = supabase
            .channel(`realtime_${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                (payload) => callback(payload)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    // Legacy subscribe for backward compatibility if needed, but enhanced
    public subscribeToLegacyChanges(callback: (payload?: any) => void) {
        const channel = supabase
            .channel('realtime_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments' },
                (payload) => callback(payload)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'config' },
                (payload) => callback(payload)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    // --- Services ---
    async getServices(): Promise<Service[]> {
        try {
            console.log('Buscando serviços atualizados do Supabase...');
            // Tenta buscar do Supabase com cache desabilitado ou timestamp para evitar cache do navegador
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('name');

            if (error) throw error;

            if (data) {
                localStorage.setItem(KEYS.SERVICES, JSON.stringify(data));
                return data.map((s: any) => ({
                    ...s,
                    imageUrl: s.image_url || s.imageUrl || s.image || s.avatar || '',
                    price: Number(s.price || 0),
                    duration: Number(s.duration || 0),
                    category: s.category || 'Geral',
                    tag: String(s.tag || s.tag_name || '').trim()
                })) as Service[];
            }
            return [];
        } catch (e) {
            console.error('Erro ao buscar serviços do Supabase, tentando cache:', e);
            const cached = localStorage.getItem(KEYS.SERVICES);
            if (cached) {
                try {
                    return JSON.parse(cached).map((s: any) => ({
                        ...s,
                        imageUrl: s.image_url || s.imageUrl || s.image || s.avatar || '',
                        price: Number(s.price || 0),
                        duration: Number(s.duration || 0),
                        category: s.category || 'Geral',
                        tag: s.tag || s.tag_name || ''
                    }));
                } catch {
                    return [];
                }
            }
            return [];
        }
    }

    // --- Professionals ---
    async getProfessionals(): Promise<Professional[]> {
        try {
            console.log('Buscando profissionais atualizados do Supabase...');
            const { data, error } = await supabase.from('professionals').select('*').order('name');
            if (error) throw error;

            if (data) {
                localStorage.setItem(KEYS.PROFESSIONALS, JSON.stringify(data));
                return data.map((p: any) => ({
                    ...p,
                    avatarUrl: p.avatar || p.avatar_url || p.avatarUrl || ''
                })) as Professional[];
            }
            return [];
        } catch (e) {
            console.error('Erro ao buscar profissionais do Supabase, tentando cache:', e);
            const cached = localStorage.getItem(KEYS.PROFESSIONALS);
            if (cached) {
                try {
                    return JSON.parse(cached).map((p: any) => ({
                        ...p,
                        avatarUrl: p.avatar || p.avatar_url || p.avatarUrl || ''
                    }));
                } catch {
                    return [];
                }
            }
            return [];
        }
    }

    // --- Appointments ---
    async getAppointments(userId: string): Promise<Appointment[]> {
        try {
            console.log('Buscando agendamentos atualizados do Supabase...');
            const { data, error } = await supabase
                .from('appointments')
                .select('*, service:services(*), professional:professionals(*)')
                .eq('client_id', userId)
                .order('date', { ascending: true })
                .order('time', { ascending: true });

            if (error) throw error;

            if (data) {
                localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(data));
                return data as any[];
            }
            return [];
        } catch (e) {
            console.error('Erro ao buscar agendamentos do Supabase, tentando cache:', e);
            const cached = localStorage.getItem(KEYS.APPOINTMENTS);
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch {
                    return [];
                }
            }
            return [];
        }
    }

    async getAppointmentsForDate(date: string): Promise<Appointment[]> {
        const { data, error } = await supabase
            .from('appointments')
            .select('time, professional_id, client_id') // Fetch only necessary fields
            .eq('date', date)
            .neq('status', 'canceled'); // Don't count cancelled spelling

        if (error) {
            console.error('Error fetching appointments for date:', error);
            return [];
        }
        return (data || []) as unknown as Appointment[];
    }

    async createAppointment(appointment: Omit<Appointment, 'id'>, userId: string): Promise<Appointment | null> {
        // --- PRE-CHECK: Prevent Out-of-Hours Booking ---
        const config = await this.getConfig();
        if (config?.opening_hours) {
            if (!isTimeWithinRange(appointment.time, config.opening_hours)) {
                alert('Desculpe, este horário está fora do expediente da barbearia.');
                return null;
            }
        }
        if (isManuallyClosed(config)) {
            alert('Agendamentos estão temporariamente desativados pelo administrador.');
            return null;
        }

        // --- PRE-CHECK: Prevent Double Booking ---
        const existingOnDate = await this.getAppointmentsForDate(appointment.date);
        const isTakenBySomeoneElse = existingOnDate.some(a =>
            a.time === appointment.time && a.professional_id === appointment.professional.id
        );
        const isUserAlreadyBusy = existingOnDate.some(a =>
            a.time === appointment.time && a.client_id === userId
        );

        if (isTakenBySomeoneElse) {
            alert('Desculpe, este horário acabou de ser preenchido por outra pessoa. Por favor, escolha outro.');
            return null;
        }

        if (isUserAlreadyBusy) {
            alert('Você já possui um agendamento para este mesmo horário. Verifique sua agenda.');
            return null;
        }

        // Fallback para usuários locais ou se Supabase falhar
        const isLocalUser = userId.startsWith('local_');

        if (!isLocalUser) {
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .insert([{
                        service_id: appointment.service.id,
                        professional_id: appointment.professional.id,
                        date: appointment.date,
                        time: appointment.time,
                        status: 'pending',
                        price: appointment.totalPrice, // Consistent with Admin DB schema
                        client_id: userId,
                        service: appointment.service.name,
                        professional: appointment.professional.name
                    }])
                    .select('*, service:services(*), professional:professionals(*)')
                    .single();

                if (data) {
                    // Sucesso no Supabase
                    const current = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
                    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify([data, ...current]));
                    this.notifyListeners();
                    return data as any;
                }

                console.error('Erro ao criar agendamento no Supabase (será salvo localmente):', error);
            } catch (err) {
                console.error('Erro de conexão ao criar agendamento (será salvo localmente):', err);
            }
        }

        // --- SALVAMENTO LOCAL (OFFLINE / FALLBACK / LOCAL USER) ---
        if (!isLocalUser) {
            alert('Atenção: Não foi possível conectar ao servidor. Seu agendamento será salvo no celular e sincronizado depois. Mostre esta tela ao chegar na barbearia.');
        }
        console.warn('Salvando agendamento localmente...');
        const localId = 'local_appt_' + Date.now();

        // Simula a estrutura do banco
        const localAppointment = {
            id: localId,
            ...appointment,
            status: 'pending',
            client_id: userId,
            // Mantém os objetos completos para exibição correta no app
            service: appointment.service,
            professional: appointment.professional
        };

        const current = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
        // Adiciona no topo
        const updated = [localAppointment, ...current];
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(updated));

        this.notifyListeners();
        return localAppointment as any;
    }

    async cancelAppointment(appointmentId: string): Promise<boolean> {
        try {
            console.log('Tentando cancelar agendamento:', appointmentId);
            const isLocal = appointmentId.startsWith('local_');

            if (!isLocal) {
                const { error } = await supabase
                    .from('appointments')
                    .update({ status: 'canceled' })
                    .eq('id', appointmentId);

                if (error) {
                    console.error('Erro ao cancelar no Supabase:', error);
                    alert('Erro ao cancelar online. Tentando atualizar localmente...');
                } else {
                    console.log('Agendamento cancelado no Supabase');
                }
            }

            // Atualiza Local Storage (sempre, para refletir na hora)
            const current = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
            const updated = current.map((appt: any) =>
                appt.id === appointmentId ? { ...appt, status: 'canceled' } : appt
            );
            localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(updated));
            this.notifyListeners();
            return true;
        } catch (err) {
            console.error('Erro ao cancelar agendamento:', err);
            return false;
        }
    }

    // --- Loyalty / Clients ---
    async getUserData(whatsapp: string): Promise<User | null> {
        try {
            console.log('Buscando usuário pelo Telefone:', whatsapp);
            const { data, error } = await supabase
                .from('clients')
                .select('*') // select * é mais seguro se não sabemos todas as colunas
                .eq('phone', whatsapp);

            if (error) {
                console.error('Erro Supabase em getUserData:', error);
                alert(`Erro ao buscar dados: ${error.message}`);
                return null;
            }

            if (data && data.length > 0) {
                const user = data[0];
                // Mapeia phone para whatsapp e garante que campos vitais existam para o app não quebrar
                return {
                    ...user,
                    whatsapp: user.phone || whatsapp,
                    points: user.points || 0,
                    name: user.name || 'Cliente'
                } as User;
            }

            console.log('Nenhum usuário encontrado com esse Telefone.');
            return null;
        } catch (err) {
            console.error('Erro inesperado em getUserData:', err);
            return null;
        }
    }

    async createClient(client: { name: string; whatsapp: string; birthday: string }): Promise<User | null> {
        try {
            console.log('Tentativa de cadastro (Supabase):', client);

            const { data, error } = await supabase
                .from('clients')
                .insert([{
                    name: client.name,
                    phone: client.whatsapp,
                    birthday: client.birthday,
                    points: 0,
                    cuts: 0
                }])
                .select('*');

            if (error) {
                console.error('Erro Supabase em createClient:', error);

                // MODO DE EMERGÊNCIA: Se for erro de RLS (permissão), criamos o usuário localmente para não travar o app
                if (error.message.includes('row-level security') || error.code === '42501') {
                    console.warn('Banco protegido por RLS. Criando perfil de emergência local...');
                    const localUser: User = {
                        id: 'local_' + Date.now(),
                        name: client.name,
                        whatsapp: client.whatsapp,
                        points: 0
                    };
                    return localUser;
                }

                alert(`Erro ao criar conta: ${error.message}`);
                return null;
            }

            if (data && data.length > 0) {
                const user = data[0];
                return {
                    ...user,
                    whatsapp: user.phone || client.whatsapp,
                    points: user.points || 0,
                    name: user.name || client.name
                } as User;
            }

            return null;
        } catch (err) {
            console.error('Erro inesperado em createClient:', err);
            // Fallback total
            return {
                id: 'local_' + Date.now(),
                name: client.name,
                whatsapp: client.whatsapp,
                points: 0
            } as User;
        }
    }

    async updatePoints(userId: string, points: number) {
        const { error } = await supabase
            .from('clients')
            .update({ points })
            .eq('id', userId);

        if (error) console.error('Erro ao atualizar pontos:', error);
    }

    // --- Ranking ---
    async getRanking(): Promise<RankingItem[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('id, name, cuts, avatar')
            .order('cuts', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Erro ao buscar ranking:', error);
            return [];
        }

        return data.map(client => ({
            id: client.id,
            name: client.name,
            cuts: client.cuts || 0,
            avatar: client.avatar || ''
        }));
    }

    // --- Configuration ---
    async getConfig(): Promise<ShopConfig | null> {
        try {
            console.log('Buscando configuração do Shop do Supabase...');
            const { data, error } = await supabase
                .from('config')
                .select('*')
                .single();

            if (error) throw error;

            if (data) {
                localStorage.setItem(KEYS.CONFIG, JSON.stringify(data));
                return data as ShopConfig;
            }
            return null;
        } catch (e) {
            console.error('Erro ao buscar configuração do Supabase, tentando cache:', e);
            const cached = localStorage.getItem(KEYS.CONFIG);
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch {
                    return null;
                }
            }
            return null;
        }
    }
}

export const dataRepository = DataRepository.getInstance();
