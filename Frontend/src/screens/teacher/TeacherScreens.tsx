import { useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BarChart3, BookOpen, CalendarCheck2, ClipboardCheck, Edit3, MapPin, Plus, QrCode, Search, Trash2, Users, X } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

import { EmptyState, Field, Header, QuickRow, ReportMetric, StatCard, StatusPill } from '../../components/common';
import { buildDemoQrSession, createAttendanceSession, deleteStudent, encodeQrSession, saveStudent } from '../../services/attendanceApi';
import { COLORS } from '../../theme';
import { styles } from '../../styles';
import type { Attendance, QrSessionPayload, Screen, Student } from '../../types';
import { initials } from '../../utils/text';

export function TeacherHome({ students, attendance, onNavigate }: { students: Student[]; attendance: Attendance[]; onNavigate: (screen: Screen) => void }) {
  const present = attendance.filter((item) => item.status === 'Presente').length;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
      <Header eyebrow="DOCENTE" title="Hola, Prof. Maria" />
      <View style={styles.todayCard}>
        <View style={styles.todayTop}>
          <View style={styles.flex}>
            <Text style={styles.todayLabel}>PROXIMA CLASE</Text>
            <Text style={styles.todayCourse}>Aplicaciones Moviles</Text>
            <Text style={styles.todayInfo}>10:00 - 12:00  |  Laboratorio 3</Text>
          </View>
          <View style={styles.timeBadge}><Text style={styles.timeBadgeText}>10:00</Text></View>
        </View>
        <Pressable style={styles.attendanceCta} onPress={() => onNavigate('attendance')}>
          <ClipboardCheck size={20} color={COLORS.navy} />
          <Text style={styles.attendanceCtaText}>Tomar asistencia</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionTitle}>Resumen de hoy</Text>
      <View style={styles.statsRow}>
        <StatCard icon={<Users size={19} color={COLORS.blue} />} value={students.length.toString()} label="Estudiantes" tint="#E8F1FF" />
        <StatCard icon={<CalendarCheck2 size={19} color={COLORS.green} />} value={`${present}/${attendance.length}`} label="Presentes" tint="#E6F7F0" />
        <StatCard icon={<BookOpen size={19} color={COLORS.amber} />} value="3" label="Cursos activos" tint="#FFF4D9" />
      </View>
      <Text style={styles.sectionTitle}>Accesos rapidos</Text>
      <View style={styles.quickList}>
        <QuickRow icon={<Users size={21} color={COLORS.blue} />} title="Estudiantes" subtitle="Registrar y gestionar estudiantes" onPress={() => onNavigate('students')} />
        <QuickRow icon={<BookOpen size={21} color={COLORS.green} />} title="Materias y horarios" subtitle="Organiza cursos y aulas" onPress={() => onNavigate('courses')} />
        <QuickRow icon={<BarChart3 size={21} color={COLORS.amber} />} title="Reportes" subtitle="Consulta porcentajes y novedades" onPress={() => onNavigate('reports')} />
      </View>
    </ScrollView>
  );
}

export function StudentsScreen({ students, setStudents }: { students: Student[]; setStudents: Dispatch<SetStateAction<Student[]>> }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', career: 'Ingenieria de Software', semester: '7mo', email: '' });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Omit<Student, 'id'>, string>>>({});
  const filtered = students.filter((student) => `${student.name} ${student.code}`.toLowerCase().includes(search.toLowerCase()));
  const startNew = () => { setEditing(null); setForm({ name: '', code: '', career: 'Ingenieria de Software', semester: '7mo', email: '' }); setFormOpen(true); };
  const startEdit = (student: Student) => { setEditing(student); setForm(student); setFormOpen(true); };
  const save = async () => {
    const nextErrors: typeof formErrors = {};
    if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio.';
    if (!form.code.trim()) nextErrors.code = 'El codigo estudiantil es obligatorio.';
    if (!form.email.includes('@')) nextErrors.email = 'Ingresa un correo valido.';
    if (!form.career.trim()) nextErrors.career = 'La carrera es obligatoria.';
    if (!form.semester.trim()) nextErrors.semester = 'El semestre es obligatorio.';
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      return;
    }
    setFormErrors({});
    try {
      const saved = await saveStudent(form, editing?.id);
      if (editing) setStudents((items) => items.map((item) => item.id === editing.id ? saved : item));
      else setStudents((items) => [...items, saved]);
      setFormOpen(false);
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intentalo de nuevo.');
    }
  };
  return (
    <View style={styles.screen}>
      <Header eyebrow="GESTION ACADEMICA" title="Estudiantes" action={<Pressable style={styles.iconButton} onPress={startNew}><Plus size={22} color={COLORS.white} /></Pressable>} />
      <View style={styles.searchBox}><Search size={19} color={COLORS.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar por nombre o codigo" placeholderTextColor="#94A3B8" style={styles.searchInput} /></View>
      {formOpen ? <StudentForm editing={editing} form={form} setForm={setForm} errors={formErrors} setErrors={setFormErrors} onClose={() => setFormOpen(false)} onSave={save} /> : null}
      <FlatList data={filtered} keyExtractor={(item) => item.id} contentContainerStyle={styles.listPad} ListEmptyComponent={<EmptyState text="No encontramos estudiantes." />} renderItem={({ item }) => (
        <View style={styles.personRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View>
          <View style={styles.flex}><Text style={styles.personName}>{item.name}</Text><Text style={styles.personMeta}>{item.code}  |  {item.semester}</Text><Text numberOfLines={1} style={styles.personCareer}>{item.career}</Text></View>
          <Pressable style={styles.rowIconButton} onPress={() => startEdit(item)}><Edit3 size={17} color={COLORS.blue} /></Pressable>
          <Pressable style={styles.rowIconButton} onPress={() => Alert.alert('Eliminar estudiante', `Eliminar a ${item.name}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteStudent(item.id); setStudents((items) => items.filter((student) => student.id !== item.id)); } }])}><Trash2 size={17} color={COLORS.red} /></Pressable>
        </View>
      )} />
    </View>
  );
}

function StudentForm({ editing, form, setForm, errors, setErrors, onClose, onSave }: {
  editing: Student | null;
  form: Omit<Student, 'id'>;
  setForm: Dispatch<SetStateAction<Omit<Student, 'id'>>>;
  errors: Partial<Record<keyof Omit<Student, 'id'>, string>>;
  setErrors: Dispatch<SetStateAction<Partial<Record<keyof Omit<Student, 'id'>, string>>>>;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateField = (key: keyof Omit<Student, 'id'>, value: string) => {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: undefined });
  };

  return (
    <ScrollView style={styles.formPanel} contentContainerStyle={styles.formPanelContent} keyboardShouldPersistTaps="handled">
      <View style={styles.formHeader}><Text style={styles.formTitle}>{editing ? 'Editar estudiante' : 'Nuevo estudiante'}</Text><Pressable onPress={onClose}><X size={21} color={COLORS.muted} /></Pressable></View>
      <Field label="Nombre completo" value={form.name} onChangeText={(name) => updateField('name', name)} placeholder="Ej. Camila Andrade" error={errors.name} />
      <Field label="Codigo estudiantil" value={form.code} onChangeText={(code) => updateField('code', code)} placeholder="Ej. 202310001" keyboardType="numeric" error={errors.code} />
      <Field label="Correo institucional" value={form.email} onChangeText={(email) => updateField('email', email)} placeholder="estudiante@uni.edu.ec" keyboardType="email-address" error={errors.email} />
      <Field label="Carrera" value={form.career} onChangeText={(career) => updateField('career', career)} placeholder="Carrera" error={errors.career} />
      <Field label="Semestre" value={form.semester} onChangeText={(semester) => updateField('semester', semester)} placeholder="Ej. 7mo" error={errors.semester} />
      <Pressable style={styles.primaryButton} onPress={onSave}><Text style={styles.primaryButtonText}>{editing ? 'Guardar cambios' : 'Registrar estudiante'}</Text></Pressable>
    </ScrollView>
  );
}

export function AttendanceScreen({ attendance, setAttendance }: { attendance: Attendance[]; setAttendance: Dispatch<SetStateAction<Attendance[]>> }) {
  const [qrSession, setQrSession] = useState<QrSessionPayload | null>(null);
  const counts = useMemo(() => ({ present: attendance.filter((item) => item.status === 'Presente').length, late: attendance.filter((item) => item.status === 'Tardanza').length }), [attendance]);
  const cycle = (id: string) => setAttendance((items) => items.map((item) => item.id !== id ? item : { ...item, status: item.status === 'Presente' ? 'Tardanza' : item.status === 'Tardanza' ? 'Ausente' : 'Presente' }));
  const generateQr = async () => {
    try {
      const session = await createAttendanceSession();
      setQrSession(session);
      Alert.alert('QR generado', 'Sesion creada en Laravel. Los estudiantes pueden escanearla.');
    } catch {
      const session = buildDemoQrSession();
      setQrSession(session);
      Alert.alert('QR demo generado', 'Laravel aun no responde. Se genero un QR local para probar la interfaz.');
    }
  };

  return (
    <View style={styles.screen}>
      <Header eyebrow="SESION ACTIVA" title="Aplicaciones Moviles" action={<Pressable style={styles.qrButton} onPress={generateQr}><QrCode size={21} color={COLORS.white} /></Pressable>} />
      <View style={styles.classInfo}><View><Text style={styles.classInfoTitle}>Lunes 21 de julio</Text><Text style={styles.classInfoMeta}>10:00 - 12:00  |  Laboratorio 3</Text></View><MapPin size={20} color={COLORS.green} /></View>
      {qrSession ? (
        <View style={styles.qrSessionCard}>
          <View style={styles.qrCanvas}>
            <QRCode value={encodeQrSession(qrSession)} size={170} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.qrSessionTitle}>QR activo</Text>
            <Text style={styles.qrSessionText}>{qrSession.courseName} | {qrSession.room}</Text>
            <Text style={styles.qrSessionText}>Radio GPS: {qrSession.radiusMeters} m</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.attendanceSummary}><View><Text style={styles.summaryNumber}>{counts.present}</Text><Text style={styles.summaryLabel}>Presentes</Text></View><View style={styles.summaryDivider} /><View><Text style={[styles.summaryNumber, { color: COLORS.amber }]}>{counts.late}</Text><Text style={styles.summaryLabel}>Tardanzas</Text></View><View style={styles.summaryDivider} /><View><Text style={[styles.summaryNumber, { color: COLORS.red }]}>{attendance.length - counts.present - counts.late}</Text><Text style={styles.summaryLabel}>Ausentes</Text></View></View>
      <Text style={styles.tip}>Toca el estado de cada estudiante para cambiarlo.</Text>
      <FlatList data={attendance} keyExtractor={(item) => item.id} contentContainerStyle={styles.listPad} renderItem={({ item }) => (
        <View style={styles.attendanceRow}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View><View style={styles.flex}><Text style={styles.personName}>{item.name}</Text><Text style={styles.personMeta}>{item.code}</Text></View><StatusPill status={item.status} onPress={() => cycle(item.id)} /></View>
      )} />
      <Pressable style={styles.saveSession} onPress={() => Alert.alert('Asistencia guardada', 'La sesion se guardo localmente. Luego se sincronizara con Laravel.')}><ClipboardCheck size={20} color={COLORS.white} /><Text style={styles.primaryButtonText}>Finalizar y guardar</Text></Pressable>
    </View>
  );
}

export function ReportsScreen({ attendance, students }: { attendance: Attendance[]; students: Student[] }) {
  const presentRate = attendance.length ? Math.round((attendance.filter((item) => item.status === 'Presente').length / attendance.length) * 100) : 0;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad}>
      <Header eyebrow="ANALISIS DEL CURSO" title="Reportes" />
      <View style={styles.reportHero}><Text style={styles.reportCaption}>ASISTENCIA DEL CURSO</Text><Text style={styles.reportValue}>{presentRate}%</Text><Text style={styles.reportSubtext}>Aplicaciones Moviles | Julio 2026</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${presentRate}%` }]} /></View></View>
      <Text style={styles.sectionTitle}>Resumen de la sesion</Text><View style={styles.reportGrid}><ReportMetric label="Total estudiantes" value={String(students.length)} color={COLORS.blue} /><ReportMetric label="Presentes" value={String(attendance.filter((item) => item.status === 'Presente').length)} color={COLORS.green} /><ReportMetric label="Tardanzas" value={String(attendance.filter((item) => item.status === 'Tardanza').length)} color={COLORS.amber} /><ReportMetric label="Ausentes" value={String(attendance.filter((item) => item.status === 'Ausente').length)} color={COLORS.red} /></View>
      <Text style={styles.sectionTitle}>Estudiantes con novedad</Text>{attendance.filter((item) => item.status !== 'Presente').length === 0 ? <EmptyState text="No hay novedades en esta sesion." /> : attendance.filter((item) => item.status !== 'Presente').map((item) => <View style={styles.noticeRow} key={item.id}><View style={styles.noticeDot} /><View style={styles.flex}><Text style={styles.personName}>{item.name}</Text><Text style={styles.personMeta}>{item.status} | {item.code}</Text></View></View>)}
    </ScrollView>
  );
}
