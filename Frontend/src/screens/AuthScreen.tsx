import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { ChevronRight, GraduationCap, IdCard, ShieldCheck, UserCheck } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

import { Field } from '../components/common';
import { login } from '../services/attendanceApi';
import { COLORS, demoCredentials, roleLabels } from '../theme';
import { styles } from '../styles';
import type { AuthSession, Role } from '../types';

export function AuthScreen({
  selectedRole,
  onChangeRole,
  onAuthenticated,
}: {
  selectedRole: Role;
  onChangeRole: (role: Role) => void;
  onAuthenticated: (session: AuthSession) => Promise<void>;
}) {
  const [email, setEmail] = useState(demoCredentials[selectedRole]);
  const [password, setPassword] = useState('123456');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const changeRole = (role: Role) => {
    onChangeRole(role);
    setEmail(demoCredentials[role]);
    setErrors({});
  };

  const signIn = async () => {
    const nextErrors: typeof errors = {};
    if (!email.includes('@')) nextErrors.email = 'Ingresa un correo institucional valido.';
    if (password.length < 6) nextErrors.password = 'La contrasena debe tener al menos 6 caracteres.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const session = await login(email, password, selectedRole);
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark}>
            <GraduationCap size={37} color={COLORS.white} />
          </View>
          <Text style={styles.brand}>Asiste U</Text>
          <Text style={styles.authTitle}>Control de asistencia</Text>
          <Text style={styles.authSubtitle}>Entra con el rol que quieres revisar en el prototipo.</Text>

          <RoleSelector selected={selectedRole} onChange={changeRole} />
          <Field label="Correo" value={email} onChangeText={(value) => { setEmail(value); setErrors({ ...errors, email: undefined, form: undefined }); }} placeholder="correo@universidad.edu.ec" keyboardType="email-address" error={errors.email} />
          <Field label="Contrasena" value={password} onChangeText={(value) => { setPassword(value); setErrors({ ...errors, password: undefined, form: undefined }); }} placeholder="Minimo 6 caracteres" error={errors.password} />
          {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

          <Pressable style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={signIn} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Conectando...' : `Entrar como ${roleLabels[selectedRole]}`}</Text>
            <ChevronRight size={20} color={COLORS.white} />
          </Pressable>
          <Text style={styles.demoHint}>Demo: cualquier rol usa contrasena 123456</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleSelector({ selected, onChange }: { selected: Role; onChange: (role: Role) => void }) {
  const options = [
    { role: 'teacher' as const, icon: <UserCheck size={18} color={selected === 'teacher' ? COLORS.white : COLORS.blue} /> },
    { role: 'student' as const, icon: <IdCard size={18} color={selected === 'student' ? COLORS.white : COLORS.blue} /> },
    { role: 'admin' as const, icon: <ShieldCheck size={18} color={selected === 'admin' ? COLORS.white : COLORS.blue} /> },
  ];
  return (
    <View style={styles.roleSelector}>
      {options.map(({ role, icon }) => (
        <Pressable key={role} style={[styles.roleOption, selected === role && styles.roleOptionActive]} onPress={() => onChange(role)}>
          {icon}
          <Text style={[styles.roleOptionText, selected === role && styles.roleOptionTextActive]}>{roleLabels[role]}</Text>
        </Pressable>
      ))}
    </View>
  );
}
