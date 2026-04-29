import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { DateField, Field, FormSheet, PrimaryButton, SelectField, StateView } from '@/src/shared/components';
import { buildAssetUrl, uploadImage } from '@/src/shared/api';
import { spacing } from '@/src/shared/theme';
import { styles } from '../_shared/styles';
import { Item, ScreenShell, SectionCard, Tag, confirmRemove, today, useItems } from '../_shared/ReplicatedScreens';
import { createFootprint, deleteFootprint, listFootprints, updateFootprint } from './api';

const ratingOptions = [1, 2, 3, 4, 5].map((value) => ({ label: `${value}星`, value: String(value) }));

export function FootprintScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>(listFootprints);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [form, setForm] = useState({ location: '', coordinate: '', visit_date: today(), notes: '', rating: '5', image_url: '' });
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要权限', '请允许访问相册后再上传图片。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const uploaded = await uploadImage(result.assets[0].uri);
      setForm((cur) => ({ ...cur, image_url: uploaded.url }));
    } finally {
      setUploading(false);
    }
  };

  const closeSheet = () => {
    setSelected(null);
    bottomSheetRef.current?.dismiss();
  };

  const open = (item?: Item) => {
    setSelected(item || null);
    setForm({
      location: item?.location || '',
      coordinate: item?.coordinate || '',
      visit_date: item?.visit_date || today(),
      notes: item?.notes || '',
      rating: String(item?.rating || 5),
      image_url: item?.image_url || '',
    });
    bottomSheetRef.current?.present();
  };

  const save = async () => {
    if (!form.location.trim()) return;
    const payload = {
      location: form.location.trim(),
      coordinate: form.coordinate.trim() || null,
      visit_date: form.visit_date,
      notes: form.notes.trim() || null,
      rating: Number(form.rating),
      image_url: form.image_url || null,
    };
    if (selected) await updateFootprint(selected.id, payload);
    else await createFootprint(payload);
    closeSheet();
    await load();
  };

  const remove = async () => {
    if (!selected) return;
    confirmRemove(selected.location, async () => {
      await deleteFootprint(selected.id);
      closeSheet();
      await load();
    });
  };

  return (
    <ScreenShell title="足迹" subtitle={`${items.length} 个去过的地方`} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <StateView loading={loading} error={error} onRetry={load} />
        {items.map((item) => {
          const expanded = Boolean(expandedIds[item.id]);
          return (
            <Pressable
              key={item.id}
              onPress={() => setExpandedIds((current) => ({ ...current, [item.id]: !current[item.id] }))}
              onLongPress={() => open(item)}
              delayLongPress={350}
            >
              <SectionCard>
                <View style={styles.rowTop}>
                  <View style={styles.flex}>
                    <View style={styles.rowWrap}>
                      <Text style={styles.itemTitle}>{item.location}</Text>
                      {item.coordinate ? <Tag label={`📍 ${item.coordinate}`} tone="blue" /> : null}
                    </View>
                    <Text style={styles.metaText}>{item.visit_date} · {'⭐'.repeat(Number(item.rating || 0))}</Text>
                    {item.image_url ? <Pressable onPress={() => setFullImage(buildAssetUrl(item.image_url))}><Image source={{ uri: buildAssetUrl(item.image_url) || '' }} style={styles.footprintImage} /></Pressable> : null}
                    {item.notes && expanded ? <Text style={styles.bodyText}>{item.notes}</Text> : null}
                  </View>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
                </View>
              </SectionCard>
            </Pressable>
          );
        })}
      </ScrollView>
      <EditFootprintModal bottomSheetRef={bottomSheetRef} selected={selected} form={form} setForm={setForm} uploading={uploading} pickImage={pickImage} save={save} remove={remove} onClose={closeSheet} />
      <Modal visible={!!fullImage} transparent animationType="fade" onRequestClose={() => setFullImage(null)}>
        <Pressable style={styles.fullImageBackdrop} onPress={() => setFullImage(null)}>
          {fullImage ? <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>

      <Pressable style={styles.fab} onPress={() => open()}>
        <LinearGradient colors={['#10B981', '#047857']} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>
    </ScreenShell>
  );
}

function EditFootprintModal({ bottomSheetRef, selected, form, setForm, uploading, pickImage, save, remove, onClose }: any) {
  return (
    <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
      <Text style={styles.sheetTitle}>{selected ? '编辑足迹' : '记录新足迹'}</Text>
      <View style={{ height: spacing.lg }} />
      <Field label="地点" value={form.location} placeholder="例如：故宫博物院" onChangeText={(value) => setForm((cur: any) => ({ ...cur, location: value }))} />
      <Field label="城市 / 坐标" value={form.coordinate} placeholder="例如：北京" onChangeText={(value) => setForm((cur: any) => ({ ...cur, coordinate: value }))} />
      <DateField label="日期" value={form.visit_date} onChangeText={(value) => setForm((cur: any) => ({ ...cur, visit_date: value }))} />
      <SelectField label="推荐等级" value={form.rating} options={ratingOptions} onChange={(value) => setForm((cur: any) => ({ ...cur, rating: value }))} />
      <Field label="记录见闻" value={form.notes} multiline onChangeText={(value) => setForm((cur: any) => ({ ...cur, notes: value }))} />
      {form.image_url ? <Image source={{ uri: buildAssetUrl(form.image_url) || form.image_url }} style={styles.previewImage} /> : null}
      <PrimaryButton label={uploading ? '上传中' : '选择照片'} icon="image-outline" tone="plain" onPress={pickImage} />
      <View style={styles.formActions}>
        {selected ? <PrimaryButton label="删除" tone="danger" onPress={() => void remove()} /> : null}
        <PrimaryButton label="取消" tone="plain" onPress={onClose} />
        <View style={{ flex: 1 }}>
          <PrimaryButton label="保存足迹" icon="checkmark" disabled={!form.location.trim()} onPress={() => void save()} />
        </View>
      </View>
    </FormSheet>
  );
}
