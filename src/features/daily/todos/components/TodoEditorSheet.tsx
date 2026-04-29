import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';
import { Text, View } from 'react-native';

import { DateField, Field, FormSheet, PrimaryButton } from '@/src/shared/components';
import { spacing } from '@/src/shared/theme';
import { styles } from '../styles';
import type { TodoCategory, TodoEditForm } from '../types';

export function TodoEditorSheet({
  bottomSheetRef,
  activeCategory,
  newTitle,
  selectedDate,
  editForm,
  saving,
  onTitleChange,
  onSelectedDateChange,
  onEditFormChange,
  onCancel,
  onAdd,
}: {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  activeCategory: TodoCategory;
  newTitle: string;
  selectedDate: string | null;
  editForm: TodoEditForm;
  saving: boolean;
  onTitleChange: (value: string) => void;
  onSelectedDateChange: (value: string) => void;
  onEditFormChange: (key: keyof TodoEditForm, value: string) => void;
  onCancel: () => void;
  onAdd: () => void;
}) {
  return (
    <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
        <Text style={styles.sheetTitle}>新增{activeCategory === 'work' ? '工作' : '生活'}待办</Text>
        <View style={{ height: spacing.lg }} />
        <Field label="标题" value={newTitle} onChangeText={onTitleChange} placeholder="准备做什么..." />
        <View style={styles.formRow}>
          <View style={styles.formColumn}>
            <DateField label="日期" value={selectedDate || ''} onChangeText={onSelectedDateChange} optional />
          </View>
          <View style={styles.formColumn}>
            <Field label="时间" value={editForm.due_time} placeholder="例如：下午2点" onChangeText={(value) => onEditFormChange('due_time', value)} />
          </View>
        </View>
        <Field label="地点" value={editForm.location} placeholder="例如：办公室" onChangeText={(value) => onEditFormChange('location', value)} />
        <Field
          label="备注说明"
          value={editForm.description}
          placeholder="添加更多详细说明..."
          multiline
          onChangeText={(value) => onEditFormChange('description', value)}
        />
        <View style={styles.formActions}>
          <PrimaryButton label="取消" tone="plain" onPress={onCancel} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={saving ? '保存中' : '添加'} icon="checkmark" disabled={saving || !newTitle.trim()} onPress={onAdd} />
          </View>
        </View>
    </FormSheet>
  );
}
