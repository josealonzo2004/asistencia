import type { Dispatch, SetStateAction } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BarChart3, BookOpen, GraduationCap, LayoutDashboard, Plus, Search, ShieldCheck, Users } from 'lucide-react-native';

import { Header, QuickRow, ReportMetric, StatCard } from '../../components/common';
import { CoursesScreen } from '../CoursesScreen';
import { COLORS, roleLabels } from '../../theme';
import { styles } from '../../styles';
import type { Attendance, Course, Student, User } from '../../types';
import { initials } from '../../utils/text';

export function AdminHome({ users, courses, students }: { users: User[]; courses: Course[]; students: Student[] }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad}>
      <Header eyebrow="ADMINISTRACION" title="Panel general" />
      <View style={styles.adminHero}>
        <LayoutDashboard size={26} color={COLORS.white} />
        <View style={styles.flex}>
          <Text style={styles.todayCourse}>Control institucional</Text>
          <Text style={styles.todayInfo}>Usuarios, materias, docentes y reportes globales</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Indicadores</Text>
      <View style={styles.statsRow}>
        <StatCard icon={<Users size={19} color={COLORS.blue} />} value={String(users.length)} label="Usuarios" tint="#E8F1FF" />
        <StatCard icon={<GraduationCap size={19} color={COLORS.green} />} value={String(students.length)} label="Estudiantes" tint="#E6F7F0" />
        <StatCard icon={<BookOpen size={19} color={COLORS.amber} />} value={String(courses.length)} label="Materias" tint="#FFF4D9" />
      </View>
      <Text style={styles.sectionTitle}>Tareas administrativas</Text>
      <View style={styles.quickList}>
        <QuickRow icon={<ShieldCheck size={21} color={COLORS.blue} />} title="Usuarios y roles" subtitle="Activar cuentas y asignar permisos" onPress={() => Alert.alert('Usuarios', 'Usa la pestana Usuarios para administrar cuentas.')} />
        <QuickRow icon={<BookOpen size={21} color={COLORS.green} />} title="Materias" subtitle="Gestionar materias, horarios y docentes" onPress={() => Alert.alert('Materias', 'Usa la pestana Materias para editar cursos.')} />
        <QuickRow icon={<BarChart3 size={21} color={COLORS.amber} />} title="Reportes globales" subtitle="Ver asistencia por curso y periodo" onPress={() => Alert.alert('Reportes', 'Usa la pestana Reportes para revisar indicadores.')} />
      </View>
    </ScrollView>
  );
}

export function AdminUsers({ users, setUsers }: { users: User[]; setUsers: Dispatch<SetStateAction<User[]>> }) {
  const filtered = users;
  const toggle = (id: string) => setUsers((items) => items.map((item) => item.id === id ? { ...item, active: !item.active } : item));
  return (
    <View style={styles.screen}>
      <Header eyebrow="SEGURIDAD" title="Usuarios y roles" action={<Pressable style={styles.iconButton} onPress={() => Alert.alert('Nuevo usuario', 'En backend se registrara con API Laravel y rol asignado.')}><Plus size={22} color={COLORS.white} /></Pressable>} />
      <View style={styles.searchBox}><Search size={19} color={COLORS.muted} /><TextInput placeholder="Buscar usuario o rol" placeholderTextColor="#94A3B8" style={styles.searchInput} /></View>
      <FlatList data={filtered} keyExtractor={(item) => item.id} contentContainerStyle={styles.listPad} renderItem={({ item }) => (
        <View style={styles.personRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View>
          <View style={styles.flex}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personMeta}>{item.email}</Text>
            <Text style={styles.personCareer}>{roleLabels[item.role]}</Text>
          </View>
          <Pressable onPress={() => toggle(item.id)} style={[styles.statusPill, item.active ? styles.presentPill : styles.absentPill]}>
            <Text style={[styles.statusText, item.active ? styles.presentText : styles.absentText]}>{item.active ? 'Activo' : 'Inactivo'}</Text>
          </Pressable>
        </View>
      )} />
    </View>
  );
}

export function AdminCourses({ courses, setCourses }: { courses: Course[]; setCourses: Dispatch<SetStateAction<Course[]>> }) {
  return <CoursesScreen courses={courses} setCourses={setCourses} adminMode />;
}

export function AdminReports({ users, courses, attendance }: { users: User[]; courses: Course[]; attendance: Attendance[] }) {
  const presentRate = attendance.length ? Math.round((attendance.filter((item) => item.status === 'Presente').length / attendance.length) * 100) : 0;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad}>
      <Header eyebrow="REPORTES" title="Indicadores globales" />
      <View style={styles.reportHero}>
        <Text style={styles.reportCaption}>ASISTENCIA PROMEDIO</Text>
        <Text style={styles.reportValue}>{presentRate}%</Text>
        <Text style={styles.reportSubtext}>Muestra demo para el periodo Julio 2026</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${presentRate}%` }]} /></View>
      </View>
      <Text style={styles.sectionTitle}>Resumen institucional</Text>
      <View style={styles.reportGrid}>
        <ReportMetric label="Usuarios activos" value={String(users.filter((user) => user.active).length)} color={COLORS.blue} />
        <ReportMetric label="Materias abiertas" value={String(courses.length)} color={COLORS.green} />
        <ReportMetric label="Alertas de falta" value="1" color={COLORS.red} />
        <ReportMetric label="Docentes" value={String(users.filter((user) => user.role === 'teacher').length)} color={COLORS.amber} />
      </View>
    </ScrollView>
  );
}
