import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateField, Field, Header, IconButton, PrimaryButton, Screen, SegmentedControl, StateView } from '@/src/components/ui';
import { apiRequest, buildAssetUrl, uploadImage } from '@/src/lib/api';
import { colors, radius, shadow, spacing } from '@/src/theme';

type Item = Record<string, any> & { id: number };
type AssetItem = Item & ReturnType<typeof assetStats>;

const today = () => new Date().toISOString().slice(0, 10);
const compactDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const money = (value: unknown) => `￥${Number(value || 0).toFixed(2)}`;
const safeNoteText = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (!value) return '';
  if (typeof value === 'object' && 'uri' in (value as Record<string, unknown>)) {
    return String((value as { uri?: unknown }).uri || '');
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const MOOD_IMAGES = {
  5: require('../../assets/images/emojis/5.png'),
  4: require('../../assets/images/emojis/4.png'),
  3: require('../../assets/images/emojis/3.png'),
  2: require('../../assets/images/emojis/2.png'),
  1: require('../../assets/images/emojis/1.png'),
};

function useItems<T extends Item>(endpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiRequest<T[]>(endpoint);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return { items, setItems, loading, refreshing, setRefreshing, error, load };
}

function ScreenShell({ title, subtitle, onBack, children }: { title: string; subtitle?: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <Screen>
      <Header title={title} subtitle={subtitle} action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />} />
      {children}
    </Screen>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Tag({ label, tone = 'gray' }: { label: string; tone?: 'gray' | 'blue' | 'green' | 'red' | 'purple' | 'orange' }) {
  return <Text style={[styles.tag, styles[`tag_${tone}`]]}>{label}</Text>;
}

function DeleteButton({ onPress }: { onPress: () => void }) {
  return <IconButton name="trash-outline" label="删除" color={colors.danger} onPress={onPress} />;
}

function confirmRemove(label: string, onConfirm: () => void) {
  Alert.alert('删除确认', `确定删除「${label}」吗？`, [
    { text: '取消', style: 'cancel' },
    { text: '删除', style: 'destructive', onPress: onConfirm },
  ]);
}

function SelectPills({ value, options, onChange, accent = colors.primary }: { value: string; options: string[]; onChange: (value: string) => void; accent?: string }) {
  return (
    <View style={styles.pills}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable key={option} onPress={() => onChange(option)} style={[styles.pill, selected && { backgroundColor: accent, borderColor: accent }]}>
            <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TextArea(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={colors.faint} multiline textAlignVertical="top" {...props} style={[styles.input, styles.textArea, props.style]} />;
}

const moodOptions = [
  { level: 5, emoji: MOOD_IMAGES[5], label: '开心' },
  { level: 4, emoji: MOOD_IMAGES[4], label: '不错' },
  { level: 3, emoji: MOOD_IMAGES[3], label: '平静' },
  { level: 2, emoji: MOOD_IMAGES[2], label: '低落' },
  { level: 1, emoji: MOOD_IMAGES[1], label: '生气' },
];

function moodByLevel(level: number) {
  return moodOptions.find((item) => item.level === level) || moodOptions[2];
}

export function MoodScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>('/moods/');
  const [modalOpen, setModalOpen] = useState(false);
  const [level, setLevel] = useState(3);
  const [emotion, setEmotion] = useState('');
  const [content, setContent] = useState('');
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

  const addMood = async () => {
    const mood = moodByLevel(level);
    await apiRequest('/moods/', {
      method: 'POST',
      body: { mood_level: level, mood_label: mood.label, content: content.trim() || null, emotion: emotion.trim() || null },
    });
    setModalOpen(false);
    setLevel(3);
    setEmotion('');
    setContent('');
    await load();
  };

  const remove = (item: Item) => confirmRemove(item.mood_label || '心情记录', async () => {
    await apiRequest(`/moods/${item.id}`, { method: 'DELETE' });
    await load();
  });

  return (
    <ScreenShell title="心情" subtitle={`${items.length} 条情绪记录 · 心情五线谱`} onBack={onBack}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <PrimaryButton label="记录此刻" icon="add" onPress={() => setModalOpen(true)} />
        <MoodStaff moods={items} moodAssetsReady={moodAssetsReady} />
        <StateView loading={loading} error={error} onRetry={load} />
        <View style={styles.timeline}>
          {items.map((item) => {
            const mood = moodByLevel(Number(item.mood_level));
            return (
              <SectionCard key={item.id}>
                <View style={styles.rowTop}>
                  <View style={styles.row}>
                    {moodAssetsReady ? <ExpoImage source={mood.emoji} style={styles.emojiImage} contentFit="contain" transition={0} cachePolicy="memory-disk" /> : null}
                    <View>
                      <Text style={styles.itemTitle}>{item.mood_label}</Text>
                      <Text style={styles.metaText}>{compactDateTime(item.created_at)}</Text>
                    </View>
                  </View>
                  <DeleteButton onPress={() => remove(item)} />
                </View>
                {item.emotion ? <Tag label={item.emotion} tone="purple" /> : null}
                {item.content ? <Text style={styles.bodyText}>{item.content}</Text> : null}
              </SectionCard>
            );
          })}
        </View>
      </ScrollView>
      <Modal animationType="slide" visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <Header title="记录此刻心情" action={<IconButton name="close" label="关闭" soft onPress={() => setModalOpen(false)} />} />
          <ScrollView contentContainerStyle={styles.content}>
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
            <PrimaryButton label="打卡" icon="checkmark" onPress={() => void addMood()} />
          </ScrollView>
        </Screen>
      </Modal>
    </ScreenShell>
  );
}

function MoodStaff({ moods, moodAssetsReady }: { moods: Item[]; moodAssetsReady: boolean }) {
  const data = [...moods].reverse().slice(-24);
  return (
    <SectionCard style={styles.staffCard}>
      <Text style={styles.sectionTitle}>心情五线谱</Text>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>记录更多心情，谱写你的情绪乐章</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.staff, { width: Math.max(320, data.length * 54) }]}>
            {[5, 4, 3, 2, 1].map((item) => <View key={item} style={styles.staffLine} />)}
            {data.map((item, index) => {
              const mood = moodByLevel(Number(item.mood_level));
              const top = 20 + (5 - Number(item.mood_level)) * 34;
              return (
                <View key={item.id} style={[styles.staffPoint, { left: index * 54 + 18, top }]}>
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

const noteTags = ['灵感', '日记', '摘录', '备忘', '工作', '生活'];

export function NoteScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>('/notes/');
  const [selected, setSelected] = useState<Item | null>(null);
  const [thread, setThread] = useState<Item[]>([]);
  const [modalKind, setModalKind] = useState<'root' | 'thread' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const loadThread = useCallback(async (id: number) => {
    const data = await apiRequest<Item[]>(`/notes/thread/${id}`);
    setThread(Array.isArray(data) ? data : []);
  }, []);

  const select = (note: Item) => {
    setSelected(note);
    void loadThread(note.id);
  };

  const handleLongPress = (item: Item) => {
    setEditingItem(item);
    setModalKind('edit');
  };

  const addOrUpdateNote = async (payload: Record<string, unknown>) => {
    if (modalKind === 'edit' && editingItem) {
      await apiRequest(`/notes/${editingItem.id}`, { method: 'PUT', body: payload });
    } else {
      await apiRequest('/notes/', { method: 'POST', body: payload });
    }
    setModalKind(null);
    setEditingItem(null);
    await load();
    if (selected) await loadThread(selected.id);
  };

  const remove = (item: Item) => confirmRemove('随记', async () => {
    await apiRequest(`/notes/${item.id}`, { method: 'DELETE' });
    if (selected?.id === item.id) {
      setSelected(null);
      setThread([]);
    }
    setModalKind(null);
    setEditingItem(null);
    await load();
  });

  return (
    <ScreenShell title="随手记" subtitle={`${items.length} 条 · 事件追踪`} onBack={onBack}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <PrimaryButton label="记录新想法" icon="add" onPress={() => setModalKind('root')} />
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
              {selected ? <PrimaryButton label="添加进展" icon="add" onPress={() => setModalKind('thread')} /> : null}
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
      <NoteModal
        visible={modalKind !== null}
        title={modalKind === 'edit' ? '编辑随记' : modalKind === 'thread' ? '添加事件新进展' : '记录新想法'}
        onClose={() => { setModalKind(null); setEditingItem(null); }}
        initialData={editingItem}
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

function NoteModal({ visible, title, onClose, onSubmit, initialData, onDelete }: { visible: boolean; title: string; onClose: () => void; onSubmit: (payload: Record<string, unknown>) => void; initialData?: Item | null; onDelete?: () => void }) {
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
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <Screen>
        <Header title={title} action={<IconButton name="close" label="关闭" soft onPress={onClose} />} />
        <ScrollView contentContainerStyle={styles.content}>
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
                <Text style={styles.staffEmoji}>{item.emoji}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="具体情绪" value={emotion} placeholder="如：很不爽" onChangeText={setEmotion} />
          <View style={styles.formActions}>
            {initialData && onDelete && (
              <PrimaryButton label="删除" tone="plain" onPress={onDelete} />
            )}
            <PrimaryButton label={initialData ? "保存修改" : "发布"} icon="send" disabled={!content.trim()} onPress={submit} />
          </View>
        </ScrollView>
      </Screen>
    </Modal>
  );
}

export function WorkLogScreen({ onBack }: { onBack: () => void }) {
  const createWorkLogForm = () => ({ record: '', activity_name: '', event_date: today(), event_time: '', location: '', notes: '' });
  const getWorkLogFormFromItem = (item: Item) => {
    const eventDate = String(item.event_time || '').slice(0, 10);
    const eventTime = String(item.event_time || '').slice(11, 16);
    return {
      record: item.record || '',
      activity_name: item.activity_name || '',
      event_date: eventDate || today(),
      event_time: eventTime,
      location: item.location || '',
      notes: item.notes || '',
    };
  };
  const [type, setType] = useState('daily');
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>(`/worklogs/?log_type=${type}`);
  const [form, setForm] = useState(createWorkLogForm);
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const groups = useMemo(() => groupByDate(items, (item) => item.event_time || item.created_at), [items]);
  const save = async () => {
    if (!form.record.trim()) return;
    const payload = {
      log_type: type,
      record: form.record.trim(),
      activity_name: form.activity_name.trim() || null,
      event_time: form.event_date ? `${form.event_date}T${form.event_time || '00:00'}` : null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
    };
    await apiRequest(editingItem ? `/worklogs/${editingItem.id}` : '/worklogs/', {
      method: editingItem ? 'PUT' : 'POST',
      body: {
        ...payload,
      },
    });
    setForm(createWorkLogForm());
    setAdding(false);
    setEditingItem(null);
    await load();
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(createWorkLogForm());
    setAdding(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setForm(getWorkLogFormFromItem(item));
    setAdding(true);
  };

  const closeModal = () => {
    setAdding(false);
    setEditingItem(null);
    setForm(createWorkLogForm());
  };

  const remove = async () => {
    if (!editingItem) return;
    confirmRemove(editingItem.activity_name || editingItem.record || '工作日志', async () => {
      await apiRequest(`/worklogs/${editingItem.id}`, { method: 'DELETE' });
      closeModal();
      await load();
    });
  };

  return (
    <ScreenShell title="工作日志" subtitle="日常工作与活动安排" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <PrimaryButton label="新建日志" icon="add" onPress={openCreate} />
        <SegmentedControl value={type} onChange={setType} options={[{ label: '日常记录', value: 'daily' }, { label: '活动记录', value: 'activity' }]} />
        
        <StateView loading={loading} error={error} onRetry={load} />
        <GroupedLogList groups={groups} onLongPress={openEdit} />
      </ScrollView>

      <Modal visible={adding} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <Screen>
          <Header title={editingItem ? "编辑工作日志" : "记录工作日志"} action={<IconButton name="close" label="关闭" soft onPress={closeModal} />} />
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Field label="活动名" value={form.activity_name} placeholder={type === 'activity' ? '例如：家长会、教研活动' : '例如：备课、批改作业'} onChangeText={(value) => setForm((cur) => ({ ...cur, activity_name: value }))} />
              <View style={styles.formRow}>
                <DateField label="日期" value={form.event_date} onChangeText={(value) => setForm((cur) => ({ ...cur, event_date: value }))} />
                <Field label="时间" value={form.event_time} placeholder="HH:mm" onChangeText={(value) => setForm((cur) => ({ ...cur, event_time: value }))} />
              </View>
              <Field label="地点" value={form.location} placeholder="会议室 / 高二3班" onChangeText={(value) => setForm((cur) => ({ ...cur, location: value }))} />
              <Field label="记录" value={form.record} multiline placeholder="记录今天的工作内容..." onChangeText={(value) => setForm((cur) => ({ ...cur, record: value }))} />
              <Field label="备注" value={form.notes} multiline placeholder="补充说明" onChangeText={(value) => setForm((cur) => ({ ...cur, notes: value }))} />
            </ScrollView>
            <View style={styles.modalFooter}>
              {editingItem ? <PrimaryButton label="删除" tone="danger" onPress={() => void remove()} /> : null}
              <PrimaryButton label="取消" tone="plain" onPress={closeModal} />
              <PrimaryButton label={editingItem ? "保存修改" : "保存"} icon="save-outline" disabled={!form.record.trim()} onPress={() => void save()} />
            </View>
          </KeyboardAvoidingView>
        </Screen>
      </Modal>
    </ScreenShell>
  );
}

const courseTypes = ['科学', '信息', '课1', '课2', '劳动', '社团', '代课'];
const ratingLabels: Record<number, string> = { 5: '🌟 极佳', 4: '✨ 良好', 3: '👍 一般', 2: '⚠️ 较差', 1: '🆘 糟糕' };
const effectRatingOptions = [
  { value: '5', label: '🌟 极佳' },
  { value: '4', label: '✨ 良好' },
  { value: '3', label: '👍 一般' },
  { value: '2', label: '⚠️ 较差' },
  { value: '1', label: '🆘 糟糕' },
];

export function TeachingScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>('/teachings/');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ class_name: '', course_type: '科学', content: '', practice_content: '', effect_rating: '3', unexpected: '', reflection: '' });
  const [adding, setAdding] = useState(false);
  const groups = useMemo(() => groupByDate(items, (item) => item.created_at), [items]);

  const save = async () => {
    if (!form.class_name.trim() || !form.content.trim()) return;
    await apiRequest('/teachings/', {
      method: 'POST',
      body: {
        class_name: form.class_name.trim(),
        course_type: form.course_type,
        content: form.content.trim(),
        practice_content: form.practice_content.trim() || null,
        effect_rating: Number(form.effect_rating),
        unexpected: form.unexpected.trim() || null,
        reflection: form.reflection.trim() || null,
      },
    });
    setForm({ class_name: '', course_type: '科学', content: '', practice_content: '', effect_rating: '3', unexpected: '', reflection: '' });
    setAdding(false);
    await load();
  };

  return (
    <ScreenShell title="课堂日志" subtitle="课堂、练习和复盘" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <PrimaryButton label="新建课堂日志" icon="add" onPress={() => setAdding(true)} />
        <StateView loading={loading} error={error} onRetry={load} />
        {groups.map((group) => (
          <View key={group.date} style={styles.group}>
            <Text style={styles.groupTitle}>{group.isToday ? '📅 今天' : `📅 ${group.date}`}</Text>
            {group.items.map((item) => {
              const isOpen = expanded === item.id;
              return (
                <SectionCard key={item.id}>
                  <Pressable onPress={() => setExpanded((cur) => (cur === item.id ? null : item.id))}>
                    <View style={styles.rowTop}>
                      <View style={styles.flex}>
                        <View style={styles.rowWrap}>
                          <Text style={styles.itemTitle}>{item.class_name}</Text>
                          <Tag label={item.course_type} tone="blue" />
                          <Tag label={ratingLabels[item.effect_rating] || '👍 一般'} tone="purple" />
                        </View>
                        <Text style={styles.metaText} numberOfLines={1}>{item.content}</Text>
                      </View>
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.muted} />
                    </View>
                  </Pressable>
                  {isOpen ? (
                    <View style={styles.detailBlock}>
                      <Detail label="上课内容" value={item.content} />
                      <Detail label="完成练习" value={item.practice_content} tone="green" />
                      <Detail label="突发意外" value={item.unexpected} tone="red" />
                      <Detail label="教学反思" value={item.reflection} tone="blue" />
                      <PrimaryButton label="删除" tone="danger" onPress={() => confirmRemove('课堂日志', async () => { await apiRequest(`/teachings/${item.id}`, { method: 'DELETE' }); await load(); })} />
                    </View>
                  ) : null}
                </SectionCard>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Modal visible={adding} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAdding(false)}>
        <Screen>
          <Header title="记录课堂日志" action={<IconButton name="close" label="关闭" soft onPress={() => setAdding(false)} />} />
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Field label="授课班级" value={form.class_name} placeholder="例如：高二3班" onChangeText={(value) => setForm((cur) => ({ ...cur, class_name: value }))} />
              <Text style={styles.formLabel}>效果评分</Text>
              <View style={styles.pills}>
                {effectRatingOptions.map((option) => {
                  const selected = form.effect_rating === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setForm((cur) => ({ ...cur, effect_rating: option.value }))}
                      style={[styles.pill, selected && { backgroundColor: '#7E22CE', borderColor: '#7E22CE' }]}>
                      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.formLabel}>课程类型</Text>
              <SelectPills value={form.course_type} options={courseTypes} onChange={(value) => setForm((cur) => ({ ...cur, course_type: value }))} accent="#4F46E5" />
              <Field label="上课内容" value={form.content} multiline placeholder="今天讲了哪些核心知识点？" onChangeText={(value) => setForm((cur) => ({ ...cur, content: value }))} />
              <Field label="完成练习" value={form.practice_content} multiline placeholder="学生做了哪些练习题？" onChangeText={(value) => setForm((cur) => ({ ...cur, practice_content: value }))} />
              <Field label="突发意外" value={form.unexpected} multiline placeholder="计划外情况" onChangeText={(value) => setForm((cur) => ({ ...cur, unexpected: value }))} />
              <Field label="教学反思" value={form.reflection} multiline placeholder="后续要改进什么？" onChangeText={(value) => setForm((cur) => ({ ...cur, reflection: value }))} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <PrimaryButton label="取消" tone="plain" onPress={() => setAdding(false)} />
              <PrimaryButton label="保存" icon="save-outline" disabled={!form.class_name.trim() || !form.content.trim()} onPress={() => void save()} />
            </View>
          </KeyboardAvoidingView>
        </Screen>
      </Modal>
    </ScreenShell>
  );
}

function groupByDate(items: Item[], dateGetter: (item: Item) => string) {
  const todayString = today();
  const sorted = [...items].sort((a, b) => String(dateGetter(b)).localeCompare(String(dateGetter(a))));
  return sorted.reduce<{ date: string; isToday: boolean; items: Item[] }[]>((acc, item) => {
    const date = String(dateGetter(item) || item.created_at || '').slice(0, 10);
    let group = acc.find((entry) => entry.date === date);
    if (!group) {
      group = { date, isToday: date === todayString, items: [] };
      acc.push(group);
    }
    group.items.push(item);
    return acc;
  }, []);
}

function GroupedLogList({ groups, onLongPress }: { groups: ReturnType<typeof groupByDate>; onLongPress: (item: Item) => void }) {
  return (
    <View style={styles.timeline}>
      {groups.map((group) => (
        <View key={group.date} style={styles.group}>
          <Text style={styles.groupTitle}>{group.isToday ? '📅 今天' : `📅 ${group.date}`}</Text>
          {group.items.map((item) => (
            <SectionCard key={item.id}>
              <Pressable onLongPress={() => onLongPress(item)}>
                <View style={styles.rowTop}>
                  <View style={styles.flex}>
                    <View style={styles.rowWrap}>
                      <Tag label={item.log_type === 'activity' ? '活动记录' : '日常记录'} tone="blue" />
                      {item.activity_name ? <Text style={styles.itemTitle}>{item.activity_name}</Text> : null}
                    </View>
                    <Text style={styles.bodyText}>{item.record}</Text>
                    <View style={styles.tagRow}>
                      {item.event_time ? <Tag label={`⏰ ${compactDateTime(item.event_time)}`} /> : null}
                      {item.location ? <Tag label={`📍 ${item.location}`} /> : null}
                    </View>
                    {item.notes ? <Text style={styles.metaText}>备注：{item.notes}</Text> : null}
                    <Text style={styles.metaText}>长按可编辑</Text>
                  </View>
                </View>
              </Pressable>
            </SectionCard>
          ))}
        </View>
      ))}
    </View>
  );
}

function Detail({ label, value, tone = 'gray' }: { label: string; value?: string | null; tone?: 'gray' | 'green' | 'red' | 'blue' }) {
  if (!value) return null;
  return (
    <View style={[styles.detail, styles[`detail_${tone}`]]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.bodyText}>{value}</Text>
    </View>
  );
}

const cycles = [
  { label: '每月', value: 'monthly', factor: 1 },
  { label: '每季度', value: 'quarterly', factor: 1 / 3 },
  { label: '每年', value: 'yearly', factor: 1 / 12 },
];

export function SubscriptionScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>('/finances/subscriptions');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: '', amount: '', cycle: 'monthly', next_billing_date: today(), category: '', notes: '', is_active: 'true' });
  const monthlyTotal = items.filter((item) => item.is_active).reduce((sum, item) => sum + Number(item.amount || 0) * (cycles.find((cycle) => cycle.value === item.cycle)?.factor || 0), 0);

  const reset = () => {
    setEditing(null);
    setForm({ name: '', amount: '', cycle: 'monthly', next_billing_date: today(), category: '', notes: '', is_active: 'true' });
    setModalOpen(false);
  };
  const save = async () => {
    if (!form.name.trim() || Number(form.amount) <= 0) return;
    await apiRequest(editing ? `/finances/subscriptions/${editing.id}` : '/finances/subscriptions', {
      method: editing ? 'PUT' : 'POST',
      body: { name: form.name.trim(), amount: Number(form.amount), cycle: form.cycle, next_billing_date: form.next_billing_date, category: form.category.trim() || null, notes: form.notes.trim() || null, is_active: form.is_active === 'true' },
    });
    reset();
    await load();
  };

  const openForm = (item?: Item) => {
    if (item) {
      setEditing(item);
      setForm({ name: item.name || '', amount: String(item.amount || ''), cycle: item.cycle || 'monthly', next_billing_date: item.next_billing_date || today(), category: item.category || '', notes: item.notes || '', is_active: item.is_active ? 'true' : 'false' });
    } else {
      setEditing(null);
      setForm({ name: '', amount: '', cycle: 'monthly', next_billing_date: today(), category: '', notes: '', is_active: 'true' });
    }
    setModalOpen(true);
  };
  const remove = async () => {
    if (!editing) return;
    confirmRemove(editing.name, async () => {
      await apiRequest(`/finances/subscriptions/${editing.id}`, { method: 'DELETE' });
      setModalOpen(false);
      await load();
    });
  };

  return (
    <ScreenShell title="订阅" subtitle={`每月订阅总额 ${money(monthlyTotal)}`} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <PrimaryButton label="新增订阅" icon="add" onPress={() => openForm()} />
        <StateView loading={loading} error={error} onRetry={load} />
        {items.map((item) => (
          <Pressable key={item.id} onLongPress={() => openForm(item)}>
            <SectionCard>
              <View style={styles.rowTop}>
                <View style={styles.flex}>
                  <View style={styles.rowWrap}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Tag label={item.is_active ? '已启用' : '已停用'} tone={item.is_active ? 'green' : 'gray'} />
                    {item.category ? <Tag label={item.category} tone="blue" /> : null}
                  </View>
                  <Text style={styles.metaText}>{cycles.find((cycle) => cycle.value === item.cycle)?.label || item.cycle} · 下次扣费 {item.next_billing_date}</Text>
                  {item.notes ? <Text style={styles.bodyText}>{item.notes}</Text> : null}
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: colors.danger }}>{money(item.amount)}</Text>
                </View>
              </View>
            </SectionCard>
          </Pressable>
        ))}
      </ScrollView>
      <Modal animationType="slide" visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <Header title={editing ? '编辑订阅' : '新增订阅'} action={<IconButton name="close" label="关闭" soft onPress={() => setModalOpen(false)} />} />
          <ScrollView contentContainerStyle={styles.content}>
            <Field label="订阅名称" value={form.name} placeholder="如：Spotify 家庭版" onChangeText={(value) => setForm((cur) => ({ ...cur, name: value }))} />
            <View style={styles.formRow}>
              <Field label="金额" value={form.amount} keyboardType="decimal-pad" onChangeText={(value) => setForm((cur) => ({ ...cur, amount: value }))} />
              <DateField label="下次扣费日期" value={form.next_billing_date} onChangeText={(value) => setForm((cur) => ({ ...cur, next_billing_date: value }))} />
            </View>
            <SegmentedControl value={form.cycle} onChange={(value) => setForm((cur) => ({ ...cur, cycle: value }))} options={cycles.map(({ label, value }) => ({ label, value }))} />
            <SegmentedControl value={form.is_active} onChange={(value) => setForm((cur) => ({ ...cur, is_active: value }))} options={[{ label: '启用', value: 'true' }, { label: '停用', value: 'false' }]} />
            <Field label="分类" value={form.category} placeholder="视频 / 音乐 / 软件" onChangeText={(value) => setForm((cur) => ({ ...cur, category: value }))} />
            <Field label="备注" value={form.notes} multiline onChangeText={(value) => setForm((cur) => ({ ...cur, notes: value }))} />
            <View style={styles.formActions}>
              <PrimaryButton label={editing ? '保存修改' : '新增订阅'} icon="save-outline" disabled={!form.name.trim() || Number(form.amount) <= 0} onPress={() => void save()} />
              {editing ? <PrimaryButton label="删除订阅" icon="trash-outline" tone="danger" onPress={remove} /> : null}
            </View>
          </ScrollView>
        </Screen>
      </Modal>
    </ScreenShell>
  );
}

const assetCategories = ['数码产品', '家用电器', '衣物鞋包', '交通工具', '家具家居', '其他'];
const assetStatus = {
  in_use: '在用',
  idle: '闲置',
  sold: '已售出',
  discarded: '已丢弃',
  retired: '已淘汰',
};

function assetStats(item: Item) {
  const purchase = new Date(item.purchase_date);
  const current = new Date();
  purchase.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  const daysUsed = Math.max(0, Math.floor((current.getTime() - purchase.getTime()) / 86400000));
  const actualDailyCost = Number(item.price || 0) / Math.max(1, daysUsed);
  return { daysUsed, actualDailyCost };
}

export function AssetScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>('/guiwu/');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: '', category: assetCategories[0], price: '', purchase_date: today(), lifespan_type: 'years', lifespan_value: '3', status: 'in_use', notes: '' });
  const processed: AssetItem[] = items.map((item) => ({ ...item, ...assetStats(item) }));
  const dashboard = processed.reduce((acc, item) => {
    if (['in_use', 'idle'].includes(item.status)) {
      acc.totalOriginal += Number(item.price || 0);
      acc.totalDailyCost += item.actualDailyCost;
    }
    return acc;
  }, { totalOriginal: 0, totalDailyCost: 0 });

  const open = (item?: Item) => {
    if (item) {
      setEditing(item);
      let lifespanType = 'days';
      let lifespanValue = String(item.expected_lifespan_days || 1);
      if (item.expected_lifespan_days % 365 === 0) {
        lifespanType = 'years';
        lifespanValue = String(item.expected_lifespan_days / 365);
      } else if (item.expected_lifespan_days % 30 === 0) {
        lifespanType = 'months';
        lifespanValue = String(item.expected_lifespan_days / 30);
      }
      setForm({ name: item.name || '', category: item.category || assetCategories[0], price: String(item.price || ''), purchase_date: item.purchase_date || today(), lifespan_type: lifespanType, lifespan_value: lifespanValue, status: item.status || 'in_use', notes: item.notes || '' });
    } else {
      setEditing(null);
      setForm({ name: '', category: assetCategories[0], price: '', purchase_date: today(), lifespan_type: 'years', lifespan_value: '3', status: 'in_use', notes: '' });
    }
    setModalOpen(true);
  };
  const save = async () => {
    const factor = form.lifespan_type === 'years' ? 365 : form.lifespan_type === 'months' ? 30 : 1;
    await apiRequest(editing ? `/guiwu/${editing.id}` : '/guiwu/', {
      method: editing ? 'PUT' : 'POST',
      body: { name: form.name.trim(), category: form.category, price: Number(form.price), purchase_date: form.purchase_date, expected_lifespan_days: Math.max(1, Number(form.lifespan_value || 1) * factor), status: form.status, notes: form.notes.trim() || null },
    });
    setModalOpen(false);
    await load();
  };

  return (
    <ScreenShell title="归物" subtitle="掌控个人资产和每日持有成本" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <PrimaryButton label="录入新资产" icon="add" onPress={() => open()} />
        <View style={styles.statsGrid}>
          <Stat label="资产总计" value={money(dashboard.totalOriginal)} subValue={`每日总成本: ${money(dashboard.totalDailyCost)}/天`} />
        </View>
        <StateView loading={loading} error={error} onRetry={load} />
        {processed.map((item) => (
          <Pressable key={item.id} onLongPress={() => open(item)}>
            <SectionCard>
              <View style={styles.rowTop}>
                <View style={styles.flex}>
                  <View style={styles.rowWrap}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Tag label={item.category} />
                    <Tag label={assetStatus[item.status as keyof typeof assetStatus] || item.status} tone={item.status === 'in_use' ? 'green' : 'orange'} />
                  </View>
                  <View style={[styles.rowWrap, { marginTop: 12, gap: 12 }]}>
                    <Text style={styles.metricValue}>{money(item.price)}</Text>
                    <Text style={styles.metaText}>•</Text>
                    <Text style={styles.metricValue}>{item.daysUsed} 天</Text>
                    <Text style={styles.metaText}>•</Text>
                    <Text style={styles.metricValue}>{money(item.actualDailyCost)}/天</Text>
                  </View>
                  {item.notes ? <Text style={[styles.bodyText, { marginTop: 8 }]} >{item.notes}</Text> : null}
                </View>
              </View>
            </SectionCard>
          </Pressable>
        ))}
      </ScrollView>
      <Modal animationType="slide" visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <Header title={editing ? '编辑资产' : '录入新资产'} action={<IconButton name="close" label="关闭" soft onPress={() => setModalOpen(false)} />} />
          <ScrollView contentContainerStyle={styles.content}>
            <Field label="物品名称" value={form.name} onChangeText={(value) => setForm((cur) => ({ ...cur, name: value }))} />
            <Text style={styles.formLabel}>分类</Text>
            <SelectPills value={form.category} options={assetCategories} onChange={(value) => setForm((cur) => ({ ...cur, category: value }))} accent="#4F46E5" />
            <Text style={styles.formLabel}>状态</Text>
            <SelectPills value={form.status} options={Object.keys(assetStatus)} onChange={(value) => setForm((cur) => ({ ...cur, status: value }))} accent="#4F46E5" />
            <View style={styles.formRow}>
              <Field label="购入价格" value={form.price} keyboardType="decimal-pad" onChangeText={(value) => setForm((cur) => ({ ...cur, price: value }))} />
              <DateField label="购入日期" value={form.purchase_date} onChangeText={(value) => setForm((cur) => ({ ...cur, purchase_date: value }))} />
            </View>
            <View style={styles.formRow}>
              <Field label="预计寿命数值" value={form.lifespan_value} keyboardType="number-pad" onChangeText={(value) => setForm((cur) => ({ ...cur, lifespan_value: value }))} />
              <SegmentedControl value={form.lifespan_type} onChange={(value) => setForm((cur) => ({ ...cur, lifespan_type: value }))} options={[{ label: '年', value: 'years' }, { label: '月', value: 'months' }, { label: '天', value: 'days' }]} />
            </View>
            <Field label="备注" value={form.notes} multiline onChangeText={(value) => setForm((cur) => ({ ...cur, notes: value }))} />
            <View style={styles.formActions}>
              {editing && (
                <PrimaryButton label="删除" tone="plain" onPress={() => confirmRemove(editing.name, async () => { await apiRequest(`/guiwu/${editing.id}`, { method: 'DELETE' }); setModalOpen(false); await load(); })} />
              )}
              <PrimaryButton label={editing ? '保存修改' : '确认录入'} icon="checkmark" disabled={!form.name.trim()} onPress={() => void save()} />
            </View>
          </ScrollView>
        </Screen>
      </Modal>
    </ScreenShell>
  );
}

function Stat({ label, value, danger, subValue }: { label: string; value: string; danger?: boolean; subValue?: string }) {
  return (
    <SectionCard style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, danger && { color: colors.danger }]}>{value}</Text>
      {subValue ? <Text style={[styles.metaText, { marginTop: 2 }]}>{subValue}</Text> : null}
    </SectionCard>
  );
}



export function WishlistScreen({ onBack }: { onBack: () => void }) {
  const { items: allItems, loading, refreshing, setRefreshing, error, load } = useItems<Item>('/extras/wishlists/');
  const [category, setCategory] = useState('shopping');
  const [activeTag, setActiveTag] = useState('all');
  const [title, setTitle] = useState('');
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
    if (!title.trim()) return;
    await apiRequest('/extras/wishlists/', { method: 'POST', body: { title: title.trim(), category, is_fulfilled: false } });
    setTitle('');
    await load();
  };
  const select = (item: Item) => {
    setSelected(item);
    setForm({ title: item.title || '', location: item.location || '', custom_tags: item.custom_tags || '', description: item.description || '' });
  };
  const save = async () => {
    if (!selected) return;
    await apiRequest(`/extras/wishlists/${selected.id}`, { method: 'PUT', body: { title: form.title.trim(), location: form.location.trim() || null, custom_tags: form.custom_tags.trim() || null, description: form.description.trim() || null } });
    await load();
  };

  return (
    <ScreenShell title="愿望" subtitle="购物愿望和旅行愿望" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <SegmentedControl value={category} onChange={(value) => { setCategory(value); setActiveTag('all'); setSelected(null); }} options={[{ label: '购物愿望单', value: 'shopping' }, { label: '旅行愿望单', value: 'travel' }]} />
        <View style={styles.quickAdd}>
          <TextInput value={title} onChangeText={setTitle} placeholder={category === 'shopping' ? '添加一个新的购物愿望...' : '添加一个新的旅行地点...'} placeholderTextColor={colors.faint} style={styles.quickInput} />
          <Pressable onPress={add} style={styles.addButton}><Ionicons name="add" size={22} color="#fff" /></Pressable>
        </View>
        <View style={styles.pills}>
          <Pressable onPress={() => setActiveTag('all')} style={[styles.pill, activeTag === 'all' && styles.pillSelected]}><Text style={[styles.pillText, activeTag === 'all' && styles.pillTextSelected]}>全部 ({items.length})</Text></Pressable>
          {availableTags.map((tag) => <Pressable key={tag} onPress={() => setActiveTag(tag)} style={[styles.pill, activeTag === tag && styles.pillSelected]}><Text style={[styles.pillText, activeTag === tag && styles.pillTextSelected]}>{tag}</Text></Pressable>)}
        </View>
        <StateView loading={loading} error={error} onRetry={load} />
        {filtered.map((item) => (
          <Pressable key={item.id} onPress={() => select(item)}>
            <SectionCard style={selected?.id === item.id && styles.selectedCard}>
              <View style={styles.rowTop}>
                <Pressable onPress={async () => { await apiRequest(`/extras/wishlists/${item.id}`, { method: 'PUT', body: { is_fulfilled: !item.is_fulfilled } }); await load(); }} style={[styles.checkCircle, item.is_fulfilled && styles.checkCircleDone]}>
                  {item.is_fulfilled ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </Pressable>
                <View style={styles.flex}>
                  <Text style={[styles.itemTitle, item.is_fulfilled && styles.completedText]}>{item.title}</Text>
                  <View style={styles.tagRow}>
                    {item.location ? <Tag label={category === 'shopping' ? `￥${item.location}` : `📍 ${item.location}`} tone={category === 'shopping' ? 'purple' : 'blue'} /> : null}
                    {String(item.custom_tags || '').split(',').filter(Boolean).map((tag) => <Tag key={tag} label={tag.trim()} />)}
                  </View>
                </View>
                <DeleteButton onPress={() => confirmRemove(item.title, async () => { await apiRequest(`/extras/wishlists/${item.id}`, { method: 'DELETE' }); setSelected(null); await load(); })} />
              </View>
              {selected?.id === item.id ? (
                <View style={styles.detailBlock}>
                  <Field label={category === 'shopping' ? '愿望名称' : '地点'} value={form.title} onChangeText={(value) => setForm((cur) => ({ ...cur, title: value }))} />
                  <Field label={category === 'shopping' ? '价格预估' : '坐标 / 分类'} value={form.location} onChangeText={(value) => setForm((cur) => ({ ...cur, location: value }))} />
                  <Field label="自定义标签" value={form.custom_tags} placeholder="逗号分隔" onChangeText={(value) => setForm((cur) => ({ ...cur, custom_tags: value }))} />
                  <Field label="备注说明" value={form.description} multiline onChangeText={(value) => setForm((cur) => ({ ...cur, description: value }))} />
                  <PrimaryButton label="保存修改" icon="checkmark" onPress={() => void save()} />
                </View>
              ) : null}
            </SectionCard>
          </Pressable>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

export function FootprintScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>('/extras/footprints/');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
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
  const open = (item?: Item) => {
    setSelected(item || null);
    setForm({ location: item?.location || '', coordinate: item?.coordinate || '', visit_date: item?.visit_date || today(), notes: item?.notes || '', rating: String(item?.rating || 5), image_url: item?.image_url || '' });
    setModalOpen(true);
  };
  const save = async () => {
    if (!form.location.trim()) return;
    await apiRequest(selected ? `/extras/footprints/${selected.id}` : '/extras/footprints/', { method: selected ? 'PUT' : 'POST', body: { location: form.location.trim(), coordinate: form.coordinate.trim() || null, visit_date: form.visit_date, notes: form.notes.trim() || null, rating: Number(form.rating), image_url: form.image_url || null } });
    setModalOpen(false);
    await load();
  };
  const remove = async () => {
    if (!selected) return;
    confirmRemove(selected.location, async () => {
      await apiRequest(`/extras/footprints/${selected.id}`, { method: 'DELETE' });
      setModalOpen(false);
      await load();
    });
  };

  return (
    <ScreenShell title="足迹" subtitle={`${items.length} 个去过的地方`} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <PrimaryButton label="记录足迹" icon="add" onPress={() => open()} />
        <StateView loading={loading} error={error} onRetry={load} />
        {items.map((item) => (
          <Pressable key={item.id} onLongPress={() => open(item)}>
            <SectionCard>
              <View style={styles.rowTop}>
                <View style={styles.flex}>
                  <View style={styles.rowWrap}>
                    <Text style={styles.itemTitle}>{item.location}</Text>
                    {item.coordinate ? <Tag label={`📍 ${item.coordinate}`} tone="blue" /> : null}
                  </View>
                  <Text style={styles.metaText}>{item.visit_date} · {'⭐'.repeat(Number(item.rating || 0))}</Text>
                  {item.image_url ? <Pressable onPress={() => setFullImage(buildAssetUrl(item.image_url))}><Image source={{ uri: buildAssetUrl(item.image_url) || '' }} style={styles.footprintImage} /></Pressable> : null}
                  {item.notes ? <Text style={styles.bodyText}>{item.notes}</Text> : null}
                </View>
              </View>
            </SectionCard>
          </Pressable>
        ))}
      </ScrollView>
      <EditFootprintModal modalOpen={modalOpen} setModalOpen={setModalOpen} selected={selected} form={form} setForm={setForm} uploading={uploading} pickImage={pickImage} save={save} remove={remove} />
      <Modal visible={!!fullImage} transparent animationType="fade" onRequestClose={() => setFullImage(null)}>
        <Pressable style={styles.fullImageBackdrop} onPress={() => setFullImage(null)}>
          {fullImage ? <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

function EditFootprintModal({ modalOpen, setModalOpen, selected, form, setForm, uploading, pickImage, save, remove }: any) {
  return (
    <Modal animationType="slide" visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
      <Screen>
        <Header title={selected ? '编辑足迹' : '记录新足迹'} action={<IconButton name="close" label="关闭" soft onPress={() => setModalOpen(false)} />} />
        <ScrollView contentContainerStyle={styles.content}>
          <Field label="地点" value={form.location} placeholder="例如：故宫博物院" onChangeText={(value) => setForm((cur: any) => ({ ...cur, location: value }))} />
          <Field label="城市 / 坐标" value={form.coordinate} placeholder="例如：北京" onChangeText={(value) => setForm((cur: any) => ({ ...cur, coordinate: value }))} />
          <DateField label="日期" value={form.visit_date} onChangeText={(value) => setForm((cur: any) => ({ ...cur, visit_date: value }))} />
          <SegmentedControl value={form.rating} onChange={(value) => setForm((cur: any) => ({ ...cur, rating: value }))} options={[1, 2, 3, 4, 5].map((value) => ({ label: '⭐'.repeat(value), value: String(value) }))} />
          <Field label="记录见闻" value={form.notes} multiline onChangeText={(value) => setForm((cur: any) => ({ ...cur, notes: value }))} />
          {form.image_url ? <Image source={{ uri: buildAssetUrl(form.image_url) || form.image_url }} style={styles.previewImage} /> : null}
          <PrimaryButton label={uploading ? '上传中' : '选择照片'} icon="image-outline" tone="plain" onPress={pickImage} />
          <PrimaryButton label="保存足迹" icon="checkmark" disabled={!form.location.trim()} onPress={() => void save()} />
          {selected ? <PrimaryButton label="删除足迹" icon="trash-outline" tone="danger" onPress={remove} /> : null}
        </ScrollView>
      </Screen>
    </Modal>
  );
}

const readingStatus = { to_read: '想读', reading: '在读', finished: '已读' };

export function ReadingScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>('/extras/readings/');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ title: '', author: '', status: 'to_read', rating: '5', notes: '' });
  const stats = { total: items.length, reading: items.filter((i) => i.status === 'reading').length, finished: items.filter((i) => i.status === 'finished').length };
  const open = (item?: Item) => {
    setEditing(item || null);
    setForm({ title: item?.title || '', author: item?.author || '', status: item?.status || 'to_read', rating: String(item?.rating || 5), notes: item?.notes || '' });
    setModalOpen(true);
  };
  const save = async () => {
    await apiRequest(editing ? `/extras/readings/${editing.id}` : '/extras/readings/', { method: editing ? 'PUT' : 'POST', body: { title: form.title.trim(), author: form.author.trim() || null, status: form.status, rating: form.status === 'finished' ? Number(form.rating) : null, notes: form.notes.trim() || null } });
    setModalOpen(false);
    await load();
  };

  const remove = async () => {
    if (!editing) return;
    confirmRemove(editing.title, async () => {
      await apiRequest(`/extras/readings/${editing.id}`, { method: 'DELETE' });
      setModalOpen(false);
      await load();
    });
  };

  return (
    <ScreenShell title="阅读" subtitle="腹有诗书气自华" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <PrimaryButton label="录入新书籍" icon="add" onPress={() => open()} />
        <SectionCard style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: spacing.xl }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '800', marginBottom: 4 }}>总藏书量</Text>
            <Text style={{ fontSize: 28, color: colors.text, fontWeight: '900' }}>{stats.total}</Text>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: colors.border, opacity: 0.5 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '800', marginBottom: 4 }}>正在阅读</Text>
            <Text style={{ fontSize: 28, color: colors.primary, fontWeight: '900' }}>{stats.reading}</Text>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: colors.border, opacity: 0.5 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.success, fontWeight: '800', marginBottom: 4 }}>已读完</Text>
            <Text style={{ fontSize: 28, color: colors.success, fontWeight: '900' }}>{stats.finished}</Text>
          </View>
        </SectionCard>
        <StateView loading={loading} error={error} onRetry={load} />
        {items.map((item) => (
          <Pressable key={item.id} onLongPress={() => open(item)}>
            <SectionCard>
              <View style={styles.rowTop}>
                <View style={styles.flex}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.metaText}>{item.author || '未知作者'}</Text>
                  <View style={styles.tagRow}>
                    <Tag label={readingStatus[item.status as keyof typeof readingStatus] || item.status} tone={item.status === 'finished' ? 'green' : item.status === 'reading' ? 'blue' : 'orange'} />
                    {item.status === 'finished' && item.rating ? <Tag label={'★'.repeat(Number(item.rating)) + '☆'.repeat(5 - Number(item.rating))} tone="orange" /> : null}
                  </View>
                  {item.notes ? <Text style={styles.bodyText}>{item.notes}</Text> : null}
                </View>
              </View>
            </SectionCard>
          </Pressable>
        ))}
      </ScrollView>
      <ReadingModal visible={modalOpen} onClose={() => setModalOpen(false)} editing={editing} form={form} setForm={setForm} save={save} remove={remove} />
    </ScreenShell>
  );
}

function ReadingModal({ visible, onClose, editing, form, setForm, save, remove }: any) {
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <Screen>
        <Header title={editing ? '编辑书籍' : '录入新书籍'} action={<IconButton name="close" label="关闭" soft onPress={onClose} />} />
        <ScrollView contentContainerStyle={styles.content}>
          <Field label="书名" value={form.title} onChangeText={(value) => setForm((cur: any) => ({ ...cur, title: value }))} />
          <Field label="作者" value={form.author} onChangeText={(value) => setForm((cur: any) => ({ ...cur, author: value }))} />
          <SegmentedControl value={form.status} onChange={(value) => setForm((cur: any) => ({ ...cur, status: value }))} options={Object.entries(readingStatus).map(([value, label]) => ({ value, label }))} />
          {form.status === 'finished' ? <SegmentedControl value={form.rating} onChange={(value) => setForm((cur: any) => ({ ...cur, rating: value }))} options={[1, 2, 3, 4, 5].map((value) => ({ label: `${value}星`, value: String(value) }))} /> : null}
          <Field label="笔记" value={form.notes} multiline onChangeText={(value) => setForm((cur: any) => ({ ...cur, notes: value }))} />
          <View style={styles.formActions}>
            {editing ? <PrimaryButton label="删除书籍" icon="trash-outline" tone="danger" onPress={remove} /> : null}
            <PrimaryButton label={editing ? '保存修改' : '确认录入'} icon="checkmark" disabled={!form.title.trim()} onPress={() => void save()} />
          </View>
        </ScrollView>
      </Screen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, gap: spacing.md, padding: spacing.lg, ...shadow },
  innerCard: { backgroundColor: colors.surfaceMuted, elevation: 0, shadowOpacity: 0 },
  selectedCard: { borderColor: colors.primary, borderWidth: 1 },
  completedCard: { backgroundColor: colors.successSoft },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  rowTop: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  rowWrap: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  modalScroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  modalFooter: { flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end', padding: spacing.lg, borderTopColor: colors.border, borderTopWidth: 1, backgroundColor: colors.surface },
  iconColumn: { alignItems: 'center', gap: spacing.xs },
  itemTitle: { color: colors.text, fontSize: 17, fontWeight: '900', lineHeight: 23 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  bodyText: { color: colors.textSoft, fontSize: 14, lineHeight: 21 },
  metaText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emojiImage: { width: 34, height: 34 },
  bigEmojiImage: { width: 34, height: 34 },
  timeline: { gap: spacing.md },
  splitStack: { gap: spacing.md },
  tagRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { alignSelf: 'flex-start', borderRadius: radius.sm, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: 3 },
  tag_gray: { backgroundColor: colors.surfaceMuted, color: colors.textSoft },
  tag_blue: { backgroundColor: colors.primarySoft, color: colors.primary },
  tag_green: { backgroundColor: colors.successSoft, color: colors.success },
  tag_red: { backgroundColor: colors.dangerSoft, color: colors.danger },
  tag_purple: { backgroundColor: '#F3E8FF', color: '#7E22CE' },
  tag_orange: { backgroundColor: colors.warningSoft, color: colors.warning },
  staffCard: { backgroundColor: '#FBFAFF' },
  staff: { height: 220, position: 'relative' },
  staffLine: { backgroundColor: '#DDD6FE', height: 1, marginTop: 34, opacity: 0.8 },
  staffPoint: { alignItems: 'center', position: 'absolute', width: 42, gap: 4 },
  staffEmoji: { fontSize: 24 },
  staffEmojiImage: { width: 24, height: 24 },
  staffTime: { color: colors.faint, fontSize: 9, textAlign: 'center' },
  moodPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  moodButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing.md, width: 86 },
  moodButtonSelected: { backgroundColor: '#F3E8FF', borderColor: '#C084FC', borderWidth: 2 },
  moodLabel: { color: colors.textSoft, fontSize: 12, fontWeight: '800' },
  formLabel: { color: colors.textSoft, fontSize: 13, fontWeight: '900', marginBottom: spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 9999, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pillSelected: { backgroundColor: colors.text, borderColor: colors.text },
  pillText: { color: colors.textSoft, fontSize: 13, fontWeight: '800' },
  pillTextSelected: { color: '#fff' },
  miniMood: { alignItems: 'center', borderRadius: 9999, height: 40, justifyContent: 'center', width: 40 },
  input: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.text, fontSize: 16, minHeight: 52, paddingHorizontal: spacing.lg },
  textArea: { minHeight: 150, paddingTop: spacing.md },
  formRow: { gap: spacing.md },
  formActions: { flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' },
  group: { gap: spacing.md },
  groupTitle: { color: colors.textSoft, fontSize: 14, fontWeight: '900' },
  detailBlock: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.md },
  detail: { borderRadius: radius.md, gap: spacing.xs, padding: spacing.md },
  detail_gray: { backgroundColor: colors.surfaceMuted },
  detail_green: { backgroundColor: colors.successSoft },
  detail_red: { backgroundColor: colors.dangerSoft },
  detail_blue: { backgroundColor: colors.primarySoft },
  detailLabel: { color: colors.textSoft, fontSize: 12, fontWeight: '900' },
  statsGrid: { gap: spacing.md },
  statCard: { gap: spacing.xs },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  statValue: { color: colors.text, fontSize: 26, fontWeight: '900' },
  metricLine: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  metricValue: { color: colors.text, fontSize: 13, fontWeight: '900' },
  progressTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 9999, height: 10, overflow: 'hidden' },
  progressFill: { borderRadius: 9999, height: '100%' },
  quickAdd: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  quickInput: { backgroundColor: colors.surface, borderRadius: radius.lg, color: colors.text, flex: 1, fontSize: 16, minHeight: 52, paddingHorizontal: spacing.lg, ...shadow },
  addButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.lg, height: 52, justifyContent: 'center', width: 52 },
  checkCircle: { alignItems: 'center', borderColor: colors.faint, borderRadius: 12, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 },
  checkCircleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  completedText: { color: colors.faint, textDecorationLine: 'line-through' },
  footprintImage: { backgroundColor: colors.border, borderRadius: radius.lg, height: 180, marginTop: spacing.md, width: '100%' },
  previewImage: { backgroundColor: colors.border, borderRadius: radius.lg, height: 220, width: '100%' },
  fullImageBackdrop: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)', flex: 1, justifyContent: 'center', padding: spacing.lg },
  fullImage: { height: '90%', width: '100%' },
});
