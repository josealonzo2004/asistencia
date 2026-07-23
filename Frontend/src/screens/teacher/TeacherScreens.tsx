import { useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { AlertTriangle, BarChart3, BookOpen, CalendarCheck2, CheckCircle2, ClipboardCheck, Clock3, Edit3, MapPin, Plus, QrCode, Search, Trash2, Users, X } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

import { EmptyState, Field, Header, QuickRow, StatCard, StatusPill } from '../../components/common';
import { closeAttendanceSession, createAttendanceSession, deleteStudent, encodeQrSession, saveStudent } from '../../services/attendanceApi';
import { COLORS } from '../../theme';
import { styles } from '../../styles';
import type { Attendance, Course, QrSessionPayload, Screen, Student } from '../../types';
import { initials } from '../../utils/text';
import { isInstitutionalEmail } from '../../utils/validation';

export function TeacherHome({ courses, students, attendance, onNavigate, onSelectCourse }: { courses: Course[]; students: Student[]; attendance: Attendance[]; onNavigate: (screen: Screen) => void; onSelectCourse: (id: string) => void }) {
  const present = attendance.filter((item) => item.status === 'Presente').length;
  const pending = attendance.filter((item) => item.status === 'Pendiente').length;
  const enrolledTotal = courses.reduce((total, course) => total + course.enrolled, 0);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
      <Header eyebrow="DOCENTE" title="Hola, Prof. Maria" />
      <View style={styles.teacherHero}>
        <View style={styles.teacherHeroIcon}><ClipboardCheck size={25} color={COLORS.white} /></View>
        <View style={styles.flex}>
          <Text style={styles.todayLabel}>CONTROL DE CLASES</Text>
          <Text style={styles.teacherHeroTitle}>Asistencia por QR</Text>
          <Text style={styles.teacherHeroText}>Tus materias asignadas aparecen aqui para abrir una sesion de asistencia.</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Resumen</Text>
      <View style={styles.statsRow}>
        <StatCard icon={<BookOpen size={19} color={COLORS.amber} />} value={String(courses.length)} label="Materias" tint="#FFF4D9" />
        <StatCard icon={<Users size={19} color={COLORS.blue} />} value={String(enrolledTotal || students.length)} label="Inscritos" tint="#E8F1FF" />
        <StatCard icon={<CalendarCheck2 size={19} color={COLORS.green} />} value={pending ? String(pending) : `${present}/${attendance.length}`} label={pending ? 'Pendientes' : 'Presentes'} tint="#E6F7F0" />
      </View>
      <Text style={styles.sectionTitle}>Materias asignadas</Text>
      {courses.length === 0 ? <View style={styles.empty}><Text style={styles.emptyText}>El administrador aun no te asigna materias.</Text></View> : courses.map((course) => (
        <View style={styles.teacherCourseCard} key={course.id}>
          <View style={styles.courseIcon}><BookOpen size={21} color={COLORS.green} /></View>
          <View style={styles.flex}>
            <Text style={styles.courseCode}>{course.code}</Text>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseMeta}>{course.schedule}  |  {course.room}</Text>
            <Text style={styles.courseStudents}>{course.enrolled} estudiantes inscritos</Text>
          </View>
          <Pressable style={styles.rowIconButton} onPress={() => { onSelectCourse(course.id); onNavigate('attendance'); }}><QrCode size={20} color={COLORS.blue} /></Pressable>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Accesos rapidos</Text>
      <View style={styles.quickList}>
        <QuickRow icon={<ClipboardCheck size={21} color={COLORS.blue} />} title="Tomar asistencia" subtitle="Abre una sesion QR de tus materias" onPress={() => courses[0] && (onSelectCourse(courses[0].id), onNavigate('attendance'))} />
        <QuickRow icon={<BarChart3 size={21} color={COLORS.amber} />} title="Reportes" subtitle="Consulta porcentajes y novedades" onPress={() => onNavigate('reports')} />
      </View>
    </ScrollView>
  );
}

export function StudentsScreen({ students, setStudents }: { students: Student[]; setStudents: Dispatch<SetStateAction<Student[]>> }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Omit<Student, 'id'>>({ name: '', code: '', career: 'Ingenieria de Software', semester: '7mo', email: '', password: '' });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Omit<Student, 'id'>, string>>>({});
  const filtered = students.filter((student) => `${student.name} ${student.code}`.toLowerCase().includes(search.toLowerCase()));
  const startNew = () => { setEditing(null); setForm({ name: '', code: '', career: 'Ingenieria de Software', semester: '7mo', email: '', password: '' }); setFormOpen(true); };
  const startEdit = (student: Student) => { setEditing(student); setForm(student); setFormOpen(true); };
  const save = async () => {
    const nextErrors: typeof formErrors = {};
    if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio.';
    if (!form.code.trim()) nextErrors.code = 'El codigo estudiantil es obligatorio.';
    if (!isInstitutionalEmail(form.email)) nextErrors.email = 'Usa el formato nombre@uleam.edu.ec.';
    if (!editing && (form.password ?? '').length < 6) nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formPanel}>
    <ScrollView contentContainerStyle={styles.formPanelContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={styles.formHeader}><Text style={styles.formTitle}>{editing ? 'Editar estudiante' : 'Nuevo estudiante'}</Text><Pressable onPress={onClose}><X size={21} color={COLORS.muted} /></Pressable></View>
      <Field label="Nombre completo" value={form.name} onChangeText={(name) => updateField('name', name)} placeholder="Ej. Camila Andrade" error={errors.name} />
      <Field label="Codigo estudiantil" value={form.code} onChangeText={(code) => updateField('code', code)} placeholder="Ej. 202310001" keyboardType="numeric" error={errors.code} />
      <Field label="Correo institucional" value={form.email} onChangeText={(email) => updateField('email', email)} placeholder="estudiante@uleam.edu.ec" keyboardType="email-address" error={errors.email} />
      <Field label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'} value={form.password ?? ''} onChangeText={(password) => updateField('password', password)} placeholder="Minimo 6 caracteres" secureTextEntry error={errors.password} />
      <Field label="Carrera" value={form.career} onChangeText={(career) => updateField('career', career)} placeholder="Carrera" error={errors.career} />
      <Field label="Semestre" value={form.semester} onChangeText={(semester) => updateField('semester', semester)} placeholder="Ej. 7mo" error={errors.semester} />
      <Pressable style={styles.primaryButton} onPress={onSave}><Text style={styles.primaryButtonText}>{editing ? 'Guardar cambios' : 'Registrar estudiante'}</Text></Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AttendanceScreen({ courses, selectedCourseId, onSelectCourse, attendance, setAttendance }: { courses: Course[]; selectedCourseId: string; onSelectCourse: (id: string) => void; attendance: Attendance[]; setAttendance: Dispatch<SetStateAction<Attendance[]>> }) {
  const [qrSession, setQrSession] = useState<QrSessionPayload | null>(null);
  const selectedCourse = useMemo(() => courses.find((course) => course.id === selectedCourseId), [courses, selectedCourseId]);
  const counts = useMemo(() => ({
    present: attendance.filter((item) => item.status === 'Presente').length,
    late: attendance.filter((item) => item.status === 'Tardanza').length,
    absent: attendance.filter((item) => item.status === 'Ausente').length,
    pending: attendance.filter((item) => item.status === 'Pendiente').length,
  }), [attendance]);
  const generateQr = async () => {
    try {
      if (!selectedCourseId) {
        Alert.alert('Sin materia asignada', 'El administrador todavía no te ha asignado una materia.');
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Ubicacion requerida', 'Permite la ubicacion para que el QR use tu posicion como referencia del aula.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const session = await createAttendanceSession(selectedCourseId, location.coords.latitude, location.coords.longitude);
      setQrSession(session);
      Alert.alert('QR generado', 'La ubicacion del docente quedo guardada como referencia. Los estudiantes ya pueden escanearlo.');
    } catch (error) {
      Alert.alert('No se pudo generar el QR', error instanceof Error ? error.message : 'Revisa la conexion y los permisos de ubicacion.');
    }
  };

  const closeSession = async () => {
    if (!qrSession) {
      Alert.alert('Sin QR activo', 'Primero genera una sesion de asistencia.');
      return;
    }

    try {
      const result = await closeAttendanceSession(qrSession.sessionId);
      setAttendance(result.attendance);
      setQrSession(null);
      Alert.alert('Sesion cerrada', result.message);
    } catch (error) {
      Alert.alert('No se pudo cerrar', error instanceof Error ? error.message : 'Intentalo de nuevo.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
      <Header eyebrow="SESION DE ASISTENCIA" title="Tomar asistencia" />
      <Text style={styles.sectionTitle}>Materia</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChoices}>
        {courses.map((course) => <Pressable key={course.id} style={[styles.courseChoice, selectedCourseId === course.id && styles.courseChoiceActive]} onPress={() => onSelectCourse(course.id)}><Text style={[styles.courseChoiceCode, selectedCourseId === course.id && styles.courseChoiceCodeActive]}>{course.code}</Text><Text style={[styles.courseChoiceName, selectedCourseId === course.id && styles.courseChoiceNameActive]}>{course.name}</Text><Text style={[styles.courseChoiceMeta, selectedCourseId === course.id && styles.courseChoiceMetaActive]}>{course.schedule}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.attendanceControlCard}>
        <View style={styles.classInfoCompact}>
          <View style={styles.courseIcon}><MapPin size={21} color={COLORS.green} /></View>
          <View style={styles.flex}>
            <Text style={styles.classInfoTitle}>{selectedCourse?.name ?? 'Selecciona una materia'}</Text>
            <Text style={styles.classInfoMeta}>{selectedCourse ? `${selectedCourse.room} | ${selectedCourse.schedule}` : 'Sin aula asignada'}</Text>
          </View>
        </View>
        <Pressable style={styles.primaryButton} onPress={generateQr}>
          <QrCode size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>{qrSession ? 'Regenerar QR' : 'Generar QR'}</Text>
        </Pressable>
      </View>
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
      <Text style={styles.sectionTitle}>Estado de la sesion</Text>
      <View style={styles.attendanceSummary}><View><Text style={styles.summaryNumber}>{counts.present}</Text><Text style={styles.summaryLabel}>Presentes</Text></View><View style={styles.summaryDivider} /><View><Text style={[styles.summaryNumber, { color: COLORS.amber }]}>{counts.late}</Text><Text style={styles.summaryLabel}>Tardanzas</Text></View><View style={styles.summaryDivider} /><View><Text style={[styles.summaryNumber, { color: COLORS.red }]}>{counts.absent}</Text><Text style={styles.summaryLabel}>Ausentes</Text></View></View>
      {counts.pending ? <Text style={styles.tip}>{counts.pending} estudiantes siguen pendientes de escanear QR.</Text> : <Text style={styles.tip}>Los estados se actualizan cuando cada estudiante escanea el QR y valida su ubicacion.</Text>}
      <Text style={styles.sectionTitle}>Estudiantes</Text>
      {attendance.length === 0 ? <EmptyState text="No hay estudiantes inscritos para mostrar." /> : attendance.map((item) => (
        <View style={styles.attendanceRow} key={item.id}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View><View style={styles.flex}><Text style={styles.personName}>{item.name}</Text><Text style={styles.personMeta}>{item.code}</Text></View><StatusPill status={item.status} /></View>
      ))}
      <Pressable style={styles.saveSession} onPress={closeSession}><ClipboardCheck size={20} color={COLORS.white} /><Text style={styles.primaryButtonText}>Cerrar sesion y marcar faltas</Text></Pressable>
    </ScrollView>
  );
}

export function ReportsScreen({ attendance, students }: { attendance: Attendance[]; students: Student[] }) {
  const present = attendance.filter((item) => item.status === 'Presente').length;
  const late = attendance.filter((item) => item.status === 'Tardanza').length;
  const absent = attendance.filter((item) => item.status === 'Ausente').length;
  const pending = attendance.filter((item) => item.status === 'Pendiente').length;
  const total = attendance.length || students.length;
  const presentRate = total ? Math.round((present / total) * 100) : 0;
  const riskStudents = attendance.filter((item) => item.status === 'Ausente' || item.status === 'Tardanza');
  const statusText = presentRate >= 80 ? 'Curso estable' : presentRate >= 60 ? 'Revisar asistencia' : 'Atencion requerida';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
      <Header eyebrow="ANALISIS DEL CURSO" title="Reportes" />
      <View style={styles.reportStatusCard}>
        <View style={styles.reportRing}>
          <Text style={styles.reportRingValue}>{presentRate}%</Text>
          <Text style={styles.reportRingLabel}>asistencia</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.reportStatusTitle}>{statusText}</Text>
          <Text style={styles.reportStatusText}>Resultado calculado con los registros reales de la sesion activa o cerrada.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Lectura rapida</Text>
      <View style={styles.reportStack}>
        <View style={styles.reportLine}><View style={styles.reportLineTop}><CheckCircle2 size={18} color={COLORS.green} /><Text style={styles.reportLineLabel}>Presentes</Text><Text style={styles.reportLineValue}>{present}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${total ? Math.round((present / total) * 100) : 0}%`, backgroundColor: COLORS.green }]} /></View></View>
        <View style={styles.reportLine}><View style={styles.reportLineTop}><Clock3 size={18} color={COLORS.amber} /><Text style={styles.reportLineLabel}>Tardanzas</Text><Text style={styles.reportLineValue}>{late}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${total ? Math.round((late / total) * 100) : 0}%`, backgroundColor: COLORS.amber }]} /></View></View>
        <View style={styles.reportLine}><View style={styles.reportLineTop}><AlertTriangle size={18} color={COLORS.red} /><Text style={styles.reportLineLabel}>Ausentes</Text><Text style={styles.reportLineValue}>{absent}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${total ? Math.round((absent / total) * 100) : 0}%`, backgroundColor: COLORS.red }]} /></View></View>
      </View>

      <Text style={styles.sectionTitle}>Seguimiento docente</Text>
      <View style={styles.quickList}>
        <QuickRow icon={<Users size={21} color={COLORS.blue} />} title={`${total} estudiantes considerados`} subtitle={`${pending} pendientes de registrar o cerrar sesion`} onPress={() => Alert.alert('Detalle', 'Los pendientes cambian cuando el estudiante escanea o cuando cierras la sesion.')} />
        <QuickRow icon={<AlertTriangle size={21} color={COLORS.red} />} title={`${riskStudents.length} novedades`} subtitle="Estudiantes con falta o tardanza" onPress={() => Alert.alert('Novedades', riskStudents.length ? riskStudents.map((item) => `${item.name}: ${item.status}`).join('\n') : 'No hay novedades.')} />
      </View>

      <Text style={styles.sectionTitle}>Lista de atencion</Text>
      {riskStudents.length === 0 ? <EmptyState text="No hay estudiantes con novedades." /> : riskStudents.map((item) => <View style={styles.noticeRow} key={item.id}><View style={[styles.noticeDot, { backgroundColor: item.status === 'Ausente' ? COLORS.red : COLORS.amber }]} /><View style={styles.flex}><Text style={styles.personName}>{item.name}</Text><Text style={styles.personMeta}>{item.status} | {item.code}</Text></View><StatusPill status={item.status} /></View>)}
    </ScrollView>
  );
}
