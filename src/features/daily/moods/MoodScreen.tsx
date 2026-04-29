import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Field, FormSheet, PrimaryButton, StateView } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../_shared/styles';
import { Item, MOOD_IMAGES, ScreenShell, SectionCard, Tag, compactDateTime, moodByLevel, moodOptions, safeNoteText, useItems } from '../_shared/ReplicatedScreens';
import { createMood, listMoods, updateMood } from './api';

export function MoodScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>(listMoods);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [level, setLevel] = useState(3);
  const [emotion, setEmotion] = useState('');
  const [content, setContent] = useState('');
  const [editingMood, setEditingMood] = useState<Item | null>(null);
  const [expandedMoodIds, setExpandedMoodIds] = useState<Record<number, boolean>>({});
  const [moodAssetsReady, setMoodAssetsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const preloadMoodAssets = async () => {
      try {
        await Asset.loadAsync(Object.values(MOOD_IMAGES));
      } finally {
        if (mounted) setMoodAssetsReady(true);
      }
    };
    void preloadMoodAssets();
    return () => {
      mounted = false;
    };
  }, []);

  const openCreateMood = () => {
    setEditingMood(null);
    setLevel(3);
    setEmotion('');
    setContent('');
    bottomSheetRef.current?.present();
  };

  const openEditMood = (item: Item) => {
    setEditingMood(item);
    setLevel(Number(item.mood_level || 3));
    setEmotion(safeNoteText(item.emotion));
    setContent(safeNoteText(item.content ?? item.note));
    bottomSheetRef.current?.present();
  };

  const toggleMoodDetail = (id: number) => {
    setExpandedMoodIds((current) => ({ ...current, [id]: !current[id] }));
  };

  const saveMood = async () => {
    const mood = moodByLevel(level);
    const body = { mood_level: level, mood_label: mood.label, content: content.trim() || null, emotion: emotion.trim() || null };
    if (editingMood) {
      await updateMood(editingMood.id, body);
    } else {
      await createMood(body);
    }
    bottomSheetRef.current?.dismiss();
    setEditingMood(null);
    setLevel(3);
    setEmotion('');
    setContent('');
    await load();
  };

  return (
    <ScreenShell title="心情" subtitle={`${items.length} 条情绪记录 · 心情五线谱`} onBack={onBack}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <MoodStaff moods={items} moodAssetsReady={moodAssetsReady} />
        <StateView loading={loading} error={error} onRetry={load} />
        <View style={styles.timeline}>
          {items.map((item) => {
            const mood = moodByLevel(Number(item.mood_level));
            const expanded = Boolean(expandedMoodIds[item.id]);
            const noteText = safeNoteText(item.content ?? item.note);
            return (
              <Pressable key={item.id} onPress={() => toggleMoodDetail(item.id)} onLongPress={() => openEditMood(item)} delayLongPress={350}>
                <SectionCard>
                  <View style={styles.rowTop}>
                    <View style={[styles.row, styles.flex]}>
                      {moodAssetsReady ? <ExpoImage source={mood.emoji} style={styles.emojiImage} contentFit="contain" transition={0} cachePolicy="memory-disk" /> : null}
                      <View style={styles.flex}>
                        <Text style={styles.itemTitle}>{item.mood_label}</Text>
                        <Text style={styles.metaText}>{compactDateTime(item.created_at)}</Text>
                      </View>
                      {item.emotion ? <Tag label={item.emotion} tone="purple" /> : null}
                    </View>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
                  </View>
                  {noteText && expanded ? <Text style={styles.bodyText}>{noteText}</Text> : null}
                </SectionCard>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={openCreateMood}>
        <LinearGradient
          colors={['#A855F7', '#7E22CE']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
        <Text style={styles.sheetTitle}>{editingMood ? '编辑心情' : '记录此刻心情'}</Text>
        <View style={{ height: spacing.lg }} />
        <View style={styles.moodPicker}>
          {moodOptions.map((mood) => (
            <Pressable key={mood.level} onPress={() => setLevel(mood.level)} style={[styles.moodButton, level === mood.level && styles.moodButtonSelected]}>
              {moodAssetsReady ? <ExpoImage source={mood.emoji} style={styles.bigEmojiImage} contentFit="contain" transition={0} cachePolicy="memory-disk" /> : null}
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="具体情绪" value={emotion} placeholder="例如：很爽、悲伤、兴奋" onChangeText={setEmotion} />
        <Field label="发生了什么事？" value={content} placeholder="记录影响心情的原因..." multiline onChangeText={setContent} />
        <View style={styles.formActions}>
          <PrimaryButton label="取消" tone="plain" onPress={() => bottomSheetRef.current?.dismiss()} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={editingMood ? '保存修改' : '打卡'} icon="checkmark" onPress={() => void saveMood()} />
          </View>
        </View>
      </FormSheet>
    </ScreenShell>
  );
}

function MoodStaff({ moods, moodAssetsReady }: { moods: Item[]; moodAssetsReady: boolean }) {
  const scrollRef = useRef<ScrollView>(null);
  const data = useMemo(() => [...moods].reverse(), [moods]);
  const chartWidth = Math.max(320, data.length * 64);
  const chartHeight = 220;
  const points = useMemo(() => data.map((item, index) => ({
    item,
    x: index * 64 + 28,
    y: 20 + (5 - Number(item.mood_level || 3)) * 34,
  })), [data]);
  const path = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y + 12}`).join(' ');
  }, [points]);

  return (
    <SectionCard style={styles.staffCard}>
      <Text style={styles.sectionTitle}>心情五线谱</Text>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>记录更多心情，谱写你的情绪乐章</Text>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View style={[styles.staff, { width: chartWidth, height: chartHeight }]}>
            {[5, 4, 3, 2, 1].map((item) => <View key={item} style={styles.staffLine} />)}
            <Svg pointerEvents="none" width={chartWidth} height={chartHeight} style={styles.staffCurve}>
              {path ? <Path d={path} fill="none" stroke="#8B5CF6" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /> : null}
            </Svg>
            {points.map(({ item, x, y }) => {
              const mood = moodByLevel(Number(item.mood_level));
              return (
                <View key={item.id} style={[styles.staffPoint, { left: x - 21, top: y }]}>
                  {moodAssetsReady ? <ExpoImage source={mood.emoji} style={styles.staffEmojiImage} contentFit="contain" transition={0} cachePolicy="memory-disk" /> : null}
                  <Text style={styles.staffTime}>{compactDateTime(item.created_at).replace(' ', '\n')}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SectionCard>
  );
}
