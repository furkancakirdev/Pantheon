/**
 * PANTHEON WATCHLIST SCREEN
 * İzleme listesi ekranı - Favori hisseler, hedef fiyatlar, alarmlar
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '../constants/Theme';
import { GlassCard } from '../components/cards/GlassCard';

// ============ TYPES ============
interface Watchlist {
  id: string;
  isim: string;
  aciklama?: string;
  ogeler?: WatchlistItem[];
  createdAt: string;
}

interface WatchlistItem {
  id: string;
  hisseKod: string;
  hisseAd?: string;
  hedefFiyat?: number;
  alarmFiyat?: number;
  notlar?: string;
  eklenmeTarihi: string;
}

// ============ WATCHLIST ITEM CARD ============
interface WatchlistItemCardProps {
  item: WatchlistItem;
  onRemove?: () => void;
}

const WatchlistItemCard: React.FC<WatchlistItemCardProps> = ({ item, onRemove }) => (
  <GlassCard style={styles.itemCard}>
    <View style={styles.itemHeader}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemSymbol}>{item.hisseKod}</Text>
        {item.hisseAd && <Text style={styles.itemName}>{item.hisseAd}</Text>}
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.itemDetails}>
      {item.hedefFiyat && (
        <View style={styles.itemDetailRow}>
          <Text style={styles.itemDetailLabel}>Hedef Fiyat</Text>
          <Text style={styles.itemDetailValue}>{item.hedefFiyat.toFixed(2)} ₺</Text>
        </View>
      )}
      {item.alarmFiyat && (
        <View style={styles.itemDetailRow}>
          <Text style={styles.itemDetailLabel}>Alarm Fiyat</Text>
          <Text style={[styles.itemDetailValue, styles.alarmPrice]}>
            {item.alarmFiyat.toFixed(2)} ₺
          </Text>
        </View>
      )}
      {item.notlar && (
        <View style={styles.itemNotes}>
          <Text style={styles.itemNotesLabel}>Notlar:</Text>
          <Text style={styles.itemNotesText}>{item.notlar}</Text>
        </View>
      )}
    </View>
  </GlassCard>
);

// ============ ADD ITEM MODAL ============
interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: AddItemData) => void;
}

interface AddItemData {
  hisseKod: string;
  hisseAd: string;
  hedefFiyat: string;
  alarmFiyat: string;
  notlar: string;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ visible, onClose, onAdd }) => {
  const [hisseKod, setHesseKod] = useState('');
  const [hisseAd, setHesseAd] = useState('');
  const [hedefFiyat, setHedefFiyat] = useState('');
  const [alarmFiyat, setAlarmFiyat] = useState('');
  const [notlar, setNotlar] = useState('');

  const handleAdd = () => {
    if (!hisseKod) {
      Alert.alert('Eksik Bilgi', 'Hisse kodu zorunludur');
      return;
    }
    onAdd({ hisseKod, hisseAd, hedefFiyat, alarmFiyat, notlar });
    // Reset
    setHesseKod('');
    setHesseAd('');
    setHedefFiyat('');
    setAlarmFiyat('');
    setNotlar('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.modalContent}>
          <Text style={styles.modalTitle}>Hisse Ekle</Text>

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
              <Text style={styles.inputLabel}>Hedef Fiyat (₺)</Text>
              <TextInput
                style={styles.input}
                value={hedefFiyat}
                onChangeText={setHedefFiyat}
                placeholder="300.00"
                placeholderTextColor={Theme.colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Alarm Fiyat (₺)</Text>
              <TextInput
                style={styles.input}
                value={alarmFiyat}
                onChangeText={setAlarmFiyat}
                placeholder="280.00"
                placeholderTextColor={Theme.colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notlar</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notlar}
              onChangeText={setNotlar}
              placeholder="Analiz notlarınız..."
              placeholderTextColor={Theme.colors.textTertiary}
              multiline
              numberOfLines={3}
            />
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

// ============ CREATE WATCHLIST MODAL ============
interface CreateWatchlistModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (isim: string, aciklama: string) => void;
}

const CreateWatchlistModal: React.FC<CreateWatchlistModalProps> = ({ visible, onClose, onCreate }) => {
  const [isim, setIsim] = useState('');
  const [aciklama, setAciklama] = useState('');

  const handleCreate = () => {
    if (!isim) {
      Alert.alert('Eksik Bilgi', 'Liste adı zorunludur');
      return;
    }
    onCreate(isim, aciklama);
    setIsim('');
    setAciklama('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.modalContent}>
          <Text style={styles.modalTitle}>Yeni İzleme Listesi</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Liste Adı *</Text>
            <TextInput
              style={styles.input}
              value={isim}
              onChangeText={setIsim}
              placeholder="Favoriler"
              placeholderTextColor={Theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Açıklama</Text>
            <TextInput
              style={styles.input}
              value={aciklama}
              onChangeText={setAciklama}
              placeholder="İlgi duyduğum hisseler"
              placeholderTextColor={Theme.colors.textTertiary}
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

// ============ MAIN WATCHLIST SCREEN ============
export const WatchlistScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedList, setSelectedList] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Fetch watchlists
  const fetchWatchlists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://192.168.1.122:3000/api/watchlist');
      if (!response.ok) {
        throw new Error('İzleme listesi verisi alınamadı');
      }
      const json = await response.json();
      if (json.success) {
        setWatchlists(json.data);
        if (json.data.length > 0 && !selectedList) {
          setSelectedList(json.data[0]);
        }
      } else {
        throw new Error(json.error || 'Bilinmeyen hata');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      console.error('Watchlist fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedList]);

  // Create watchlist
  const createWatchlist = useCallback(async (isim: string, aciklama: string) => {
    try {
      const response = await fetch('http://192.168.1.122:3000/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isim, aciklama }),
      });
      const json = await response.json();
      if (json.success) {
        await fetchWatchlists();
        setCreateModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Hata', 'İzleme listesi oluşturulamadı');
    }
  }, [fetchWatchlists]);

  // Add item
  const addItem = useCallback(async (data: AddItemData) => {
    if (!selectedList) return;

    try {
      const response = await fetch(`http://192.168.1.122:3000/api/watchlist/${selectedList.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hisseKod: data.hisseKod,
          hisseAd: data.hisseAd,
          hedefFiyat: data.hedefFiyat ? parseFloat(data.hedefFiyat) : undefined,
          alarmFiyat: data.alarmFiyat ? parseFloat(data.alarmFiyat) : undefined,
          notlar: data.notlar || undefined,
        }),
      });
      const json = await response.json();
      if (json.success) {
        await fetchWatchlists();
        setAddItemModalVisible(false);
      } else {
        Alert.alert('Hata', json.error || 'Hisse eklenemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Hisse eklenemedi');
    }
  }, [selectedList, fetchWatchlists]);

  // Remove item
  const removeItem = useCallback(async (itemId: string) => {
    try {
      await fetch(`http://192.168.1.122:3000/api/watchlist/item/${itemId}`, {
        method: 'DELETE',
      });
      await fetchWatchlists();
    } catch (error) {
      Alert.alert('Hata', 'Hisse çıkarılamadı');
    }
  }, [fetchWatchlists]);

  // Initial fetch
  React.useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

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
          <TouchableOpacity style={styles.retryButton} onPress={fetchWatchlists}>
            <Text style={styles.retryButtonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (watchlists.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⭐ İzleme Listesi</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.createButtonText}>+ Yeni Liste</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Henüz Listeniz Yok</Text>
          <Text style={styles.emptyText}>Hisse takibi için izleme listesi oluşturun.</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.primaryButtonText}>+ Liste Oluştur</Text>
          </TouchableOpacity>
        </View>

        <CreateWatchlistModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onCreate={createWatchlist}
        />
      </View>
    );
  }

  const items = selectedList?.ogeler || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⭐ İzleme Listesi</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddItemModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Hisse Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Watchlist Selector */}
      <View style={styles.listSelector}>
        <Text style={styles.selectorLabel}>Liste:</Text>
        <FlatList
          horizontal
          data={watchlists}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.listChip,
                selectedList?.id === item.id && styles.listChipActive,
              ]}
              onPress={() => setSelectedList(item)}
            >
              <Text
                style={[
                  styles.listChipText,
                  selectedList?.id === item.id && styles.listChipTextActive,
                ]}
              >
                {item.isim}
              </Text>
              <Text style={styles.itemCount}>
                ({item.ogeler?.length || 0})
              </Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity
          style={styles.newListButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.newListButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Items */}
      {items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchWatchlists} />
          }
          renderItem={({ item }) => (
            <WatchlistItemCard
              item={item}
              onRemove={() => {
                Alert.alert(
                  'Hisseyi Çıkar',
                  `${item.hisseKod} listesinden çıkarılsın mı?`,
                  [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Çıkar', style: 'destructive', onPress: () => removeItem(item.id) },
                  ]
                );
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyItems}>
          <Text style={styles.emptyItemsText}>Bu liste boş</Text>
          <Text style={styles.emptyItemsSubtext}>Hisse eklemek için + Hisse Ekle butonuna dokunun</Text>
        </View>
      )}

      <AddItemModal
        visible={addItemModalVisible}
        onClose={() => setAddItemModalVisible(false)}
        onAdd={addItem}
      />

      <CreateWatchlistModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={createWatchlist}
      />
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
  listSelector: {
    paddingHorizontal: Theme.spacing.medium,
    marginBottom: Theme.spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    marginRight: Theme.spacing.small,
  },
  listChip: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.small,
    borderRadius: Theme.radius.small,
    backgroundColor: Theme.colors.secondaryBackground,
    marginRight: Theme.spacing.small,
    alignItems: 'center',
  },
  listChipActive: {
    backgroundColor: Theme.colors.accent,
  },
  listChipText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  listChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  itemCount: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    marginLeft: Theme.spacing.xSmall,
  },
  newListButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.secondaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Theme.spacing.small,
  },
  newListButtonText: {
    ...Theme.typography.h3,
    color: Theme.colors.accent,
  },
  listContent: {
    padding: Theme.spacing.medium,
    paddingBottom: Theme.spacing.xLarge * 2,
  },
  itemCard: {
    marginBottom: Theme.spacing.small,
    padding: Theme.spacing.medium,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.small,
  },
  itemInfo: {
    flex: 1,
  },
  itemSymbol: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  itemName: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.negative + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: Theme.colors.negative,
    fontSize: 16,
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: Theme.spacing.small,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xSmall,
  },
  itemDetailLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  itemDetailValue: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  alarmPrice: {
    color: Theme.colors.warning,
    fontWeight: '600',
  },
  itemNotes: {
    marginTop: Theme.spacing.small,
    padding: Theme.spacing.small,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
  },
  itemNotesLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    marginBottom: Theme.spacing.xSmall,
  },
  itemNotesText: {
    ...Theme.typography.bodySmall,
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
  primaryButton: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: Theme.spacing.xLarge,
    paddingVertical: Theme.spacing.medium,
    borderRadius: Theme.radius.medium,
  },
  primaryButtonText: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyItems: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xLarge,
  },
  emptyItemsText: {
    ...Theme.typography.h3,
    color: Theme.colors.textTertiary,
    marginBottom: Theme.spacing.small,
  },
  emptyItemsSubtext: {
    ...Theme.typography.body,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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

export default WatchlistScreen;
