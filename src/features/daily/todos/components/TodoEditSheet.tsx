import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';
import { Text, View } from 'react-native';

import { DateField, Field, FormSheet, PrimaryButton } from '@/src/shared/components';
import { spacing } from '@/src/shared/theme';
import { styles } from '../styles';
import type { TodoEditForm } from '../types';

export function TodoEditSheet({
  bottomSheetRef,
  form,
  saving,
  onChange,
  onCancel,
  onDelete,
  onSave,
}: {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  form: TodoEditForm;
  saving: boolean;
  onChange: (key: keyof TodoEditForm, value: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  return (
    <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
        <Text style={styles.sheetTitle}>编辑待办</Text>
        <View style={{ height: spacing.lg }} />
        <Field label="标题" value={form.title} onChangeText={(value) => onChange('title', value)} />
        <View style={styles.formRow}>
          <View style={styles.formColumn}>
            <DateField label="日期" value={form.due_date} onChangeText={(value) => onChange('due_date', value)} optional />
          </View>
          <View style={styles.formColumn}>
            <Field label="时间" value={form.due_time} placeholder="例如：下午2点" onChangeText={(value) => onChange('due_time', value)} />
          </View>
        </View>
        <Field label="地点" value={form.location} placeholder="例如：办公室" onChangeText={(value) => onChange('location', value)} />
        <Field
          label="备注说明"
          value={form.description}
          placeholder="添加更多详细说明..."
          multiline
          onChangeText={(value) => onChange('description', value)}
        />
        <View style={styles.formActions}>
          <PrimaryButton label="删除" tone="danger" onPress={onDelete} />
          <PrimaryButton label="取消" tone="plain" onPress={onCancel} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={saving ? '保存中' : '保存修改'} icon="checkmark" disabled={saving || !form.title.trim()} onPress={onSave} />
          </View>
        </View>
    </FormSheet>
  );
}
