import { demoCredentials } from '../theme';
import type { Course, SessionRecord, Student, User } from '../types';

export const initialStudents: Student[] = [
  { id: '1', name: 'Ana Torres', code: '202310245', career: 'Ingenieria de Software', semester: '7mo', email: 'ana.torres@uni.edu.ec' },
  { id: '2', name: 'Mateo Ruiz', code: '202310198', career: 'Ingenieria de Software', semester: '7mo', email: 'mateo.ruiz@uni.edu.ec' },
  { id: '3', name: 'Valeria Mena', code: '202310312', career: 'Ingenieria de Software', semester: '7mo', email: 'valeria.mena@uni.edu.ec' },
  { id: '4', name: 'Diego Cedeno', code: '202310167', career: 'Ingenieria de Software', semester: '7mo', email: 'diego.cedeno@uni.edu.ec' },
];

export const initialCourses: Course[] = [
  { id: '1', name: 'Aplicaciones Moviles', code: 'ISW-702', room: 'Lab. 3', schedule: 'Lun 10:00 - 12:00', teacher: 'Prof. Maria', enrolled: 28 },
  { id: '2', name: 'Ingenieria de Software II', code: 'ISW-703', room: 'A-204', schedule: 'Mar 08:00 - 10:00', teacher: 'Prof. David', enrolled: 32 },
  { id: '3', name: 'Base de Datos II', code: 'ISW-704', room: 'Lab. 2', schedule: 'Jue 10:00 - 12:00', teacher: 'Prof. Maria', enrolled: 30 },
];

export const initialUsers: User[] = [
  { id: 'u1', name: 'Maria Andrade', email: demoCredentials.teacher, role: 'teacher', active: true },
  { id: 'u2', name: 'Ana Torres', email: demoCredentials.student, role: 'student', active: true },
  { id: 'u3', name: 'Coordinacion Academica', email: demoCredentials.admin, role: 'admin', active: true },
  { id: 'u4', name: 'David Zambrano', email: 'david.zambrano@uni.edu.ec', role: 'teacher', active: false },
];

export const studentHistory: SessionRecord[] = [
  { id: 'h1', date: 'Lun 21 Jul', course: 'Aplicaciones Moviles', status: 'Presente', note: 'Marcada por docente' },
  { id: 'h2', date: 'Jue 17 Jul', course: 'Base de Datos II', status: 'Ausente', note: 'Sin justificacion' },
  { id: 'h3', date: 'Mar 15 Jul', course: 'Ingenieria de Software II', status: 'Tardanza', note: 'Ingreso 12 min tarde' },
  { id: 'h4', date: 'Lun 14 Jul', course: 'Aplicaciones Moviles', status: 'Presente', note: 'Validada en aula' },
];
