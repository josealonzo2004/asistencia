import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { ChevronRight, Eye, EyeOff, GraduationCap } from 'lucide-react-native';
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
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    const nextErrors: typeof errors = {};
    if (!isInstitutionalEmail(email)) nextErrors.email = 'Usa el formato nombre@universidad.edu.ec.';
    if (password.length < 6) nextErrors.password = 'La contrasena debe tener al menos 6 caracteres.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const session = await login(email, password);
      await onAuthenticated(session);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'No se pudo iniciar sesion.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authSafe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.authContent, { paddingBottom: 70 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.brandMark}>
            <GraduationCap size={37} color={COLORS.white} />
          </View>
          <Text style={styles.brand}>Asiste U</Text>
          <Text style={styles.authTitle}>Control de asistencia</Text>
          <Text style={styles.authSubtitle}>Ingresa con tu correo institucional para acceder segun tu rol.</Text>

          <Field label="Correo" value={email} onChangeText={(value) => { setEmail(value); setErrors({ ...errors, email: undefined, form: undefined }); }} placeholder="correo@universidad.edu.ec" keyboardType="email-address" error={errors.email} />
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, errors.password && styles.fieldLabelError]}>Contrasena</Text>
            <View style={[styles.passwordInputWrap, errors.password && styles.inputError]}>
              <TextInput
                value={password}
                onChangeText={(value) => { setPassword(value); setErrors({ ...errors, password: undefined, form: undefined }); }}
                placeholder="Minimo 6 caracteres"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.passwordInput}
              />
              <Pressable style={styles.passwordToggle} onPress={() => setShowPassword((current) => !current)}>
                {showPassword ? <EyeOff size={20} color={COLORS.muted} /> : <Eye size={20} color={COLORS.muted} />}
              </Pressable>
            </View>
            {errors.password ? <Text style={styles.fieldErrorText}>{errors.password}</Text> : null}
          </View>
          {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

          <Pressable style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={signIn} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Conectando...' : 'Iniciar sesion'}</Text>
            <ChevronRight size={20} color={COLORS.white} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
