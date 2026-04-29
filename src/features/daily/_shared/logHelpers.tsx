import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { styles } from './styles';
import { Item, SectionCard, Tag, compactDateTime, today } from './ReplicatedScreens';

export function groupByDate(items: Item[], dateGetter: (item: Item) => string) {
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

export function GroupedLogList({ groups, onLongPress }: { groups: ReturnType<typeof groupByDate>; onLongPress: (item: Item) => void }) {
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

export function Detail({ label, value, tone = 'gray' }: { label: string; value?: string | null; tone?: 'gray' | 'green' | 'red' | 'blue' }) {
  if (!value) return null;
  return (
    <View style={[styles.detail, styles[`detail_${tone}`]]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.bodyText}>{value}</Text>
    </View>
  );
}
