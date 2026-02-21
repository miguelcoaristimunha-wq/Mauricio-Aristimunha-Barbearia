
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  category: string;
  imageUrl?: string;
  tag?: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  rating: number;
  avatarUrl: string;
  bio: string;
}

export interface Appointment {
  id: string;
  service: Service;
  professional: Professional;
  service_id?: string;
  professional_id?: string;
  client_id?: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'canceled' | 'cancelled' | 'completed';
  totalPrice: number;
}

export interface User {
  id: string;
  name: string;
  whatsapp: string;
  birthday?: string; // Format YYYY-MM-DD
  points: number;
}

export interface ShopConfig {
  app_name: string;
  admin_photo: string;
  primary_hsl: string;
  loyalty_target: number;
  opening_hours: string;
  is_open: boolean;
  time_slots: string[];
}

export interface RankingItem {
  id: string;
  name: string;
  cuts: number;
  avatar: string;
}

export enum AppScreen {
  SPLASH = 'SPLASH',
  AUTH = 'AUTH',
  HOME = 'HOME',
  BOOKING = 'BOOKING',
  MY_APPOINTMENTS = 'MY_APPOINTMENTS',
  RANKING = 'RANKING',
  PROFILE = 'PROFILE',
  ALL_SERVICES = 'ALL_SERVICES',
  NOTIFICATIONS_SETTINGS = 'NOTIFICATIONS_SETTINGS'
}

export enum BookingStep {
  SERVICE = 'SERVICE',
  PROFESSIONAL = 'PROFESSIONAL',
  TIME = 'TIME',
  CONFIRMATION = 'CONFIRMATION'
}
