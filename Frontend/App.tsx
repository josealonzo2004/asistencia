import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from './src/theme';
import { getBootstrapData, logout } from './src/services/attendanceApi';
import { styles } from './src/styles';
import type { AdminTab, Attendance, AuthUser, Role, Screen, SessionRecord, StudentTab, TeacherTab } from './src/types';
import { AdminTabBar, StudentTabBar, TeacherTabBar } from './src/components/navigation';
import { AuthScreen } from './src/screens/AuthScreen';
import { AdminCourses, AdminEnrollments, AdminHome, AdminReports, AdminUsers } from './src/screens/admin/AdminScreens';
import { StudentCalendar, StudentHistory, StudentHome, StudentProfile } from './src/screens/student/StudentScreens';
import { AttendanceScreen, ReportsScreen, TeacherHome } from './src/screens/teacher/TeacherScreens';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [authenticated, setAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('teacher');
  const [screen, setScreen] = useState<Screen>('home');
  const [students, setStudents] = useState<Awaited<ReturnType<typeof getBootstrapData>>['students']>([]);
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof getBootstrapData>>['courses']>([]);
  const [users, setUsers] = useState<Awaited<ReturnType<typeof getBootstrapData>>['users']>([]);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const applyBootstrapData = (data: Awaited<ReturnType<typeof getBootstrapData>>) => {
    setStudents(data.students);
    setCourses(data.courses);
    setSelectedCourseId(data.courses[0]?.id ?? '');
    setUsers(data.users);
    setAttendance(data.attendance);
    setHistory(data.studentHistory);
  };

  const refreshBootstrapData = async () => {
    const data = await getBootstrapData();
    applyBootstrapData(data);
  };

  if (!authenticated) {
    return (
      <AuthScreen
        onAuthenticated={async (session) => {
          const data = await getBootstrapData();
          setSelectedRole(session.user.role);
          setAuthUser(session.user);
          applyBootstrapData(data);
          setScreen(session.user.role === 'teacher' ? 'home' : session.user.role === 'student' ? 'studentHome' : 'adminHome');
          setAuthenticated(true);
        }}
      />
    );
  }

  const content = () => {
    if (selectedRole === 'student') {
      switch (screen) {
        case 'studentCalendar':
          return <StudentCalendar courses={courses} />;
        case 'studentHistory':
          return <StudentHistory records={history} />;
        case 'studentProfile':
          return <StudentProfile student={students.find((student) => student.email === authUser?.email) ?? students[0]} />;
        default:
          return <StudentHome student={students.find((student) => student.email === authUser?.email) ?? students[0]} records={history} onAttendanceValidated={refreshBootstrapData} />;
      }
    }

    if (selectedRole === 'admin') {
      switch (screen) {
        case 'adminUsers':
          return <AdminUsers users={users} setUsers={setUsers} setStudents={setStudents} />;
        case 'adminCourses':
          return <AdminCourses courses={courses} setCourses={setCourses} teachers={users.filter((user) => user.role === 'teacher' && user.active)} />;
        case 'adminEnrollments':
          return <AdminEnrollments courses={courses} students={students} setCourses={setCourses} />;
        case 'adminReports':
          return <AdminReports users={users} courses={courses} attendance={attendance} />;
        default:
          return <AdminHome users={users} courses={courses} students={students} />;
      }
    }

    switch (screen) {
      case 'attendance':
        return <AttendanceScreen courses={courses} selectedCourseId={selectedCourseId} onSelectCourse={setSelectedCourseId} attendance={attendance} setAttendance={setAttendance} />;
      case 'reports':
        return <ReportsScreen attendance={attendance} students={students} />;
      default:
        return <TeacherHome teacherName={authUser?.name ?? 'Docente'} courses={courses} students={students} attendance={attendance} onNavigate={setScreen} onSelectCourse={setSelectedCourseId} />;
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setAuthUser(null);
  };

  return (
    <SafeAreaView style={[styles.appSafe, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.flex}>{content()}</View>
      {selectedRole === 'teacher' ? (
        <TeacherTabBar active={screen as TeacherTab} bottomInset={insets.bottom} onChange={(tab) => setScreen(tab)} onLogout={handleLogout} />
      ) : null}
      {selectedRole === 'student' ? (
        <StudentTabBar active={screen as StudentTab} bottomInset={insets.bottom} onChange={(tab) => setScreen(tab)} onLogout={handleLogout} />
      ) : null}
      {selectedRole === 'admin' ? (
        <AdminTabBar active={screen as AdminTab} bottomInset={insets.bottom} onChange={(tab) => setScreen(tab)} onLogout={handleLogout} />
      ) : null}
    </SafeAreaView>
  );
}
