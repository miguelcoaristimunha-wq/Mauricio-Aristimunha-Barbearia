
export class NotificationService {
    private static instance: NotificationService;
    private readonly STORAGE_KEY = 'luxury_barber_notifications';

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('Este navegador não suporta notificações Desktop');
            return 'denied';
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            this.setEnabled(true);
        }
        return permission;
    }

    setEnabled(enabled: boolean) {
        localStorage.setItem(this.STORAGE_KEY, enabled ? 'true' : 'false');
    }

    isEnabled(): boolean {
        return localStorage.getItem(this.STORAGE_KEY) === 'true';
    }

    async sendNotification(title: string, body: string) {
        if (this.isEnabled() && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/logo.jpg' // Reutilizando logomarca se disponível
            });
        }
    }

    scheduleReminder(appointmentDate: string, appointmentTime: string, serviceName: string) {
        if (!this.isEnabled()) return;

        // Converte data (YYYY-MM-DD) e hora (HH:mm) para objeto Date
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const [hour, minute] = appointmentTime.split(':').map(Number);

        const appointmentDateTime = new Date(year, month - 1, day, hour, minute);
        const reminderTime = new Date(appointmentDateTime.getTime() - 30 * 60000); // 30 min antes

        const now = new Date();
        const delay = reminderTime.getTime() - now.getTime();

        if (delay > 0) {
            console.log(`Lembrete agendado para ${serviceName} em ${delay / 1000} segundos`);
            setTimeout(() => {
                this.sendNotification(
                    'Lembrete de Agendamento ✂️',
                    `Seu horário para "${serviceName}" começa em 30 minutos. Estamos te esperando!`
                );
            }, delay);
        }
    }
}

export const notificationService = NotificationService.getInstance();
