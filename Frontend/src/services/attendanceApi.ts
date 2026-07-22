import type { AttendanceValidationPayload, AttendanceValidationResult, AuthSession, BootstrapPayload, Course, QrSessionPayload, Role, Student } from '../types';

const API_BASE_URL = 'http://192.168.100.11:8000/api';
let authToken = '';

export function setAuthToken(token: string) {
  authToken = token;
}

function authHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    const message = data.message ?? Object.values(data.errors ?? {})?.flat()?.[0] ?? 'No se pudo completar la solicitud.';
    throw new Error(String(message));
  }
  return data;
}

export async function login(email: string, password: string, role: Role): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password, role }),
  });
  const session = await readJson(response) as AuthSession;
  setAuthToken(session.token);
  return session;
}

export async function logout() {
  if (!authToken) return;
  await fetch(`${API_BASE_URL}/logout`, {
    method: 'POST',
    headers: authHeaders(),
  });
  setAuthToken('');
}

export async function getBootstrapData(): Promise<BootstrapPayload> {
  const response = await fetch(`${API_BASE_URL}/mobile/bootstrap`, {
    headers: authHeaders(),
  });
  return await readJson(response) as BootstrapPayload;
}

export async function saveStudent(student: Omit<Student, 'id'>, id?: string): Promise<Student> {
  const response = await fetch(`${API_BASE_URL}/students${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      name: student.name,
      code: student.code,
      email: student.email,
    }),
  });

  return await readJson(response) as Student;
}

export async function deleteStudent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await readJson(response);
}

export async function saveCourse(course: Omit<Course, 'id'>, id?: string): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/courses${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(course),
  });

  return await readJson(response) as Course;
}

export async function deleteCourse(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await readJson(response);
}

export function buildDemoQrSession(): QrSessionPayload {
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000);

  return {
    sessionId: `session-${now.getTime()}`,
    courseId: '1',
    courseName: 'Aplicaciones Moviles',
    startsAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    room: 'Lab. 3',
    latitude: -2.170998,
    longitude: -79.922359,
    radiusMeters: 120,
    token: `ASISTE-U-${now.getTime()}`,
  };
}

export function encodeQrSession(session: QrSessionPayload) {
  return JSON.stringify(session);
}

export async function createAttendanceSession(): Promise<QrSessionPayload> {
  const response = await fetch(`${API_BASE_URL}/attendance/sessions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      course_id: 1,
      duration_minutes: 10,
    }),
  });

  return await readJson(response) as QrSessionPayload;
}

export function parseQrSession(data: string): QrSessionPayload | null {
  try {
    const parsed = JSON.parse(data) as Partial<QrSessionPayload>;
    if (!parsed.sessionId || !parsed.courseId || !parsed.token || !parsed.expiresAt) return null;
    return parsed as QrSessionPayload;
  } catch {
    return null;
  }
}

export async function validateAttendance(payload: AttendanceValidationPayload): Promise<AttendanceValidationResult> {
  const response = await fetch(`${API_BASE_URL}/attendance/validate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    return {
      status: 'rejected',
      message: data.message ?? 'No se pudo validar la asistencia.',
      distanceMeters: data.distanceMeters,
    };
  }

  return data as AttendanceValidationResult;
}
