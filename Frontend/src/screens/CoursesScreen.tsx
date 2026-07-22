import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { BookOpen, Edit3, Plus, Trash2, X } from 'lucide-react-native';

import { Field, Header } from '../components/common';
import { deleteCourse, saveCourse } from '../services/attendanceApi';
import { COLORS } from '../theme';
import { styles } from '../styles';
import type { Course } from '../types';

export function CoursesScreen({ courses, setCourses, adminMode = false }: { courses: Course[]; setCourses: Dispatch<SetStateAction<Course[]>>; adminMode?: boolean }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ name: '', code: '', room: '', schedule: '', teacher: 'Prof. Maria', enrolled: '25' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const begin = (course?: Course) => {
    setEditing(course ?? null);
    setForm(course ? { ...course, enrolled: String(course.enrolled) } : { name: '', code: '', room: '', schedule: '', teacher: 'Prof. Maria', enrolled: '25' });
    setFormOpen(true);
  };
  const save = async () => {
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio.';
    if (!form.code.trim()) nextErrors.code = 'El codigo es obligatorio.';
    if (!form.teacher.trim()) nextErrors.teacher = 'El docente es obligatorio.';
    if (!form.room.trim()) nextErrors.room = 'El aula es obligatoria.';
    if (!form.schedule.trim()) nextErrors.schedule = 'El horario es obligatorio.';
    if (!Number(form.enrolled)) nextErrors.enrolled = 'Ingresa un numero valido.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    try {
      const saved = await saveCourse({ ...form, enrolled: Number(form.enrolled) || 0 }, editing?.id);
      if (editing) setCourses((items) => items.map((item) => item.id === editing.id ? saved : item));
      else setCourses((items) => [...items, saved]);
      setFormOpen(false);
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intentalo de nuevo.');
    }
  };
  return (
    <View style={styles.screen}>
      <Header eyebrow={adminMode ? 'ADMINISTRACION' : 'GESTION ACADEMICA'} title={adminMode ? 'Materias institucionales' : 'Materias y horarios'} action={<Pressable style={styles.iconButton} onPress={() => begin()}><Plus size={22} color={COLORS.white} /></Pressable>} />
      {formOpen ? (
        <ScrollView style={styles.formPanel} contentContainerStyle={styles.formPanelContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formHeader}><Text style={styles.formTitle}>{editing ? 'Editar materia' : 'Nueva materia'}</Text><Pressable onPress={() => setFormOpen(false)}><X size={21} color={COLORS.muted} /></Pressable></View>
          <Field label="Nombre" value={form.name} onChangeText={(name) => { setForm({ ...form, name }); setErrors({ ...errors, name: undefined }); }} placeholder="Ej. Desarrollo movil" error={errors.name} />
          <Field label="Codigo" value={form.code} onChangeText={(code) => { setForm({ ...form, code }); setErrors({ ...errors, code: undefined }); }} placeholder="Ej. ISW-702" error={errors.code} />
          <Field label="Docente" value={form.teacher} onChangeText={(teacher) => { setForm({ ...form, teacher }); setErrors({ ...errors, teacher: undefined }); }} placeholder="Ej. Prof. Maria" error={errors.teacher} />
          <Field label="Aula" value={form.room} onChangeText={(room) => { setForm({ ...form, room }); setErrors({ ...errors, room: undefined }); }} placeholder="Ej. Laboratorio 3" error={errors.room} />
          <Field label="Horario" value={form.schedule} onChangeText={(schedule) => { setForm({ ...form, schedule }); setErrors({ ...errors, schedule: undefined }); }} placeholder="Ej. Lun 10:00 - 12:00" error={errors.schedule} />
          <Field label="Estudiantes inscritos" value={form.enrolled} onChangeText={(enrolled) => { setForm({ ...form, enrolled }); setErrors({ ...errors, enrolled: undefined }); }} placeholder="25" keyboardType="numeric" error={errors.enrolled} />
          <Pressable style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>{editing ? 'Guardar cambios' : 'Registrar materia'}</Text></Pressable>
        </ScrollView>
      ) : null}
      <FlatList data={courses} keyExtractor={(item) => item.id} contentContainerStyle={styles.listPad} renderItem={({ item }) => (
        <View style={styles.courseCard}>
          <View style={styles.courseIcon}><BookOpen size={21} color={COLORS.green} /></View>
          <View style={styles.flex}><Text style={styles.courseCode}>{item.code}</Text><Text style={styles.courseName}>{item.name}</Text><Text style={styles.courseMeta}>{item.schedule}  |  {item.room}</Text><Text style={styles.courseStudents}>{item.teacher}  |  {item.enrolled} inscritos</Text></View>
          <View><Pressable style={styles.rowIconButton} onPress={() => begin(item)}><Edit3 size={17} color={COLORS.blue} /></Pressable><Pressable style={styles.rowIconButton} onPress={() => Alert.alert('Eliminar materia', `Eliminar ${item.name}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteCourse(item.id); setCourses((items) => items.filter((course) => course.id !== item.id)); } }])}><Trash2 size={17} color={COLORS.red} /></Pressable></View>
        </View>
      )} />
    </View>
  );
}
