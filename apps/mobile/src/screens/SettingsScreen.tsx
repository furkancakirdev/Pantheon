/**
 * PANTHEON SETTINGS SCREEN
 * App configuration, API URL, refresh intervals
 * Based on Argus Terminal SettingsView
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '../constants/Theme';
import { GlassCard, SolidCard } from '../components/cards/GlassCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ SETTINGS ITEM ============
interface SettingsItemProps {
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  label,
  value,
  icon,
  onPress,
  rightElement,
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress} disabled={!onPress}>
    {icon && <Text style={styles.settingsIcon}>{icon}</Text>}
    <View style={styles.settingsItemMiddle}>
      <Text style={styles.settingsLabel}>{label}</Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
    </View>
    {rightElement || (onPress && <Text style={styles.settingsArrow}>›</Text>)}
  </TouchableOpacity>
);

// ============ SETTINGS SECTION ============
interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <View style={styles.settingsSection}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <GlassCard style={styles.settingsCard}>{children}</GlassCard>
  </View>
);

// ============ TOGGLE SWITCH ============
interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ value, onValueChange }) => (
  <TouchableOpacity
    style={[styles.toggle, value && styles.toggleActive]}
    onPress={() => onValueChange(!value)}
  >
    <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
  </TouchableOpacity>
);

// ============ REFRESH INTERVAL SELECTOR ============
interface RefreshIntervalSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const REFRESH_OPTIONS = [
  { label: 'Kapalı', value: 0 },
  { label: '15 Saniye', value: 15 },
  { label: '30 Saniye', value: 30 },
  { label: '1 Dakika', value: 60 },
  { label: '5 Dakika', value: 300 },
];

const RefreshIntervalSelector: React.FC<RefreshIntervalSelectorProps> = ({
  value,
  onChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.intervalContainer}>
      <TouchableOpacity
        style={styles.intervalHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.intervalLabel}>Yenileme Aralığı</Text>
        <View style={styles.intervalValue}>
          <Text style={styles.intervalText}>
            {REFRESH_OPTIONS.find((o) => o.value === value)?.label || '30 Saniye'}
          </Text>
          <Text style={styles.intervalArrow}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.intervalOptions}>
          {REFRESH_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.intervalOption,
                value === option.value && styles.intervalOptionActive,
              ]}
              onPress={() => {
                onChange(option.value);
                setExpanded(false);
              }}
            >
              <Text
                style={[
                  styles.intervalOptionText,
                  value === option.value && styles.intervalOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {value === option.value && (
                <Text style={styles.intervalCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ============ API URL EDITOR ============
interface ApiUrlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onTest: () => Promise<boolean>;
}

const ApiUrlEditor: React.FC<ApiUrlEditorProps> = ({ value, onChange, onTest }) => {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleSave = () => {
    onChange(tempValue);
    setEditing(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await onTest();
    setTestResult(result);
    setTesting(false);
    setTimeout(() => setTestResult(null), 3000);
  };

  if (editing) {
    return (
      <View style={styles.urlEditor}>
        <TextInput
          style={styles.urlInput}
          value={tempValue}
          onChangeText={setTempValue}
          placeholder="http://192.168.1.122:3000"
          placeholderTextColor={Theme.colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <View style={styles.urlActions}>
          <TouchableOpacity style={styles.urlButton} onPress={handleSave}>
            <Text style={styles.urlButtonText}>Kaydet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.urlButton, styles.urlButtonSecondary]}
            onPress={() => {
              setTempValue(value);
              setEditing(false);
            }}
          >
            <Text style={[styles.urlButtonText, styles.urlButtonTextSecondary]}>İptal</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.urlContainer}>
      <View style={styles.urlInfo}>
        <Text style={styles.urlLabel}>API URL</Text>
        <Text style={styles.urlValue}>{value}</Text>
      </View>

      <View style={styles.urlButtons}>
        <TouchableOpacity
          style={[styles.urlButton, styles.urlTestButton]}
          onPress={handleTest}
          disabled={testing}
        >
          <Text style={styles.urlButtonText}>
            {testing ? 'Test ediliyor...' : 'Test Et'}
          </Text>
        </TouchableOpacity>

        {testResult !== null && (
          <Text style={[styles.testResult, testResult ? styles.testSuccess : styles.testFail]}>
            {testResult ? '✓ Bağlantı başarılı' : '✗ Bağlantı hatası'}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.urlButton, styles.urlEditButton]}
          onPress={() => setEditing(true)}
        >
          <Text style={styles.urlButtonText}>Düzenle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============ MAIN SETTINGS SCREEN ============
export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Settings state
  const [apiUrl, setApiUrl] = useState('http://192.168.1.122:3000');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // Test API connection
  const testApiConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiUrl}/api/signals`);
      return response.ok;
    } catch {
      return false;
    }
  }, [apiUrl]);

  // Save settings
  const saveSettings = useCallback(async () => {
    // In a real app, this would save to AsyncStorage
    console.log('Saving settings:', { apiUrl, refreshInterval, notifications });
  }, [apiUrl, refreshInterval, notifications]);

  // Reset settings
  const handleReset = useCallback(() => {
    Alert.alert(
      'Ayarları Sıfırla',
      'Tüm ayarlar varsayılan değerlere dönecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            setApiUrl('http://192.168.1.122:3000');
            setRefreshInterval(30);
            setNotifications(true);
          },
        },
      ]
    );
  }, []);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Ayarlar</Text>
        <Text style={styles.headerSubtitle}>Uygulama yapılandırması</Text>
      </View>

      {/* API Section */}
      <SettingsSection title="API BAĞLANTISI">
        <ApiUrlEditor
          value={apiUrl}
          onChange={setApiUrl}
          onTest={testApiConnection}
        />
      </SettingsSection>

      {/* Refresh Section */}
      <SettingsSection title="VERİ YENİLEME">
        <RefreshIntervalSelector
          value={refreshInterval}
          onChange={setRefreshInterval}
        />
        <SettingsItem
          label="Otomatik Yenileme"
          value={refreshInterval > 0 ? 'Açık' : 'Kapalı'}
          icon="🔄"
        />
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection title="BİLDİRİMLER">
        <SettingsItem
          label="Push Bildirimleri"
          icon="🔔"
          rightElement={
            <Toggle value={notifications} onValueChange={setNotifications} />
          }
        />
        <SettingsItem
          label="Ses"
          icon="🔊"
          rightElement={
            <Toggle value={soundEnabled} onValueChange={setSoundEnabled} />
          }
        />
        <SettingsItem
          label="Haptic Geri Bildirim"
          icon="📳"
          rightElement={
            <Toggle value={hapticEnabled} onValueChange={setHapticEnabled} />
          }
        />
      </SettingsSection>

      {/* Display Section */}
      <SettingsSection title="GÖRÜNÜM">
        <SettingsItem
          label="Tema"
          value="Koyu (Varsayılan)"
          icon="🌙"
        />
        <SettingsItem
          label="Dil"
          value="Türkçe"
          icon="🌍"
        />
        <SettingsItem
          label="Para Birimi"
          value="₺ (TL)"
          icon="💱"
        />
      </SettingsSection>

      {/* Data Section */}
      <SettingsSection title="VERİ">
        <SettingsItem
          label="Önbelleği Temizle"
          icon="🗑️"
          onPress={() => Alert.alert('Önbellek Temizlendi', 'Tüm önbellek verileri silindi.')}
        />
        <SettingsItem
          label="Verileri Yenile"
          icon="🔄"
          onPress={() => Alert.alert('Veriler Yenilendi', 'Tüm veriler güncellendi.')}
        />
      </SettingsSection>

      {/* About Section */}
      <SettingsSection title="HAKKINDA">
        <SettingsItem
          label="Versiyon"
          value="1.0.0"
          icon="📱"
        />
        <SettingsItem
          label="Lisans"
          value="MIT"
          icon="⚖️"
        />
        <SettingsItem
          label="GitHub"
          value="pantheon-trading"
          icon="🔗"
          onPress={() => console.log('Open GitHub')}
        />
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="TEHLİKELİ BÖLGE">
        <SettingsItem
          label="Ayarları Sıfırla"
          icon="⚠️"
          onPress={handleReset}
        />
      </SettingsSection>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Ayarları Kaydet</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Pantheon Trading OS</Text>
        <Text style={styles.footerSubtext}>Powered by Grand Council AI</Text>
      </View>
    </ScrollView>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    paddingBottom: Theme.spacing.xLarge * 2,
  },
  header: {
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.xLarge,
  },
  headerTitle: {
    ...Theme.typography.h2,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  // Settings Section
  settingsSection: {
    marginBottom: Theme.spacing.large,
  },
  sectionTitle: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    gap: Theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  settingsIcon: {
    fontSize: 20,
  },
  settingsItemMiddle: {
    flex: 1,
    gap: 2,
  },
  settingsLabel: {
    ...Theme.typography.body,
    fontWeight: '500',
  },
  settingsValue: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
  },
  settingsArrow: {
    ...Theme.typography.h3,
    color: Theme.colors.textTertiary,
  },
  // Toggle
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.secondaryBackground,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: Theme.colors.accent,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.textTertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    backgroundColor: '#FFF',
    transform: [{ translateX: 20 }],
  },
  // Refresh Interval
  intervalContainer: {
    width: '100%',
  },
  intervalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.medium,
  },
  intervalLabel: {
    ...Theme.typography.body,
    fontWeight: '500',
  },
  intervalValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  intervalText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
  },
  intervalArrow: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  intervalOptions: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  intervalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.medium,
  },
  intervalOptionActive: {
    backgroundColor: `${Theme.colors.accent}10`,
  },
  intervalOptionText: {
    ...Theme.typography.body,
  },
  intervalOptionTextActive: {
    color: Theme.colors.accent,
    fontWeight: '600',
  },
  intervalCheck: {
    ...Theme.typography.body,
    color: Theme.colors.accent,
  },
  // API URL Editor
  urlEditor: {
    padding: Theme.spacing.medium,
    gap: Theme.spacing.small,
  },
  urlInput: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.small,
    padding: Theme.spacing.medium,
    color: Theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  urlActions: {
    flexDirection: 'row',
    gap: Theme.spacing.small,
  },
  urlButton: {
    flex: 1,
    paddingVertical: Theme.spacing.small,
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.small,
    alignItems: 'center',
  },
  urlButtonText: {
    ...Theme.typography.body,
    fontWeight: '600',
  },
  urlButtonSecondary: {
    backgroundColor: Theme.colors.secondaryBackground,
  },
  urlButtonTextSecondary: {
    color: Theme.colors.textSecondary,
  },
  urlContainer: {
    padding: Theme.spacing.medium,
    gap: Theme.spacing.small,
  },
  urlInfo: {
    gap: 4,
  },
  urlLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  urlValue: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  urlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  urlTestButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.positive}20`,
    borderRadius: Theme.radius.small,
    alignItems: 'center',
  },
  urlEditButton: {
    paddingVertical: 8,
    paddingHorizontal: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  testResult: {
    ...Theme.typography.captionSmall,
    fontWeight: '600',
  },
  testSuccess: {
    color: Theme.colors.positive,
  },
  testFail: {
    color: Theme.colors.negative,
  },
  // Save Button
  saveButtonContainer: {
    paddingHorizontal: Theme.spacing.medium,
    marginTop: Theme.spacing.medium,
  },
  saveButton: {
    paddingVertical: Theme.spacing.medium,
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.medium,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xLarge,
    gap: 4,
  },
  footerText: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  footerSubtext: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
});

export default SettingsScreen;
