import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { BookOpen, CalendarCheck2, ClipboardCheck, MapPin, QrCode, ScanLine, X } from 'lucide-react-native';

import { EmptyState, Header, HistoryRow, InfoRow, StatCard } from '../../components/common';
import { parseQrSession, validateAttendance } from '../../services/attendanceApi';
import { COLORS } from '../../theme';
import { styles } from '../../styles';
import type { Course, SessionRecord, Student } from '../../types';

export function StudentHome({ student, records, onAttendanceValidated }: { student: Student; records: SessionRecord[]; onAttendanceValidated: () => Promise<void> }) {
  const absences = records.filter((record) => record.status === 'Ausente').length;
  const late = records.filter((record) => record.status === 'Tardanza').length;
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Camara requerida', 'Activa la camara para escanear el QR de clase.');
        return;
      }
    }
    setScannerOpen(true);
  };

  const handleQrScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    setScanning(true);

    const qr = parseQrSession(data);
    if (!qr) {
      Alert.alert('QR no valido', 'Este codigo no pertenece a una sesion de asistencia.');
      setScanning(false);
      return;
    }

    const locationPermission = await Location.requestForegroundPermissionsAsync();
    if (locationPermission.status !== 'granted') {
      Alert.alert('GPS requerido', 'Activa la ubicacion para validar que estas cerca del aula.');
      setScanning(false);
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const result = await validateAttendance({
        qr,
        studentCode: student.code,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      Alert.alert(result.status === 'accepted' ? 'Asistencia registrada' : 'Asistencia rechazada', result.message);
      if (result.status === 'accepted') await onAttendanceValidated();
      setScannerOpen(false);
    } catch {
      Alert.alert('Validacion preparada', 'La app ya capturo QR y GPS. Cuando Laravel este corriendo, enviara estos datos al backend.');
      setScannerOpen(false);
    } finally {
      setScanning(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
      <Header eyebrow="ESTUDIANTE" title={`Hola, ${student.name.split(' ')[0]}`} />
      <View style={styles.studentPass}>
        <View>
          <Text style={styles.todayLabel}>CARNET DIGITAL</Text>
          <Text style={styles.todayCourse}>{student.name}</Text>
          <Text style={styles.todayInfo}>{student.code}  |  {student.semester}</Text>
        </View>
        <View style={styles.qrMini}><QrCode size={42} color={COLORS.navy} /></View>
      </View>
      <Text style={styles.sectionTitle}>Mi asistencia</Text>
      <View style={styles.statsRow}>
        <StatCard icon={<ClipboardCheck size={19} color={COLORS.green} />} value={records.length ? `${records.length - absences}/${records.length}` : '0'} label="Asistencias" tint="#E6F7F0" />
        <StatCard icon={<X size={19} color={COLORS.red} />} value={String(absences)} label="Faltas" tint="#FDE7E7" />
        <StatCard icon={<CalendarCheck2 size={19} color={COLORS.amber} />} value={String(late)} label="Tardanzas" tint="#FFF4D9" />
      </View>
      <Text style={styles.sectionTitle}>Marcar asistencia</Text>
      {scannerOpen ? (
        <View style={styles.scannerCard}>
          <CameraView
            style={styles.cameraPreview}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleQrScanned}
          />
          <Pressable style={styles.scannerClose} onPress={() => setScannerOpen(false)}>
            <X size={20} color={COLORS.white} />
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.scanCta} onPress={openScanner}>
          <ScanLine size={22} color={COLORS.white} />
          <View style={styles.flex}>
            <Text style={styles.scanCtaTitle}>Escanear QR de clase</Text>
            <Text style={styles.scanCtaText}>La app validara camara, GPS, horario y aula.</Text>
          </View>
          <MapPin size={20} color={COLORS.white} />
        </Pressable>
      )}
      <Text style={styles.sectionTitle}>Ultimas clases</Text>
      {records.length === 0 ? (
        <EmptyState text="Aun no tienes asistencias reales registradas." />
      ) : records.slice(0, 3).map((record) => <HistoryRow key={record.id} record={record} />)}
    </ScrollView>
  );
}

export function StudentCalendar({ courses }: { courses: Course[] }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad}>
      <Header eyebrow="MI HORARIO" title="Clases inscritas" />
      {courses.map((course) => (
        <View style={styles.courseCard} key={course.id}>
          <View style={styles.courseIcon}><BookOpen size={21} color={COLORS.green} /></View>
          <View style={styles.flex}>
            <Text style={styles.courseCode}>{course.code}</Text>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseMeta}>{course.schedule}  |  {course.room}</Text>
            <Text style={styles.courseStudents}>{course.teacher}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export function StudentHistory({ records }: { records: SessionRecord[] }) {
  const absenceCount = records.filter((record) => record.status === 'Ausente').length;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad}>
      <Header eyebrow="HISTORIAL" title="Mis asistencias" />
      <View style={styles.reportHero}>
        <Text style={styles.reportCaption}>FALTAS ACUMULADAS</Text>
        <Text style={styles.reportValue}>{absenceCount}</Text>
        <Text style={styles.reportSubtext}>El estudiante revisa, no marca asistencia.</Text>
      </View>
      <Text style={styles.sectionTitle}>Registro por clase</Text>
      {records.length === 0 ? <EmptyState text="Cuando escanees un QR valido, aparecera aqui." /> : records.map((record) => <HistoryRow key={record.id} record={record} />)}
    </ScrollView>
  );
}

export function StudentProfile({ student }: { student: Student }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad}>
      <Header eyebrow="PERFIL" title="Datos academicos" />
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>AT</Text></View>
        <Text style={styles.profileName}>{student.name}</Text>
        <Text style={styles.profileMeta}>{student.email}</Text>
        <View style={styles.profileRows}>
          <InfoRow label="Codigo" value={student.code} />
          <InfoRow label="Carrera" value={student.career} />
          <InfoRow label="Semestre" value={student.semester} />
        </View>
      </View>
    </ScrollView>
  );
}
