import { Pressable, Text, View } from 'react-native';
import {
  BarChart3,
  BookOpen,
  CalendarCheck2,
  ClipboardCheck,
  Home,
  IdCard,
  LayoutDashboard,
  LogOut,
  ListChecks,
  ShieldCheck,
  Users,
} from 'lucide-react-native';

import { COLORS } from '../theme';
import { styles } from '../styles';
import type { AdminTab, StudentTab, TeacherTab } from '../types';

type TabIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function TeacherTabBar({ active, bottomInset, onChange, onLogout }: { active: TeacherTab; bottomInset: number; onChange: (tab: TeacherTab) => void; onLogout: () => void }) {
  const tabs: { key: TeacherTab; label: string; icon: TabIcon }[] = [
    { key: 'home', label: 'Inicio', icon: Home },
    { key: 'attendance', label: 'Asistencia', icon: ClipboardCheck },
    { key: 'reports', label: 'Reportes', icon: BarChart3 },
  ];
  return <TabBar tabs={tabs} active={active} bottomInset={bottomInset} onChange={onChange} onLogout={onLogout} />;
}

export function StudentTabBar({ active, bottomInset, onChange, onLogout }: { active: StudentTab; bottomInset: number; onChange: (tab: StudentTab) => void; onLogout: () => void }) {
  const tabs: { key: StudentTab; label: string; icon: TabIcon }[] = [
    { key: 'studentHome', label: 'Inicio', icon: Home },
    { key: 'studentCalendar', label: 'Horario', icon: BookOpen },
    { key: 'studentHistory', label: 'Faltas', icon: CalendarCheck2 },
    { key: 'studentProfile', label: 'Perfil', icon: IdCard },
  ];
  return <TabBar tabs={tabs} active={active} bottomInset={bottomInset} onChange={onChange} onLogout={onLogout} />;
}

export function AdminTabBar({ active, bottomInset, onChange, onLogout }: { active: AdminTab; bottomInset: number; onChange: (tab: AdminTab) => void; onLogout: () => void }) {
  const tabs: { key: AdminTab; label: string; icon: TabIcon }[] = [
    { key: 'adminHome', label: 'Panel', icon: LayoutDashboard },
    { key: 'adminUsers', label: 'Usuarios', icon: ShieldCheck },
    { key: 'adminCourses', label: 'Materias', icon: BookOpen },
    { key: 'adminEnrollments', label: 'Asignar', icon: ListChecks },
    { key: 'adminReports', label: 'Reportes', icon: BarChart3 },
  ];
  return <TabBar tabs={tabs} active={active} bottomInset={bottomInset} onChange={onChange} onLogout={onLogout} />;
}

function TabBar<T extends string>({
  tabs,
  active,
  bottomInset,
  onChange,
  onLogout,
}: {
  tabs: { key: T; label: string; icon: TabIcon }[];
  active: T;
  bottomInset: number;
  onChange: (tab: T) => void;
  onLogout: () => void;
}) {
  return (
    <View style={[styles.tabBar, { paddingBottom: bottomInset + 8, minHeight: 69 + bottomInset }]}>
      {tabs.map(({ key, label, icon: Icon }) => (
        <Pressable key={key} style={styles.tabItem} onPress={() => onChange(key)}>
          <Icon size={21} color={active === key ? COLORS.blue : COLORS.muted} strokeWidth={active === key ? 2.6 : 2} />
          <Text style={[styles.tabLabel, active === key && styles.tabLabelActive]}>{label}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.tabItem} onPress={onLogout}>
        <LogOut size={21} color={COLORS.muted} />
        <Text style={styles.tabLabel}>Salir</Text>
      </Pressable>
    </View>
  );
}
