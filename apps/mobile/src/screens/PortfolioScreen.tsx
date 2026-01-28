/**
 * PANTHEON PORTFOLIO SCREEN
 * Portföy takip ekranı - Kar/zarar, pozisyonlar, işlem geçmişi
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '../constants/Theme';
import { GlassCard, SolidCard } from '../components/cards/GlassCard';

// ============ TYPES ============
interface Portfolio {
  id: string;
  isim: string;
  aciklama?: string;
  bakiye: number;
  durum: string;
  ozet?: {
    toplamMaliyet: number;
    toplamDeger: number;
    karZarar: number;
    karZararYuzde: number;
    pozisyonSayisi: number;
  };
  pozisyonlar?: Position[];
}

interface Position {
  id: string;
  hisseKod: string;
  hisseAd?: string;
  adet: number;
  alimFiyati: number;
  toplamMaliyet: number;
  guncelFiyat?: number;
  guncelDeger?: number;
  karZarar?: number;
  karZararYuzde?: number;
}

// ============ SUMMARY CARD ============
interface SummaryCardProps {
  label: string;
  value: string;
  valueColor?: string;
  icon?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, valueColor, icon }) => (
  <GlassCard style={styles.summaryCard}>
    {icon && <Text style={styles.summaryIcon}>{icon}</Text>}
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, valueColor && { color: valueColor }]}>{value}</Text>
  </GlassCard>
);

// ============ POSITION ITEM ============
interface PositionItemProps {
  position: Position;
  onPress?: () => void;
}

const PositionItem: React.FC<PositionItemProps> = ({ position, onPress }) => {
  const isPositive = (position.karZararYuzde || 0) >= 0;

  return (
    <GlassCard style={styles.positionItem} onPress={onPress}>
      <View style={styles.positionHeader}>
        <View>
          <Text style={styles.positionSymbol}>{position.hisseKod}</Text>
          <Text style={styles.positionName}>{position.hisseAd || position.hisseKod}</Text>
        </View>
        <Text style={[styles.positionProfit, isPositive && styles.profitPositive]}>
          {isPositive ? '+' : ''}{(position.karZararYuzde || 0).toFixed(2)}%
        </Text>
      </View>

      <View style={styles.positionDetails}>
        <View style={styles.positionDetailRow}>
          <Text style={styles.positionDetailLabel}>Adet</Text>
          <Text style={styles.positionDetailValue}>{position.adet}</Text>
        </View>
        <View style={styles.positionDetailRow}>
          <Text style={styles.positionDetailLabel}>Alış</Text>
          <Text style={styles.positionDetailValue}>{position.alimFiyati.toFixed(2)} ₺</Text>
        </View>
        <View style={styles.positionDetailRow}>
          <Text style={styles.positionDetailLabel}>Maliyet</Text>
          <Text style={styles.positionDetailValue}>{position.toplamMaliyet.toFixed(2)} ₺</Text>
        </View>
        <View style={styles.positionDetailRow}>
          <Text style={styles.positionDetailLabel}>Değer</Text>
          <Text style={[styles.positionDetailValue, { color: Theme.colors.accent }]}>
            {(position.guncelDeger || 0).toFixed(2)} ₺
          </Text>
        </View>
      </View>

      <View style={styles.positionProfitRow}>
        <Text style={styles.positionProfitLabel}>
          Kar/Zarar: {(position.karZarar || 0).toFixed(2)} ₺
        </Text>
      </View>
    </GlassCard>
  );
};

// ============ ADD POSITION MODAL ============
interface AddPositionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: AddPositionData) => void;
}

interface AddPositionData {
  hisseKod: string;
  hisseAd: string;
  adet: string;
  alimFiyati: string;
}

const AddPositionModal: React.FC<AddPositionModalProps> = ({ visible, onClose, onAdd }) => {
  const [hisseKod, setHisseKod] = useState('');
  const [hisseAd, setHisseAd] = useState('');
  const [adet, setAdet] = useState('');
  const [alimFiyati, setAlimFiyati] = useState('');

  const handleAdd = () => {
    if (!hisseKod || !adet || !alimFiyati) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun');
      return;
    }
    onAdd({ hisseKod, hisseAd, adet, alimFiyati });
    // Reset
    setHesseKod('');
    setHesseAd('');
    setAdet('');
    setAlimFiyati('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.modalContent}>
          <Text style={styles.modalTitle}>Pozisyon Ekle</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hisse Kodu *</Text>
            <TextInput
              style={styles.input}
              value={hisseKod}
              onChangeText={setHesseKod}
              placeholder="THYAO"
              placeholderTextColor={Theme.colors.textTertiary}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hisse Adı</Text>
            <TextInput
              style={styles.input}
              value={hisseAd}
              onChangeText={setHesseAd}
              placeholder="Türk Hava Yolları"
              placeholderTextColor={Theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Adet *</Text>
              <TextInput
                style={styles.input}
                value={adet}
                onChangeText={setAdet}
                placeholder="100"
                placeholderTextColor={Theme.colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Alış Fiyatı *</Text>
              <TextInput
                style={styles.input}
                value={alimFiyati}
                onChangeText={setAlimFiyati}
                placeholder="250.50"
                placeholderTextColor={Theme.colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onClose}>
              <Text style={styles.modalButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonAdd]} onPress={handleAdd}>
              <Text style={styles.modalButtonText}>Ekle</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
};

// ============ MAIN PORTFOLIO SCREEN ============
export const PortfolioScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Fetch portfolios
  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://192.168.1.122:3000/api/portfolio');
      if (!response.ok) {
        throw new Error('Portföy verisi alınamadı');
      }
      const json = await response.json();
      if (json.success) {
        setPortfolios(json.data);
        if (json.data.length > 0 && !selectedPortfolio) {
          setSelectedPortfolio(json.data[0]);
        }
      } else {
        throw new Error(json.error || 'Bilinmeyen hata');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPortfolio]);

  // Create portfolio
  const createPortfolio = useCallback(async (isim: string, aciklama: string, bakiye: string) => {
    try {
      const response = await fetch('http://192.168.1.122:3000/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isim, aciklama, bakiye: parseFloat(bakiye) || 0 }),
      });
      const json = await response.json();
      if (json.success) {
        await fetchPortfolios();
        setCreateModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Hata', 'Portföy oluşturulamadı');
    }
  }, [fetchPortfolios]);

  // Add position
  const addPosition = useCallback(async (data: AddPositionData) => {
    if (!selectedPortfolio) return;

    try {
      const response = await fetch(`http://192.168.1.122:3000/api/portfolio/${selectedPortfolio.id}/position`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hisseKod: data.hisseKod,
          hisseAd: data.hisseAd,
          adet: parseFloat(data.adet),
          alimFiyati: parseFloat(data.alimFiyati),
        }),
      });
      const json = await response.json();
      if (json.success) {
        await fetchPortfolios();
        setAddModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Hata', 'Pozisyon eklenemedi');
    }
  }, [selectedPortfolio, fetchPortfolios]);

  // Initial fetch
  React.useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Hata</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPortfolios}>
            <Text style={styles.retryButtonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (portfolios.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💼 Portföy</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Henüz Portföyünüz Yok</Text>
          <Text style={styles.emptyText}>Yatırım takibi için portföy oluşturun.</Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.createButtonText}>+ Portföy Oluştur</Text>
          </TouchableOpacity>
        </View>

        <CreatePortfolioModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onCreate={createPortfolio}
        />
      </View>
    );
  }

  const ozet = selectedPortfolio?.ozet;
  const isProfit = (ozet?.karZararYuzde || 0) >= 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPortfolios} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💼 Portföy</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Pozisyon</Text>
          </TouchableOpacity>
        </View>

        {/* Portfolio Selector */}
        <View style={styles.portfolioSelector}>
          <Text style={styles.selectorLabel}>Portföy:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
            {portfolios.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.portfolioChip,
                  selectedPortfolio?.id === p.id && styles.portfolioChipActive,
                ]}
                onPress={() => setSelectedPortfolio(p)}
              >
                <Text
                  style={[
                    styles.portfolioChipText,
                    selectedPortfolio?.id === p.id && styles.portfolioChipTextActive,
                  ]}
                >
                  {p.isim}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Summary Cards */}
        {ozet && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Özet</Text>
            <View style={styles.summaryGrid}>
              <SummaryCard
                label="Toplam Değer"
                value={`${ozet.toplamDeger.toFixed(2)} ₺`}
                icon="💰"
              />
              <SummaryCard
                label="Toplam Maliyet"
                value={`${ozet.toplamMaliyet.toFixed(2)} ₺`}
                icon="📦"
              />
              <SummaryCard
                label="Kar/Zarar"
                value={`${ozet.karZarar.toFixed(2)} ₺`}
                valueColor={isProfit ? Theme.colors.positive : Theme.colors.negative}
                icon={isProfit ? '📈' : '📉'}
              />
              <SummaryCard
                label="Getiri"
                value={`%${ozet.karZararYuzde.toFixed(2)}`}
                valueColor={isProfit ? Theme.colors.positive : Theme.colors.negative}
              />
            </View>
          </View>
        )}

        {/* Positions */}
        <View style={styles.positionsSection}>
          <Text style={styles.sectionTitle}>
            Pozisyonlar ({selectedPortfolio?.ozet?.pozisyonSayisi || 0})
          </Text>

          {selectedPortfolio?.pozisyonlar && selectedPortfolio.pozisyonlar.length > 0 ? (
            selectedPortfolio.pozisyonlar.map((position) => (
              <PositionItem key={position.id} position={position} />
            ))
          ) : (
            <View style={styles.emptyPositions}>
              <Text style={styles.emptyPositionsText}>Henüz pozisyon yok</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AddPositionModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={addPosition}
      />

      <CreatePortfolioModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={createPortfolio}
      />
    </View>
  );
};

// ============ CREATE PORTFOLIO MODAL ============
interface CreatePortfolioModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (isim: string, aciklama: string, bakiye: string) => void;
}

const CreatePortfolioModal: React.FC<CreatePortfolioModalProps> = ({ visible, onClose, onCreate }) => {
  const [isim, setIsim] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [bakiye, setBakiye] = useState('');

  const handleCreate = () => {
    if (!isim) {
      Alert.alert('Eksik Bilgi', 'Portföy adı zorunludur');
      return;
    }
    onCreate(isim, aciklama, bakiye);
    setIsim('');
    setAciklama('');
    setBakiye('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.modalContent}>
          <Text style={styles.modalTitle}>Yeni Portföy</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Portföy Adı *</Text>
            <TextInput
              style={styles.input}
              value={isim}
              onChangeText={setIsim}
              placeholder="Ana Portföy"
              placeholderTextColor={Theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Açıklama</Text>
            <TextInput
              style={styles.input}
              value={aciklama}
              onChangeText={setAciklama}
              placeholder="BIST 100 hisseleri"
              placeholderTextColor={Theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Başlangıç Bakiyesi (₺)</Text>
            <TextInput
              style={styles.input}
              value={bakiye}
              onChangeText={setBakiye}
              placeholder="100000"
              placeholderTextColor={Theme.colors.textTertiary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onClose}>
              <Text style={styles.modalButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonAdd]} onPress={handleCreate}>
              <Text style={styles.modalButtonText}>Oluştur</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.xLarge * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.large,
  },
  headerTitle: {
    ...Theme.typography.h2,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.small,
    borderRadius: Theme.radius.small,
  },
  addButtonText: {
    ...Theme.typography.body,
    fontWeight: '600',
    color: '#FFF',
  },
  portfolioSelector: {
    paddingHorizontal: Theme.spacing.medium,
    marginBottom: Theme.spacing.medium,
  },
  selectorLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    marginBottom: Theme.spacing.small,
  },
  portfolioScroll: {
    flexDirection: 'row',
  },
  portfolioChip: {
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.small,
    borderRadius: Theme.radius.small,
    backgroundColor: Theme.colors.secondaryBackground,
    marginRight: Theme.spacing.small,
  },
  portfolioChipActive: {
    backgroundColor: Theme.colors.accent,
  },
  portfolioChipText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  portfolioChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  summarySection: {
    marginBottom: Theme.spacing.large,
  },
  sectionTitle: {
    ...Theme.typography.h3,
    fontWeight: '600',
    paddingHorizontal: Theme.spacing.medium,
    marginBottom: Theme.spacing.small,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Theme.spacing.small,
  },
  summaryCard: {
    width: '48%',
    margin: Theme.spacing.small,
    padding: Theme.spacing.medium,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: Theme.spacing.xSmall,
  },
  summaryLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    marginBottom: Theme.spacing.xSmall,
  },
  summaryValue: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  positionsSection: {
    marginBottom: Theme.spacing.xLarge * 2,
  },
  positionItem: {
    marginHorizontal: Theme.spacing.medium,
    marginBottom: Theme.spacing.small,
    padding: Theme.spacing.medium,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.small,
  },
  positionSymbol: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  positionName: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
  },
  positionProfit: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  profitPositive: {
    color: Theme.colors.positive,
  },
  positionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Theme.spacing.small,
  },
  positionDetailRow: {
    width: '50%',
    marginBottom: Theme.spacing.xSmall,
  },
  positionDetailLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  positionDetailValue: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
  },
  positionProfitRow: {
    paddingTop: Theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  positionProfitLabel: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xLarge,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.large,
  },
  emptyTitle: {
    ...Theme.typography.h3,
    fontWeight: '700',
    marginBottom: Theme.spacing.small,
  },
  emptyText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xLarge,
  },
  emptyPositions: {
    padding: Theme.spacing.xLarge,
    alignItems: 'center',
  },
  emptyPositionsText: {
    ...Theme.typography.body,
    color: Theme.colors.textTertiary,
  },
  createButton: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: Theme.spacing.xLarge,
    paddingVertical: Theme.spacing.medium,
    borderRadius: Theme.radius.medium,
  },
  createButtonText: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: '#FFF',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    margin: Theme.spacing.medium,
    marginBottom: Theme.spacing.xLarge,
    padding: Theme.spacing.large,
    borderTopLeftRadius: Theme.radius.large,
    borderTopRightRadius: Theme.radius.large,
  },
  modalTitle: {
    ...Theme.typography.h3,
    fontWeight: '700',
    marginBottom: Theme.spacing.large,
  },
  inputGroup: {
    marginBottom: Theme.spacing.medium,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  inputLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    marginBottom: Theme.spacing.xSmall,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.small,
    padding: Theme.spacing.medium,
    color: Theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.typography.body,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.large,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Theme.spacing.medium,
    borderRadius: Theme.radius.small,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Theme.colors.secondaryBackground,
    marginRight: Theme.spacing.small,
  },
  modalButtonAdd: {
    backgroundColor: Theme.colors.accent,
    marginLeft: Theme.spacing.small,
  },
  modalButtonText: {
    ...Theme.typography.body,
    fontWeight: '600',
  },
  // Error Container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xLarge,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.large,
  },
  errorTitle: {
    ...Theme.typography.h3,
    fontWeight: '700',
    marginBottom: Theme.spacing.small,
  },
  errorText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xLarge,
  },
  retryButton: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: Theme.spacing.xLarge,
    paddingVertical: Theme.spacing.medium,
    borderRadius: Theme.radius.medium,
  },
  retryButtonText: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default PortfolioScreen;
