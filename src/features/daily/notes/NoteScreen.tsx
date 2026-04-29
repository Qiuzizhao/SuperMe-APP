import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Field, FormSheet, PrimaryButton, StateView } from '@/src/shared/components';
import { spacing } from '@/src/shared/theme';
import { styles } from '../_shared/styles';
import { Item, MOOD_IMAGES, ScreenShell, SectionCard, Tag, TextArea, compactDateTime, confirmRemove, moodByLevel, moodOptions, safeNoteText, useItems } from '../_shared/ReplicatedScreens';
import { createNote, deleteNote, listNotes, listNoteThread, updateNote } from './api';

const noteTags = ['灵感', '日记', '摘录', '备忘', '工作', '生活'];

export function NoteScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>(listNotes);
  const [selected, setSelected] = useState<Item | null>(null);
  const [thread, setThread] = useState<Item[]>([]);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [modalKind, setModalKind] = useState<'root' | 'thread' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
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

  const loadThread = useCallback(async (id: number) => {
    const data = await listNoteThread(id);
    setThread(Array.isArray(data) ? data : []);
  }, []);

  const select = (note: Item) => {
    setSelected(note);
    void loadThread(note.id);
  };

  const handleLongPress = (item: Item) => {
    setEditingItem(item);
    setModalKind('edit');
    bottomSheetRef.current?.present();
  };

  const addOrUpdateNote = async (payload: Record<string, unknown>) => {
    if (modalKind === 'edit' && editingItem) {
      await updateNote(editingItem.id, payload);
    } else {
      await createNote(payload);
    }
    setModalKind(null);
    setEditingItem(null);
    bottomSheetRef.current?.dismiss();
    await load();
    if (selected) await loadThread(selected.id);
  };

  const remove = (item: Item) => confirmRemove('随记', async () => {
    await deleteNote(item.id);
    if (selected?.id === item.id) {
      setSelected(null);
      setThread([]);
    }
    setModalKind(null);
    setEditingItem(null);
    bottomSheetRef.current?.dismiss();
    await load();
  });

  return (
    <ScreenShell title="随手记" subtitle={`${items.length} 条 · 事件追踪`} onBack={onBack}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <StateView loading={loading} error={error} onRetry={load} />
        <View style={styles.splitStack}>
          <View style={styles.timeline}>
            {items.map((note) => (
              <Pressable key={note.id} onPress={() => select(note)} onLongPress={() => handleLongPress(note)}>
                <SectionCard style={selected?.id === note.id && styles.selectedCard}>
                  <View style={styles.rowTop}>
                    <Text style={styles.metaText}>{compactDateTime(note.created_at)}</Text>
                  </View>
                  <Text style={styles.bodyText}>{safeNoteText(note.content)}</Text>
                  <View style={styles.tagRow}>
                    {safeNoteText(note.emotion) ? <Tag label={`💢 ${safeNoteText(note.emotion)}`} tone="purple" /> : null}
                    {String(note.tags || '').split(',').filter(Boolean).map((tag) => <Tag key={tag} label={`#${tag.trim()}`} tone="blue" />)}
                    {note.parent_id ? <Tag label="追踪节点" tone="orange" /> : null}
                  </View>
                </SectionCard>
              </Pressable>
            ))}
          </View>
          <SectionCard>
            <View style={styles.rowTop}>
              <Text style={styles.sectionTitle}>事件追踪</Text>
              {selected ? <PrimaryButton label="添加进展" icon="add" onPress={() => {
                setModalKind('thread');
                bottomSheetRef.current?.present();
              }} /> : null}
            </View>
            {selected ? (
              <View style={styles.timeline}>
                {thread.map((item) => (
                  <Pressable key={item.id} onLongPress={() => handleLongPress(item)}>
                    <SectionCard style={styles.innerCard}>
                      <View style={styles.rowTop}>
                        <Text style={styles.metaText}>{compactDateTime(item.created_at)}</Text>
                      </View>
                      <Text style={styles.bodyText}>{safeNoteText(item.content)}</Text>
                    </SectionCard>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>点击任意随记查看或继续追踪该事件。</Text>
            )}
          </SectionCard>
        </View>
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => {
        setModalKind('root');
        bottomSheetRef.current?.present();
      }}>
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <NoteModal
        bottomSheetRef={bottomSheetRef}
        visible={modalKind !== null}
        title={modalKind === 'edit' ? '编辑随记' : modalKind === 'thread' ? '添加事件新进展' : '记录新想法'}
        onClose={() => { setModalKind(null); setEditingItem(null); bottomSheetRef.current?.dismiss(); }}
        initialData={editingItem}
        moodAssetsReady={moodAssetsReady}
        onDelete={editingItem ? () => remove(editingItem) : undefined}
        onSubmit={(form) => {
          const rootId = modalKind === 'thread' && selected
            ? (thread[0]?.parent_id || thread[0]?.id || selected.id)
            : null;
          void addOrUpdateNote({ ...form, parent_id: rootId });
        }}
      />
    </ScreenShell>
  );
}

function NoteModal({ bottomSheetRef, visible, title, onClose, onSubmit, initialData, moodAssetsReady, onDelete }: { bottomSheetRef: React.RefObject<BottomSheetModal | null>; visible: boolean; title: string; onClose: () => void; onSubmit: (payload: Record<string, unknown>) => void; initialData?: Item | null; moodAssetsReady?: boolean; onDelete?: () => void }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [mood, setMood] = useState<typeof moodOptions[number] | null>(null);
  const [emotion, setEmotion] = useState('');

  useEffect(() => {
    if (visible) {
      setContent(safeNoteText(initialData?.content));
      setTags(initialData?.tags ? String(initialData.tags).split(',').filter(Boolean) : []);
      setMood(initialData?.mood_level ? moodByLevel(Number(initialData.mood_level)) : null);
      setEmotion(safeNoteText(initialData?.emotion));
    }
  }, [visible, initialData]);

  const submit = () => {
    if (!content.trim()) return;
    onSubmit({
      content: content.trim(),
      tags: tags.length ? tags.join(',') : null,
      mood_level: mood?.level ?? null,
      mood_label: mood?.label ?? null,
      emotion: emotion.trim() || null,
    });
    setContent('');
    setTags([]);
    setMood(null);
    setEmotion('');
  };

  return (
    <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
      <Text style={styles.sheetTitle}>{title}</Text>
      <View style={{ height: spacing.lg }} />
      <TextArea value={content} placeholder="此刻在想些什么？" onChangeText={setContent} />
      <Text style={styles.formLabel}>标签</Text>
      <View style={styles.pills}>
        {noteTags.map((tag) => {
          const selected = tags.includes(tag);
          return (
            <Pressable key={tag} onPress={() => setTags((current) => selected ? current.filter((item) => item !== tag) : [...current, tag])} style={[styles.pill, selected && styles.pillSelected]}>
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>#{tag}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.formLabel}>心情</Text>
      <View style={styles.pills}>
        {moodOptions.map((item) => (
          <Pressable key={item.level} onPress={() => setMood(mood?.level === item.level ? null : item)} style={[styles.miniMood, mood?.level === item.level && styles.pillSelected]}>
            {moodAssetsReady ? <ExpoImage source={item.emoji} style={styles.staffEmojiImage} contentFit="contain" transition={0} cachePolicy="memory-disk" /> : null}
          </Pressable>
        ))}
      </View>
      <Field label="具体情绪" value={emotion} placeholder="如：很不爽" onChangeText={setEmotion} />
      <View style={styles.formActions}>
        {initialData && onDelete ? (
          <PrimaryButton label="删除" tone="danger" onPress={onDelete} />
        ) : null}
        <PrimaryButton label="取消" tone="plain" onPress={onClose} />
        <View style={{ flex: 1 }}>
          <PrimaryButton label={initialData ? "保存修改" : "发布"} icon="send" disabled={!content.trim()} onPress={submit} />
        </View>
      </View>
    </FormSheet>
  );
}
