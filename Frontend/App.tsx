import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, LogOut } from 'lucide-react-native';

import { COLORS } from './src/theme';
import { initialCourses, initialStudents, initialUsers, studentHistory } from './src/data/mockData';
import { getBootstrapData, logout } from './src/services/attendanceApi';
import { styles } from './src/styles';
import type { AdminTab, Attendance, AuthUser, Role, Screen, SessionRecord, StudentTab, TeacherTab } from './src/types';
import { AdminTabBar, StudentTabBar, TeacherTabBar } from './src/components/navigation';
import { AuthScreen } from './src/screens/AuthScreen';
import { AdminCourses, AdminHome, AdminReports, AdminUsers } from './src/screens/admin/AdminScreens';
import { CoursesScreen } from './src/screens/CoursesScreen';
import { StudentCalendar, StudentHistory, StudentHome, StudentProfile } from './src/screens/student/StudentScreens';
import { AttendanceScreen, ReportsScreen, StudentsScreen, TeacherHome } from './src/screens/teacher/TeacherScreens';

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
  const [students, setStudents] = useState(initialStudents);
  const [courses, setCourses] = useState(initialCourses);
  const [users, setUsers] = useState(initialUsers);
  const [history, setHistory] = useState<SessionRecord[]>(studentHistory);
  const [attendance, setAttendance] = useState<Attendance[]>(
    initialStudents.map((student, index) => ({
      ...student,
      status: index === 1 ? 'Ausente' : index === 2 ? 'Tardanza' : 'Presente',
    })),
  );

  if (!authenticated) {
    return (
      <AuthScreen
        selectedRole={selectedRole}
        onChangeRole={setSelectedRole}
        onAuthenticated={async (session) => {
          const data = await getBootstrapData();
          setSelectedRole(session.user.role);
          setAuthUser(session.user);
          setStudents(data.students.length ? data.students : initialStudents);
          setCourses(data.courses.length ? data.courses : initialCourses);
          setUsers(data.users.length ? data.users : initialUsers);
          setAttendance(data.attendance.length ? data.attendance : initialStudents.map((student, index) => ({ ...student, status: index === 1 ? 'Ausente' : index === 2 ? 'Tardanza' : 'Presente' })));
          setHistory(data.studentHistory.length ? data.studentHistory : studentHistory);
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
          return <StudentHome student={students.find((student) => student.email === authUser?.email) ?? students[0]} records={history} />;
      }
    }

    if (selectedRole === 'admin') {
      switch (screen) {
        case 'adminUsers':
          return <AdminUsers users={users} setUsers={setUsers} />;
        case 'adminCourses':
          return <AdminCourses courses={courses} setCourses={setCourses} />;
        case 'adminReports':
          return <AdminReports users={users} courses={courses} attendance={attendance} />;
        default:
          return <AdminHome users={users} courses={courses} students={students} />;
      }
    }

    switch (screen) {
      case 'students':
        return <StudentsScreen students={students} setStudents={setStudents} />;
      case 'courses':
        return <CoursesScreen courses={courses} setCourses={setCourses} />;
      case 'attendance':
        return <AttendanceScreen attendance={attendance} setAttendance={setAttendance} />;
      case 'reports':
        return <ReportsScreen attendance={attendance} students={students} />;
      default:
        return <TeacherHome students={students} attendance={attendance} onNavigate={setScreen} />;
    }
  };

  return (
    <SafeAreaView style={[styles.appSafe, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.flex}>{content()}</View>
      {selectedRole === 'teacher' && screen !== 'courses' ? (
        <TeacherTabBar active={screen as TeacherTab} bottomInset={insets.bottom} onChange={(tab) => setScreen(tab)} />
      ) : null}
      {selectedRole === 'student' ? (
        <StudentTabBar active={screen as StudentTab} bottomInset={insets.bottom} onChange={(tab) => setScreen(tab)} />
      ) : null}
      {selectedRole === 'admin' ? (
        <AdminTabBar active={screen as AdminTab} bottomInset={insets.bottom} onChange={(tab) => setScreen(tab)} />
      ) : null}
      {selectedRole === 'teacher' && screen === 'courses' ? (
        <Pressable style={[styles.floatingBack, { bottom: insets.bottom + 20 }]} onPress={() => setScreen('home')}>
          <Home size={21} color={COLORS.white} />
          <Text style={styles.floatingBackText}>Inicio</Text>
        </Pressable>
      ) : null}
      <Pressable
        style={[styles.logout, { top: insets.top + 10 }]}
        onPress={async () => {
          await logout();
          setAuthenticated(false);
          setAuthUser(null);
        }}
        hitSlop={8}
      >
        <LogOut size={20} color={COLORS.muted} />
      </Pressable>
    </SafeAreaView>
  );
}
