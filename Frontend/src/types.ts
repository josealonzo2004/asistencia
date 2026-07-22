export type Role = 'teacher' | 'student' | 'admin';
export type AttendanceStatus = 'Presente' | 'Tardanza' | 'Ausente';

export type TeacherTab = 'home' | 'students' | 'attendance' | 'reports';
export type StudentTab = 'studentHome' | 'studentCalendar' | 'studentHistory' | 'studentProfile';
export type AdminTab = 'adminHome' | 'adminUsers' | 'adminCourses' | 'adminReports';
export type Screen = TeacherTab | StudentTab | AdminTab | 'courses';

export type Student = {
  id: string;
  name: string;
  code: string;
  career: string;
  semester: string;
  email: string;
};

export type Course = {
  id: string;
  name: string;
  code: string;
  room: string;
  schedule: string;
  teacher: string;
  enrolled: number;
};

export type Attendance = Student & { status: AttendanceStatus };

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentCode: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type SessionRecord = {
  id: string;
  date: string;
  course: string;
  status: AttendanceStatus;
  note: string;
};

export type QrSessionPayload = {
  sessionId: string;
  courseId: string;
  courseName: string;
  startsAt: string;
  expiresAt: string;
  room: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  token: string;
};

export type AttendanceValidationPayload = {
  qr: QrSessionPayload;
  studentCode: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type AttendanceValidationResult = {
  status: 'accepted' | 'rejected';
  attendanceStatus?: AttendanceStatus;
  message: string;
  distanceMeters?: number;
};

export type BootstrapPayload = {
  user: AuthUser;
  students: Student[];
  courses: Course[];
  users: User[];
  attendance: Attendance[];
  studentHistory: SessionRecord[];
};
