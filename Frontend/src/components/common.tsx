import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ChevronRight, Eye, EyeOff, Users } from 'lucide-react-native';

import { COLORS } from '../theme';
import { styles } from '../styles';
import type { AttendanceStatus, SessionRecord } from '../types';

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  secureTextEntry?: boolean;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, error && styles.fieldLabelError]}>{label}</Text>
      {isPassword ? (
        <View style={[styles.passwordInputWrap, error && styles.inputError]}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            keyboardType={keyboardType}
            secureTextEntry={!visible}
            autoCapitalize="none"
            style={styles.passwordInput}
          />
          <Pressable style={styles.passwordToggle} onPress={() => setVisible((current) => !current)}>
            {visible ? <EyeOff size={20} color={COLORS.muted} /> : <Eye size={20} color={COLORS.muted} />}
          </Pressable>
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          style={[styles.input, error && styles.inputError]}
        />
      )}
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

export function Header({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Users size={28} color={COLORS.muted} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function StatCard({ icon, value, label, tint }: { icon: ReactNode; value: string; label: string; tint: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function QuickRow({ icon, title, subtitle, onPress }: { icon: ReactNode; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickRow} onPress={onPress}>
      <View style={styles.quickIcon}>{icon}</View>
      <View style={styles.flex}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={COLORS.muted} />
    </Pressable>
  );
}

export function ReportMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.reportMetric}>
      <Text style={[styles.reportMetricValue, { color }]}>{value}</Text>
      <Text style={styles.reportMetricLabel}>{label}</Text>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function StatusPill({ status, onPress }: { status: AttendanceStatus; onPress?: () => void }) {
  const pillStyle = status === 'Presente' ? styles.presentPill : status === 'Tardanza' ? styles.latePill : status === 'Ausente' ? styles.absentPill : styles.pendingPill;
  const textStyle = status === 'Presente' ? styles.presentText : status === 'Tardanza' ? styles.lateText : status === 'Ausente' ? styles.absentText : styles.pendingText;
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.statusPill, pillStyle]}>
      <Text style={[styles.statusText, textStyle]}>{status}</Text>
    </Pressable>
  );
}

export function HistoryRow({ record }: { record: SessionRecord }) {
  return (
    <View style={styles.noticeRow}>
      <View style={[styles.noticeDot, { backgroundColor: record.status === 'Presente' ? COLORS.green : record.status === 'Tardanza' ? COLORS.amber : record.status === 'Ausente' ? COLORS.red : COLORS.muted }]} />
      <View style={styles.flex}>
        <Text style={styles.personName}>{record.course}</Text>
        <Text style={styles.personMeta}>{record.date} | {record.note}</Text>
      </View>
      <StatusPill status={record.status} />
    </View>
  );
}
