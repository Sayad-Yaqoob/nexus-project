export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export const THEME = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceCard: '#1A1A1A',
  primary: '#00FF88', // Neon Green
  primaryHover: '#00CC6A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2A2A2A',
  error: '#FF4444',
  warning: '#FFAA00',
  success: '#00FF88'
};

export const CATEGORIES = [
  'AI & Data',
  'Software Development',
  'Business & Strategy',
  'Marketing & Growth',
  'Sales',
  'Finance & Investing',
  'Operations & Supply Chain',
  'Coaching & Leadership',
  'Science & Environment',
  'Personal Development'
];
