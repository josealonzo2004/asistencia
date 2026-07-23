import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BarChart3, BookOpen, Check, GraduationCap, LayoutDashboard, ListChecks, Plus, Search, ShieldCheck, Users, X } from 'lucide-react-native';

import { EmptyState, Field, Header, QuickRow, StatCard } from '../../components/common';
import { CoursesScreen } from '../CoursesScreen';
import { createUser, getCourseEnrollments, syncCourseEnrollments, toggleUserActive, updateUser } from '../../services/attendanceApi';
import { COLORS, roleLabels } from '../../theme';
import { styles } from '../../styles';
import type { Attendance, Course, Student, User } from '../../types';
import { initials } from '../../utils/text';
import { isInstitutionalEmail } from '../../utils/validation';

export function AdminHome({ users, courses, students }: { users: User[]; courses: Course[]; students: Student[] }) {
  return <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad}>
    <Header eyebrow="ADMINISTRACION" title="Panel general" />
    <View style={styles.adminHero}><LayoutDashboard size={26} color={COLORS.white} /><View style={styles.flex}><Text style={styles.todayCourse}>Control institucional</Text><Text style={styles.todayInfo}>Usuarios, materias, docentes y reportes globales</Text></View></View>
    <Text style={styles.sectionTitle}>Indicadores</Text><View style={styles.statsRow}><StatCard icon={<Users size={19} color={COLORS.blue} />} value={String(users.length)} label="Usuarios" tint="#E8F1FF" /><StatCard icon={<GraduationCap size={19} color={COLORS.green} />} value={String(students.length)} label="Estudiantes" tint="#E6F7F0" /><StatCard icon={<BookOpen size={19} color={COLORS.amber} />} value={String(courses.length)} label="Materias" tint="#FFF4D9" /></View>
    <Text style={styles.sectionTitle}>Tareas administrativas</Text><View style={styles.quickList}><QuickRow icon={<ShieldCheck size={21} color={COLORS.blue} />} title="Usuarios y roles" subtitle="Editar, activar y desactivar cuentas" onPress={() => Alert.alert('Usuarios', 'Usa la pestana Usuarios para administrar cuentas.')} /><QuickRow icon={<BookOpen size={21} color={COLORS.green} />} title="Materias" subtitle="Gestionar materias, horarios y docentes" onPress={() => Alert.alert('Materias', 'Usa la pestana Materias para editar cursos.')} /><QuickRow icon={<ListChecks size={21} color={COLORS.blue} />} title="Asignar estudiantes" subtitle="Matricular estudiantes en materias" onPress={() => Alert.alert('Asignaciones', 'Usa la pestana Asignar para matricular estudiantes.')} /><QuickRow icon={<BarChart3 size={21} color={COLORS.amber} />} title="Reportes globales" subtitle="Ver asistencia por curso y periodo" onPress={() => Alert.alert('Reportes', 'Usa la pestana Reportes para revisar indicadores.')} /></View>
  </ScrollView>;
}

export function AdminUsers({ users, setUsers, setStudents }: { users: User[]; setUsers: Dispatch<SetStateAction<User[]>>; setStudents: Dispatch<SetStateAction<Student[]>> }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'student' as 'student' | 'teacher', student_code: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reset = () => { setEditing(null); setForm({ name: '', email: '', role: 'student', student_code: '', password: '' }); setErrors({}); };
  const startNew = () => { reset(); setFormOpen(true); };
  const startEdit = (user: User) => { setEditing(user); setForm({ name: user.name, email: user.email, role: user.role === 'student' ? 'student' : 'teacher', student_code: user.student_code ?? '', password: '' }); setErrors({}); setFormOpen(true); };
  const save = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'El nombre es obligatorio.';
    if (!isInstitutionalEmail(form.email)) next.email = 'Usa nombre@uleam.edu.ec.';
    if (form.role === 'student' && !form.student_code.trim()) next.student_code = 'El codigo estudiantil es obligatorio.';
    if (!editing && form.password.length < 6) next.password = 'La contrasena debe tener al menos 6 caracteres.';
    if (editing && form.password.length > 0 && form.password.length < 6) next.password = 'Usa al menos 6 caracteres.';
    if (Object.keys(next).length) { setErrors(next); return; }
    try {
      const saved = editing ? await updateUser(editing.id, form) : await createUser(form);
      setUsers((items) => editing ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved]);
      if (saved.role === 'student') setStudents((items) => editing ? items.map((item) => item.id === saved.id ? { ...item, name: saved.name, email: saved.email, code: form.student_code || item.code } : item) : [...items, { id: saved.id, name: saved.name, code: form.student_code, career: 'Ingenieria de Software', semester: '7mo', email: saved.email }]);
      setFormOpen(false); reset();
      Alert.alert(editing ? 'Usuario actualizado' : 'Usuario creado', editing ? 'Los datos se actualizaron correctamente.' : 'La cuenta ya puede iniciar sesion con la contrasena registrada.');
    } catch (error) { Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intentalo nuevamente.'); }
  };
  const toggle = async (user: User) => { try { const updated = await toggleUserActive(user.id); setUsers((items) => items.map((item) => item.id === updated.id ? updated : item)); } catch (error) { Alert.alert('No se pudo cambiar el estado', error instanceof Error ? error.message : 'Intentalo nuevamente.'); } };
  const filtered = users.filter((user) => `${user.name} ${user.email} ${roleLabels[user.role]}`.toLowerCase().includes(search.toLowerCase()));
  return <View style={styles.screen}>
    <Header eyebrow="SEGURIDAD" title="Usuarios y roles" action={<Pressable style={styles.iconButton} onPress={startNew}><Plus size={22} color={COLORS.white} /></Pressable>} />
    {formOpen ? <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formPanel}><ScrollView contentContainerStyle={styles.formPanelContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"><View style={styles.formHeader}><Text style={styles.formTitle}>{editing ? 'Editar usuario' : 'Nuevo usuario'}</Text><Pressable onPress={() => { setFormOpen(false); reset(); }}><X size={21} color={COLORS.muted} /></Pressable></View><Field label="Nombre completo" value={form.name} onChangeText={(name) => { setForm({ ...form, name }); setErrors({ ...errors, name: '' }); }} placeholder="Ej. Maria Andrade" error={errors.name} /><Field label="Correo institucional" value={form.email} onChangeText={(email) => { setForm({ ...form, email }); setErrors({ ...errors, email: '' }); }} placeholder="nombre@uleam.edu.ec" keyboardType="email-address" error={errors.email} />{!editing ? <><Text style={styles.fieldLabel}>Tipo de usuario</Text><View style={styles.courseSelector}>{(['student', 'teacher'] as const).map((role) => <Pressable key={role} style={[styles.courseChoice, form.role === role && styles.courseChoiceActive]} onPress={() => setForm({ ...form, role })}><Text style={[styles.courseChoiceName, form.role === role && styles.courseChoiceNameActive]}>{role === 'student' ? 'Estudiante' : 'Docente'}</Text></Pressable>)}</View></> : null}{form.role === 'student' ? <Field label="Codigo estudiantil" value={form.student_code} onChangeText={(student_code) => { setForm({ ...form, student_code }); setErrors({ ...errors, student_code: '' }); }} placeholder="Ej. 202310001" keyboardType="numeric" error={errors.student_code} /> : null}<Field label={editing ? 'Nueva contrasena (opcional)' : 'Contrasena'} value={form.password} onChangeText={(password) => { setForm({ ...form, password }); setErrors({ ...errors, password: '' }); }} placeholder="Minimo 6 caracteres" secureTextEntry error={errors.password} /><Pressable style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>{editing ? 'Guardar cambios' : 'Crear usuario'}</Text></Pressable></ScrollView></KeyboardAvoidingView> : null}
    <View style={styles.searchBox}><Search size={19} color={COLORS.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar usuario o rol" placeholderTextColor="#94A3B8" style={styles.searchInput} /></View>
    <FlatList data={filtered} keyExtractor={(item) => item.id} contentContainerStyle={styles.listPad} renderItem={({ item }) => <View style={styles.personRow}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View><View style={styles.flex}><Text style={styles.personName}>{item.name}</Text><Text style={styles.personMeta}>{item.email}</Text><Text style={styles.personCareer}>{roleLabels[item.role]}</Text></View>{item.role !== 'admin' ? <><Pressable onPress={() => toggle(item)} style={[styles.statusPill, item.active ? styles.presentPill : styles.absentPill]}><Text style={[styles.statusText, item.active ? styles.presentText : styles.absentText]}>{item.active ? 'Activo' : 'Inactivo'}</Text></Pressable><Pressable style={styles.rowIconButton} onPress={() => startEdit(item)}><Text style={styles.personMeta}>Editar</Text></Pressable></> : null}</View>} />
  </View>;
}

export function AdminCourses({ courses, setCourses, teachers }: { courses: Course[]; setCourses: Dispatch<SetStateAction<Course[]>>; teachers: User[] }) { return <CoursesScreen courses={courses} setCourses={setCourses} adminMode teachers={teachers.filter((user) => user.role === 'teacher')} />; }

export function AdminEnrollments({ courses, students, setCourses }: { courses: Course[]; students: Student[]; setCourses: Dispatch<SetStateAction<Course[]>> }) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? ''); const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]); const [saving, setSaving] = useState(false); const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  useEffect(() => { if (selectedCourseId) getCourseEnrollments(selectedCourseId).then((payload) => setSelectedStudentIds(payload.studentIds)).catch(() => setSelectedStudentIds([])); }, [selectedCourseId]);
  const save = async () => { if (!selectedCourseId) return Alert.alert('Selecciona una materia', 'Primero elige una materia.'); setSaving(true); try { const result = await syncCourseEnrollments(selectedCourseId, selectedStudentIds); setCourses((items) => items.map((course) => course.id === result.course.id ? result.course : course)); Alert.alert('Asignacion guardada', result.message); } catch (error) { Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intentalo nuevamente.'); } finally { setSaving(false); } };
  return <View style={styles.screen}><Header eyebrow="MATRICULAS" title="Asignar estudiantes" action={<Pressable style={[styles.iconButton, saving && styles.buttonDisabled]} onPress={save} disabled={saving}><Check size={22} color={COLORS.white} /></Pressable>} /><ScrollView contentContainerStyle={styles.scrollPad}><Text style={styles.sectionTitle}>Materia</Text><View style={styles.courseSelector}>{courses.map((course) => <Pressable key={course.id} style={[styles.courseChoice, selectedCourseId === course.id && styles.courseChoiceActive]} onPress={() => setSelectedCourseId(course.id)}><Text style={[styles.courseChoiceCode, selectedCourseId === course.id && styles.courseChoiceCodeActive]}>{course.code}</Text><Text style={[styles.courseChoiceName, selectedCourseId === course.id && styles.courseChoiceNameActive]}>{course.name}</Text><Text style={[styles.courseChoiceMeta, selectedCourseId === course.id && styles.courseChoiceMetaActive]}>{course.enrolled} asignados</Text></Pressable>)}</View><Text style={styles.sectionTitle}>Estudiantes</Text><Text style={styles.tip}>{selectedCourse ? `Selecciona quienes pertenecen a ${selectedCourse.name}.` : 'Crea una materia primero.'}</Text>{students.map((student) => { const checked = selectedStudentIds.includes(student.id); return <Pressable key={student.id} style={styles.personRow} onPress={() => setSelectedStudentIds((ids) => ids.includes(student.id) ? ids.filter((id) => id !== student.id) : [...ids, student.id])}><View style={[styles.checkBox, checked && styles.checkBoxActive]}>{checked ? <Check size={17} color={COLORS.white} /> : null}</View><View style={styles.flex}><Text style={styles.personName}>{student.name}</Text><Text style={styles.personMeta}>{student.code} | {student.email}</Text></View></Pressable>; })}</ScrollView></View>;
}

export function AdminReports({ users, courses, attendance }: { users: User[]; courses: Course[]; attendance: Attendance[] }) {
  const activeUsers = users.filter((user) => user.active).length;
  const teachers = users.filter((user) => user.role === 'teacher' && user.active).length;
  const students = users.filter((user) => user.role === 'student' && user.active).length;
  const present = attendance.filter((item) => item.status === 'Presente').length;
  const absent = attendance.filter((item) => item.status === 'Ausente').length;
  const late = attendance.filter((item) => item.status === 'Tardanza').length;
  const totalRecords = attendance.length;
  const presentRate = totalRecords ? Math.round((present / totalRecords) * 100) : 0;
  const coverageRate = courses.length ? Math.round((courses.filter((course) => course.enrolled > 0).length / courses.length) * 100) : 0;
  const alertRows = [
    { label: 'Faltas registradas', value: absent, color: COLORS.red },
    { label: 'Tardanzas registradas', value: late, color: COLORS.amber },
    { label: 'Materias sin estudiantes', value: courses.filter((course) => course.enrolled === 0).length, color: COLORS.blue },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
      <Header eyebrow="CONTROL INSTITUCIONAL" title="Reportes" />
      <View style={styles.reportStatusCard}>
        <View style={styles.reportRing}>
          <Text style={styles.reportRingValue}>{presentRate}%</Text>
          <Text style={styles.reportRingLabel}>promedio</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.reportStatusTitle}>Panel de supervision</Text>
          <Text style={styles.reportStatusText}>Vista general para revisar usuarios, materias y novedades de asistencia.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Operacion academica</Text>
      <View style={styles.reportGrid}>
        <StatCard icon={<Users size={19} color={COLORS.blue} />} value={String(activeUsers)} label="Usuarios activos" tint="#E8F1FF" />
        <StatCard icon={<GraduationCap size={19} color={COLORS.green} />} value={String(students)} label="Estudiantes" tint="#E6F7F0" />
        <StatCard icon={<BookOpen size={19} color={COLORS.amber} />} value={String(courses.length)} label="Materias" tint="#FFF4D9" />
      </View>

      <Text style={styles.sectionTitle}>Cobertura</Text>
      <View style={styles.reportStack}>
        <View style={styles.reportLine}><View style={styles.reportLineTop}><BookOpen size={18} color={COLORS.blue} /><Text style={styles.reportLineLabel}>Materias con estudiantes</Text><Text style={styles.reportLineValue}>{coverageRate}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${coverageRate}%`, backgroundColor: COLORS.blue }]} /></View></View>
        <View style={styles.reportLine}><View style={styles.reportLineTop}><ShieldCheck size={18} color={COLORS.green} /><Text style={styles.reportLineLabel}>Docentes activos</Text><Text style={styles.reportLineValue}>{teachers}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${users.length ? Math.round((teachers / users.length) * 100) : 0}%`, backgroundColor: COLORS.green }]} /></View></View>
        <View style={styles.reportLine}><View style={styles.reportLineTop}><BarChart3 size={18} color={COLORS.amber} /><Text style={styles.reportLineLabel}>Registros procesados</Text><Text style={styles.reportLineValue}>{totalRecords}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(totalRecords * 12, 100)}%`, backgroundColor: COLORS.amber }]} /></View></View>
      </View>

      <Text style={styles.sectionTitle}>Alertas para revisar</Text>
      {alertRows.every((row) => row.value === 0) ? <EmptyState text="No hay alertas institucionales por ahora." /> : alertRows.map((row) => (
        <View style={styles.noticeRow} key={row.label}>
          <View style={[styles.noticeDot, { backgroundColor: row.color }]} />
          <View style={styles.flex}><Text style={styles.personName}>{row.label}</Text><Text style={styles.personMeta}>Dato calculado desde el backend</Text></View>
          <Text style={[styles.reportLineValue, { color: row.color }]}>{row.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
