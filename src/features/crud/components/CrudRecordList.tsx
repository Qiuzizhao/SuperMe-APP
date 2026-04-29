import { Ionicons } from '@expo/vector-icons';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { buildAssetUrl } from '@/src/shared/api';
import { Card, Field, IconButton, StateView } from '@/src/shared/components';
import { colors } from '@/src/shared/theme';
import { styles } from '../styles';
import type { ModuleConfig, RecordItem } from '../types';
import { getItemTitle, itemMeta } from '../utils';

export function CrudRecordList({
  config,
  items,
  filteredItems,
  loading,
  refreshing,
  error,
  query,
  onQueryChange,
  onRefresh,
  onRetry,
  onEdit,
  onDelete,
}: {
  config: ModuleConfig;
  items: RecordItem[];
  filteredItems: RecordItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
  onRetry: () => void;
  onEdit: (item: RecordItem) => void;
  onDelete: (item: RecordItem) => void;
}) {
  return (
    <>
      {!loading && !error && items.length > 0 ? (
        <View style={styles.searchBox}>
          <Field label="搜索" value={query} placeholder={`搜索${config.title}`} onChangeText={onQueryChange} />
        </View>
      ) : null}
      <StateView
        loading={loading}
        error={error}
        empty={!loading && (items.length === 0 || filteredItems.length === 0) ? (items.length === 0 ? config.emptyText : '没有匹配的记录') : undefined}
        onRetry={onRetry}
      />
      {!loading && !error ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const imageUrl = buildAssetUrl(item.image_url);
            const renderRightActions = () => (
              <View style={styles.swipeActions}>
                <IconButton name="create-outline" label="编辑" onPress={() => onEdit(item)} />
                <IconButton name="trash-outline" label="删除" color={colors.danger} onPress={() => onDelete(item)} />
              </View>
            );

            return (
              <Swipeable renderRightActions={renderRightActions} containerStyle={styles.swipeContainer}>
                <Card>
                  <View style={styles.itemRow}>
                    {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.thumb} /> : (
                      <View style={[styles.itemIcon, { backgroundColor: `${config.accent}18` }]}>
                        <Ionicons name={config.icon} size={24} color={config.accent} />
                      </View>
                    )}
                    <Pressable style={styles.itemMain} onPress={() => onEdit(item)}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{getItemTitle(config, item)}</Text>
                        {config.dateField && item[config.dateField] ? <Text style={styles.badge}>{String(item[config.dateField])}</Text> : null}
                      </View>
                      <Text style={styles.itemDetail} numberOfLines={3}>{itemMeta(config, item) || '点击编辑详情'}</Text>
                    </Pressable>
                  </View>
                </Card>
              </Swipeable>
            );
          }}
        />
      ) : null}
    </>
  );
}
