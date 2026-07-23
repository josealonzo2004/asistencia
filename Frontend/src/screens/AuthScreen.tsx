import { useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { ChevronRight, GraduationCap } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

import { Field } from '../components/common';
import { login } from '../services/attendanceApi';
import { COLORS } from '../theme';
import { styles } from '../styles';
import type { AuthSession } from '../types';
import { isInstitutionalEmail } from '../utils/validation';

export function AuthScreen({
  onAuthenticated,
}: {
  onAuthenticated: (session: AuthSession) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors: typeof errors = {};
    if (!isInstitutionalEmail(normalizedEmail)) nextErrors.email = 'Usa el formato nombre@uleam.edu.ec.';
    if (password.length < 6) nextErrors.password = 'La contrasena debe tener al menos 6 caracteres.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const session = await login(normalizedEmail, password);
      await onAuthenticated(session);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'No se pudo iniciar sesion.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../../assets/fondo.png')} style={styles.authBackground} imageStyle={styles.authBackgroundImage}>
      <SafeAreaView style={styles.authOverlay}>
        <StatusBar style="light" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0} style={styles.flex}>
          <ScrollView contentContainerStyle={[styles.authContent, { paddingBottom: 70 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <View style={styles.brandMark}>
              <GraduationCap size={37} color={COLORS.white} />
            </View>
            <Text style={styles.brand}>Asiste U</Text>
            <Text style={styles.authTitle}>Control de asistencia</Text>
            <Text style={styles.authSubtitle}>Ingresa con tu correo institucional para acceder segun tu rol.</Text>

            <View style={styles.authFormCard}>
              <Field label="Correo" value={email} onChangeText={(value) => { setEmail(value); setErrors({ ...errors, email: undefined, form: undefined }); }} placeholder="correo@uleam.edu.ec" keyboardType="email-address" error={errors.email} />
              <Field label="Contrasena" value={password} onChangeText={(value) => { setPassword(value); setErrors({ ...errors, password: undefined, form: undefined }); }} placeholder="Minimo 6 caracteres" secureTextEntry error={errors.password} />
              {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

              <Pressable style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={signIn} disabled={loading}>
                <Text style={styles.primaryButtonText}>{loading ? 'Conectando...' : 'Iniciar sesion'}</Text>
                <ChevronRight size={20} color={COLORS.white} />
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
