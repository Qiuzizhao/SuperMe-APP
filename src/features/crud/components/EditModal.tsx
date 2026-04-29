import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Text, View } from 'react-native';

import { buildAssetUrl, uploadImage } from '@/src/shared/api';
import { DateField, Field, FormSheet, PrimaryButton, SegmentedControl } from '@/src/shared/components';
import { spacing } from '@/src/shared/theme';
import { styles } from '../styles';
import type { EditModalProps, FieldConfig } from '../types';
import { labelFor } from '../utils';

export function EditModal({ config, bottomSheetRef, editing, form, saving, onChange, onClose, onSave }: EditModalProps) {
  const pickImage = async (field: FieldConfig) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要权限', '请允许访问相册后再上传图片。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    try {
      const uploaded = await uploadImage(result.assets[0].uri);
      onChange(field.key, uploaded.url);
    } catch (err) {
      Alert.alert('上传失败', err instanceof Error ? err.message : '请稍后重试');
    }
  };

  return (
    <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
      <Text style={styles.sheetTitle}>{editing ? '编辑记录' : '新增记录'}</Text>
      <Text style={styles.modalSubtitle}>{config.title}</Text>
      <View style={{ height: spacing.lg }} />
      {config.fields.map((field) => {
        if (field.type === 'select' || field.type === 'boolean') {
          const options = field.options || [];
          return (
            <View key={field.key} style={styles.formBlock}>
              <Text style={styles.label}>{field.label}</Text>
              <SegmentedControl value={form[field.key] || options[0]?.value || ''} options={options} onChange={(value) => onChange(field.key, value)} />
            </View>
          );
        }
        if (field.type === 'image') {
          const imageUrl = buildAssetUrl(form[field.key]);
          return (
            <View key={field.key} style={styles.formBlock}>
              <Text style={styles.label}>{field.label}</Text>
              {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.preview} /> : null}
              <PrimaryButton label="选择并上传图片" icon="image-outline" tone="plain" onPress={() => pickImage(field)} />
            </View>
          );
        }
        if (field.type === 'date') {
          return (
            <DateField
              key={field.key}
              label={labelFor(config, field.key)}
              value={form[field.key] || ''}
              onChangeText={(value) => onChange(field.key, value)}
              optional={!field.required}
            />
          );
        }
        return (
          <Field
            key={field.key}
            label={field.label}
            value={form[field.key] || ''}
            keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
            multiline={field.type === 'multiline'}
            onChangeText={(value) => onChange(field.key, value)}
          />
        );
      })}
      <View style={styles.modalFooter}>
        <PrimaryButton label="取消" tone="plain" onPress={onClose} />
        <View style={{ flex: 1 }}>
          <PrimaryButton label={saving ? '保存中' : '保存'} icon="checkmark" disabled={saving} onPress={onSave} />
        </View>
      </View>
    </FormSheet>
  );
}
