import type { Attendance, AttendanceValidationPayload, AttendanceValidationResult, AuthSession, BootstrapPayload, Course, CreateUserPayload, EnrollmentPayload, QrSessionPayload, Student, UpdateUserPayload, User } from '../types';

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

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
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
      ...(student.password ? { password: student.password } : {}),
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

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return await readJson(response) as User;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return await readJson(response) as User;
}

export async function toggleUserActive(id: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}/active`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return await readJson(response) as User;
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

export async function getCourseEnrollments(courseId: string): Promise<EnrollmentPayload> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enrollments`, {
    headers: authHeaders(),
  });

  return await readJson(response) as EnrollmentPayload;
}

export async function syncCourseEnrollments(courseId: string, studentIds: string[]): Promise<{ course: Course; studentIds: string[]; message: string }> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enrollments`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ student_ids: studentIds.map((id) => Number(id)) }),
  });

  return await readJson(response) as { course: Course; studentIds: string[]; message: string };
}

export function encodeQrSession(session: QrSessionPayload) {
  return JSON.stringify(session);
}

export async function createAttendanceSession(courseId: string, latitude: number, longitude: number): Promise<QrSessionPayload> {
  const response = await fetch(`${API_BASE_URL}/attendance/sessions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      course_id: Number(courseId),
      duration_minutes: 10,
      latitude,
      longitude,
    }),
  });

  return await readJson(response) as QrSessionPayload;
}

export async function closeAttendanceSession(sessionId: string): Promise<{ message: string; attendance: Attendance[] }> {
  const response = await fetch(`${API_BASE_URL}/attendance/sessions/${sessionId}/close`, {
    method: 'POST',
    headers: authHeaders(),
  });

  return await readJson(response) as { message: string; attendance: Attendance[] };
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
