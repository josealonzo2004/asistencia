import type { Role } from './types';

export const COLORS = {
  ink: '#10223F',
  navy: '#17345F',
  blue: '#246BCE',
  cyan: '#22B6C8',
  amber: '#F5A524',
  red: '#D64545',
  green: '#138A63',
  paper: '#F5F8FC',
  line: '#DDE5F0',
  muted: '#64748B',
  white: '#FFFFFF',
};

export const roleLabels: Record<Role, string> = {
  teacher: 'Docente',
  student: 'Estudiante',
  admin: 'Admin',
};
