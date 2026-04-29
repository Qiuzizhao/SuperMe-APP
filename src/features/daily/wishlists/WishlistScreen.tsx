import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Field, FormSheet, PrimaryButton, SegmentedControl, StateView } from '@/src/shared/components';
import { spacing } from '@/src/shared/theme';
import { styles } from '../_shared/styles';
import { Item, ScreenShell, SectionCard, Tag, confirmRemove, useItems } from '../_shared/ReplicatedScreens';
import { createWishlist, deleteWishlist, listWishlists, updateWishlist } from './api';

export function WishlistScreen({ onBack }: { onBack: () => void }) {
  const { items: allItems, loading, refreshing, setRefreshing, error, load } = useItems<Item>(listWishlists);
  const [category, setCategory] = useState('shopping');
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [activeTag, setActiveTag] = useState('all');
  const [selected, setSelected] = useState<Item | null>(null);
  const [form, setForm] = useState({ title: '', location: '', custom_tags: '', description: '' });
  const items = allItems.filter((item) => item.category === category);
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => {
      if (item.location && category === 'travel') tags.add(item.location);
      String(item.custom_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean).forEach((tag) => tags.add(tag));
    });
    return [...tags].sort();
  }, [items, category]);
  const filtered = activeTag === 'all' ? items : items.filter((item) => (category === 'travel' && item.location === activeTag) || String(item.custom_tags || '').split(',').map((tag) => tag.trim()).includes(activeTag));

  const add = async () => {
    if (!form.title.trim()) return;
    await createWishlist({ title: form.title.trim(), location: form.location.trim() || null, custom_tags: form.custom_tags.trim() || null, description: form.description.trim() || null, category, is_fulfilled: false });
    setForm({ title: '', location: '', custom_tags: '', description: '' });
    bottomSheetRef.current?.dismiss();
    await load();
  };
  const select = (item: Item) => {
    setSelected(item);
    setForm({ title: item.title || '', location: item.location || '', custom_tags: item.custom_tags || '', description: item.description || '' });
    bottomSheetRef.current?.present();
  };
  const save = async () => {
    if (!selected) return;
    await updateWishlist(selected.id, { title: form.title.trim(), location: form.location.trim() || null, custom_tags: form.custom_tags.trim() || null, description: form.description.trim() || null });
    bottomSheetRef.current?.dismiss();
    await load();
  };
  const remove = async () => {
    if (!selected) return;
    confirmRemove(selected.title, async () => {
      await deleteWishlist(selected.id);
      setSelected(null);
      bottomSheetRef.current?.dismiss();
      await load();
    });
  };

  return (
    <ScreenShell title="愿望" subtitle="购物愿望和旅行愿望" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <SegmentedControl value={category} onChange={(value) => { setCategory(value); setActiveTag('all'); setSelected(null); }} options={[{ label: '购物愿望单', value: 'shopping' }, { label: '旅行愿望单', value: 'travel' }]} />
        <View style={styles.pills}>
          <Pressable onPress={() => setActiveTag('all')} style={[styles.pill, activeTag === 'all' && styles.pillSelected]}><Text style={[styles.pillText, activeTag === 'all' && styles.pillTextSelected]}>全部 ({items.length})</Text></Pressable>
          {availableTags.map((tag) => <Pressable key={tag} onPress={() => setActiveTag(tag)} style={[styles.pill, activeTag === tag && styles.pillSelected]}><Text style={[styles.pillText, activeTag === tag && styles.pillTextSelected]}>{tag}</Text></Pressable>)}
        </View>
        <StateView loading={loading} error={error} onRetry={load} />
        {filtered.map((item) => (
          <Pressable key={item.id} onLongPress={() => select(item)} delayLongPress={350}>
            <SectionCard>
              <View style={styles.rowTop}>
                <Pressable onPress={async () => { await updateWishlist(item.id, { is_fulfilled: !item.is_fulfilled }); await load(); }} style={[styles.checkCircle, item.is_fulfilled && styles.checkCircleDone]}>
                  {item.is_fulfilled ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </Pressable>
                <View style={styles.flex}>
                  <Text style={[styles.itemTitle, item.is_fulfilled && styles.completedText]}>{item.title}</Text>
                  <View style={styles.tagRow}>
                    {item.location ? <Tag label={category === 'shopping' ? `￥${item.location}` : `📍 ${item.location}`} tone={category === 'shopping' ? 'purple' : 'blue'} /> : null}
                    {String(item.custom_tags || '').split(',').filter(Boolean).map((tag) => <Tag key={tag} label={tag.trim()} />)}
                  </View>
                </View>
              </View>
            </SectionCard>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => {
        setSelected(null);
        setForm({ title: '', location: '', custom_tags: '', description: '' });
        bottomSheetRef.current?.present();
      }}>
        <LinearGradient
          colors={['#EC4899', '#B45309']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
        <Text style={styles.sheetTitle}>{selected ? '编辑愿望' : '记录新愿望'}</Text>
        <View style={{ height: spacing.lg }} />
        <Field label={category === 'shopping' ? '愿望名称' : '地点'} value={form.title} onChangeText={(value) => setForm((cur) => ({ ...cur, title: value }))} />
        <Field label={category === 'shopping' ? '价格预估' : '坐标 / 分类'} value={form.location} onChangeText={(value) => setForm((cur) => ({ ...cur, location: value }))} />
        <Field label="自定义标签" value={form.custom_tags} placeholder="逗号分隔" onChangeText={(value) => setForm((cur) => ({ ...cur, custom_tags: value }))} />
        <Field label="备注说明" value={form.description} multiline onChangeText={(value) => setForm((cur) => ({ ...cur, description: value }))} />
        <View style={styles.formActions}>
          {selected ? <PrimaryButton label="删除" tone="danger" onPress={remove} /> : null}
          <PrimaryButton label="取消" tone="plain" onPress={() => bottomSheetRef.current?.dismiss()} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={selected ? '保存修改' : '确认添加'} icon="checkmark" disabled={!form.title.trim()} onPress={() => selected ? void save() : void add()} />
          </View>
        </View>
      </FormSheet>
    </ScreenShell>
  );
}
