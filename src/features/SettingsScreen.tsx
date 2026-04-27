import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, TextInput, LayoutAnimation, Platform, ActionSheetIOS } from 'react-native';

import { Card, Header, IconButton, PrimaryButton, Screen, StateView, SegmentedControl } from '@/src/components/ui';
import { useAuth } from '@/src/auth/AuthContext';
import { API_URL, apiRequest } from '@/src/lib/api';
import { colors, radius, spacing } from '@/src/theme';
import { normalizeIncomeConfig } from '../utils/incomeConfig';

type FinanceBill = {
  id: number;
  name: string;
  categories: { id: number; name: string; subcategories: { id: number; name: string }[] }[];
};

const getTagHexColor = (tag: string) => {
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
};

const getTagSoftColor = (tag: string) => {
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 95%)`;
};

export function SettingsScreen() {
  const { username, logout } = useAuth();
  
  const [expenseTree, setExpenseTree] = useState<FinanceBill[]>([]);
  const [configs, setConfigs] = useState<any>({
    finance_income_categories: [],
    finance_income_net_cats: [],
    finance_income_total_cats: [],
    finance_income_gross_cats: [],
    note_tags: [],
    teaching_class_types: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expense Tree states for mobile accordion UI
  const [expandedBillIdx, setExpandedBillIdx] = useState<number | null>(null);
  const [expandedCatIdx, setExpandedCatIdx] = useState<number | null>(null);
  
  const [newBill, setNewBill] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newSubcat, setNewSubcat] = useState('');

  const [newItems, setNewItems] = useState({
    finance_income_categories: '',
    note_tags: '',
    teaching_class_types: ''
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    expense: false,
    income: false,
    note: false,
    class: false,
  });

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const [tree, data] = await Promise.all([
        apiRequest<FinanceBill[]>('/finances/tree/bills'),
        apiRequest<any>('/configs/'),
      ]);
      setExpenseTree(tree);
      
      const incomeConfigs = normalizeIncomeConfig(data);
      setConfigs({
        ...incomeConfigs,
        note_tags: data.note_tags || [],
        teaching_class_types: data.teaching_class_types || []
      });
      
      setExpandedBillIdx(null);
      setExpandedCatIdx(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveConfigs = async () => {
    setSaving(true);
    try {
      const normalizedIncomeConfigs = normalizeIncomeConfig(configs);
      const payload = {
        ...configs,
        ...normalizedIncomeConfigs
      };
      await apiRequest('/configs/', { method: 'POST', body: payload });
      setConfigs(payload);
      Alert.alert('已保存', '配置已更新。');
    } catch (err) {
      Alert.alert('保存失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (key: string) => {
    const value = (newItems as any)[key]?.trim();
    if (!value) return;
    
    if (configs[key].includes(value)) {
      setNewItems(prev => ({ ...prev, [key]: '' }));
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setConfigs((prev: any) => {
      const next = { ...prev, [key]: [...prev[key], value] };
      if (key === 'finance_income_categories') {
        next.finance_income_net_cats = [...(prev.finance_income_net_cats || []), value];
      }
      return next;
    });
    setNewItems(prev => ({ ...prev, [key]: '' }));
  };

  const handleRemoveItem = (key: string, itemToRemove: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setConfigs((prev: any) => {
      const newConfigs = {
        ...prev,
        [key]: prev[key].filter((item: string) => item !== itemToRemove)
      };
      
      if (key === 'finance_income_categories') {
        newConfigs.finance_income_net_cats = (prev.finance_income_net_cats || []).filter((item: string) => item !== itemToRemove);
        newConfigs.finance_income_total_cats = (prev.finance_income_total_cats || []).filter((item: string) => item !== itemToRemove);
        newConfigs.finance_income_gross_cats = (prev.finance_income_gross_cats || []).filter((item: string) => item !== itemToRemove);
      }
      return newConfigs;
    });
  };

  const handleCategoryLevelChange = (cat: string, newLevel: string) => {
    setConfigs((prev: any) => {
      const net = (prev.finance_income_net_cats || []).filter((item: string) => item !== cat);
      const total = (prev.finance_income_total_cats || []).filter((item: string) => item !== cat);
      const gross = (prev.finance_income_gross_cats || []).filter((item: string) => item !== cat);

      if (newLevel === 'net') net.push(cat);
      if (newLevel === 'total') total.push(cat);
      if (newLevel === 'gross') gross.push(cat);

      return {
        ...prev,
        finance_income_net_cats: net,
        finance_income_total_cats: total,
        finance_income_gross_cats: gross
      };
    });
  };

  // --- Expense Tree API Handlers ---
  const handleAddBill = async () => {
    const val = newBill.trim();
    if (!val || expenseTree.some(b => b.name === val)) return;
    try {
      const res = await apiRequest<FinanceBill>('/finances/tree/bills', {
        method: 'POST',
        body: { name: val }
      });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpenseTree(prev => [...prev, { ...res, categories: [] }]);
      setNewBill('');
    } catch (e) {
      Alert.alert('新增失败', e instanceof Error ? e.message : '请稍后重试');
    }
  };

  const handleRemoveBill = (idx: number) => {
    const bill = expenseTree[idx];
    Alert.alert('删除账本', `确定删除「${bill.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
          try {
            await apiRequest(`/finances/tree/bills/${bill.id}`, { method: 'DELETE' });
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const updated = [...expenseTree];
            updated.splice(idx, 1);
            setExpenseTree(updated);
            if (expandedBillIdx === idx) {
              setExpandedBillIdx(null);
              setExpandedCatIdx(null);
            } else if (expandedBillIdx && expandedBillIdx > idx) {
              setExpandedBillIdx(expandedBillIdx - 1);
            }
          } catch (e) {
             Alert.alert('删除失败', e instanceof Error ? e.message : '请稍后重试');
          }
      }}
    ]);
  };

  const handleAddCat = async (billIdx: number) => {
    const val = newCat.trim();
    if (!val) return;
    const bill = expenseTree[billIdx];
    if (bill.categories.some(c => c.name === val)) return;
    
    try {
      const res = await apiRequest<any>('/finances/tree/categories', {
        method: 'POST',
        body: { name: val, bill_id: bill.id }
      });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const updated = [...expenseTree];
      updated[billIdx].categories.push({ ...res, subcategories: [] });
      setExpenseTree(updated);
      setNewCat('');
    } catch (e) {
      Alert.alert('新增失败', e instanceof Error ? e.message : '请稍后重试');
    }
  };

  const handleRemoveCat = (billIdx: number, catIdx: number) => {
    const cat = expenseTree[billIdx].categories[catIdx];
    Alert.alert('删除类别', `确定删除「${cat.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
          try {
            await apiRequest(`/finances/tree/categories/${cat.id}`, { method: 'DELETE' });
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const updated = [...expenseTree];
            updated[billIdx].categories.splice(catIdx, 1);
            setExpenseTree(updated);
            if (expandedCatIdx === catIdx) {
              setExpandedCatIdx(null);
            } else if (expandedCatIdx && expandedCatIdx > catIdx) {
              setExpandedCatIdx(expandedCatIdx - 1);
            }
          } catch (e) {
             Alert.alert('删除失败', e instanceof Error ? e.message : '请稍后重试');
          }
      }}
    ]);
  };

  const handleAddSubcat = async (billIdx: number, catIdx: number) => {
    const val = newSubcat.trim();
    if (!val) return;
    const cat = expenseTree[billIdx].categories[catIdx];
    if (cat.subcategories.some(s => s.name === val)) return;

    try {
      const res = await apiRequest<any>('/finances/tree/subcategories', {
        method: 'POST',
        body: { name: val, category_id: cat.id }
      });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const updated = [...expenseTree];
      updated[billIdx].categories[catIdx].subcategories.push(res);
      setExpenseTree(updated);
      setNewSubcat('');
    } catch (e) {
      Alert.alert('新增失败', e instanceof Error ? e.message : '请稍后重试');
    }
  };

  const handleRemoveSubcat = (billIdx: number, catIdx: number, subcatIdx: number) => {
    const subcat = expenseTree[billIdx].categories[catIdx].subcategories[subcatIdx];
    Alert.alert('删除子类别', `确定删除「${subcat.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
          try {
            await apiRequest(`/finances/tree/subcategories/${subcat.id}`, { method: 'DELETE' });
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const updated = [...expenseTree];
            updated[billIdx].categories[catIdx].subcategories.splice(subcatIdx, 1);
            setExpenseTree(updated);
          } catch (e) {
             Alert.alert('删除失败', e instanceof Error ? e.message : '请稍后重试');
          }
      }}
    ]);
  };

  const toggleBill = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedBillIdx === idx) {
      setExpandedBillIdx(null);
      setExpandedCatIdx(null);
    } else {
      setExpandedBillIdx(idx);
      setExpandedCatIdx(null);
    }
  };

  const toggleCat = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedCatIdx === idx) {
      setExpandedCatIdx(null);
    } else {
      setExpandedCatIdx(idx);
    }
  };

  const showLevelSelector = (cat: string, currentLevel: string) => {
    const options = ['取消', '到手', '福利', '全包'];
    const levelMap: Record<string, string> = { '到手': 'net', '福利': 'total', '全包': 'gross' };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          title: `选择「${cat}」的统计口径`,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            handleCategoryLevelChange(cat, levelMap[options[buttonIndex]]);
          }
        }
      );
    } else {
      Alert.alert(`选择「${cat}」的统计口径`, undefined, [
        { text: '到手', onPress: () => handleCategoryLevelChange(cat, 'net') },
        { text: '福利', onPress: () => handleCategoryLevelChange(cat, 'total') },
        { text: '全包', onPress: () => handleCategoryLevelChange(cat, 'gross') },
        { text: '取消', style: 'cancel' }
      ]);
    }
  };

  // --- UI Render Helpers ---
  const renderTags = (key: string, items: string[], placeholder: string) => {
    return (
      <View style={styles.sectionBlock}>
        <View style={styles.tagsContainer}>
          {items.map((tag) => {
            const hex = getTagHexColor(tag);
            const softHex = getTagSoftColor(tag);
            return (
              <View key={tag} style={[styles.tagBadge, { backgroundColor: softHex, borderColor: hex }]}>
                <Text style={[styles.tagBadgeText, { color: hex }]}>{tag}</Text>
                <Pressable onPress={() => handleRemoveItem(key, tag)} style={styles.tagRemove} hitSlop={10}>
                  <Ionicons name="close" size={14} color={hex} />
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder={placeholder}
            placeholderTextColor={colors.faint}
            value={(newItems as any)[key]}
            onChangeText={(text) => setNewItems(prev => ({ ...prev, [key]: text }))}
            onSubmitEditing={() => handleAddItem(key)}
          />
          <Pressable onPress={() => handleAddItem(key)} style={styles.addBtnMobile}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <Header 
        title="设置" 
        subtitle="系统配置与参数" 
        action={<PrimaryButton label={saving ? "保存中" : "保存设置"} icon="save-outline" disabled={saving} onPress={handleSaveConfigs} />}
      />
      <StateView loading={loading} error={error} onRetry={load} />
      
      {!loading && !error ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* 账户信息 */}
          <Card>
            <View style={styles.accountRow}>
              <View style={styles.accountIcon}>
                <Ionicons name="person-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.accountMain}>
                <Text style={styles.accountName}>{username || 'SuperMe'}</Text>
                <Text style={styles.metaText} numberOfLines={1}>{API_URL}</Text>
              </View>
              <IconButton name="log-out-outline" label="退出登录" soft onPress={() => void logout()} />
            </View>
          </Card>

          {/* 移动端优化后的 支出类别管理 (Accordion) */}
          <Card>
            <Pressable onPress={() => toggleSection('expense')} style={styles.sectionHeader}>
              <View style={styles.sectionHeaderTitle}>
                <Text style={[styles.cardTitle, { marginBottom: spacing.xs }]}>支出类别</Text>
                <Text style={[styles.helperText, { marginBottom: 0 }]}>层级联动的分类管理：账单 ➔ 类别 ➔ 子类别</Text>
              </View>
              <Ionicons name={expandedSections.expense ? "chevron-up" : "chevron-down"} size={24} color={colors.muted} />
            </Pressable>
            
            {expandedSections.expense && (
              <View style={styles.sectionContent}>
                <View style={styles.accordionContainer}>
              {expenseTree.map((bill, bIdx) => {
                const isBillExpanded = expandedBillIdx === bIdx;
                return (
                  <View key={bill.id} style={styles.accordionGroup}>
                    {/* Bill Header */}
                    <View style={[styles.accordionHeader, isBillExpanded && styles.accordionHeaderActive]}>
                      <Pressable style={styles.accordionTitleRow} onPress={() => toggleBill(bIdx)}>
                        <Ionicons name={isBillExpanded ? "chevron-down" : "chevron-forward"} size={20} color={isBillExpanded ? colors.primary : colors.text} />
                        <Text style={[styles.accordionTitleText, isBillExpanded && { color: colors.primary }]}>
                          {bill.name}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemoveBill(bIdx)} hitSlop={10} style={styles.deleteIcon}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </Pressable>
                    </View>

                    {/* Categories List (Expanded) */}
                    {isBillExpanded && (
                      <View style={styles.accordionContentLevel1}>
                        {bill.categories.map((cat, cIdx) => {
                          const isCatExpanded = expandedCatIdx === cIdx;
                          return (
                            <View key={cat.id} style={styles.accordionGroupLevel2}>
                              {/* Category Header */}
                              <View style={[styles.accordionHeaderLevel2, isCatExpanded && styles.accordionHeaderActiveLevel2]}>
                                <Pressable style={styles.accordionTitleRow} onPress={() => toggleCat(cIdx)}>
                                  <Ionicons name={isCatExpanded ? "chevron-down" : "chevron-forward"} size={18} color={isCatExpanded ? colors.primary : colors.textSoft} />
                                  <Text style={[styles.accordionTitleTextLevel2, isCatExpanded && { color: colors.primary }]}>
                                    {cat.name}
                                  </Text>
                                </Pressable>
                                <Pressable onPress={() => handleRemoveCat(bIdx, cIdx)} hitSlop={10} style={styles.deleteIcon}>
                                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                                </Pressable>
                              </View>

                              {/* Subcategories List (Expanded) */}
                              {isCatExpanded && (
                                <View style={styles.accordionContentLevel2}>
                                  {cat.subcategories.map((subcat, sIdx) => (
                                    <View key={subcat.id} style={styles.subcatRow}>
                                      <Text style={styles.subcatText}>{subcat.name}</Text>
                                      <Pressable onPress={() => handleRemoveSubcat(bIdx, cIdx, sIdx)} hitSlop={10}>
                                        <Ionicons name="trash-outline" size={14} color={colors.danger} />
                                      </Pressable>
                                    </View>
                                  ))}
                                  
                                  {/* Add Subcategory Input */}
                                  <View style={styles.treeAddRowMobile}>
                                    <TextInput 
                                      style={styles.treeInputMobile} 
                                      placeholder="添加子类别..." 
                                      placeholderTextColor={colors.faint} 
                                      value={newSubcat} 
                                      onChangeText={setNewSubcat} 
                                      onSubmitEditing={() => handleAddSubcat(bIdx, cIdx)} 
                                    />
                                    <Pressable onPress={() => handleAddSubcat(bIdx, cIdx)} style={styles.treeAddBtnMobile}>
                                      <Ionicons name="add" size={16} color={colors.primary} />
                                    </Pressable>
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })}

                        {/* Add Category Input */}
                        <View style={[styles.treeAddRowMobile, { marginLeft: 12, marginTop: 8 }]}>
                          <TextInput 
                            style={styles.treeInputMobile} 
                            placeholder="添加新类别..." 
                            placeholderTextColor={colors.faint} 
                            value={newCat} 
                            onChangeText={setNewCat} 
                            onSubmitEditing={() => handleAddCat(bIdx)} 
                          />
                          <Pressable onPress={() => handleAddCat(bIdx)} style={styles.treeAddBtnMobile}>
                            <Ionicons name="add" size={16} color={colors.primary} />
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Add Bill Input */}
              <View style={[styles.treeAddRowMobile, { marginTop: spacing.md }]}>
                <TextInput 
                  style={[styles.treeInputMobile, { backgroundColor: colors.surfaceMuted, height: 44 }]} 
                  placeholder="添加新账单..." 
                  placeholderTextColor={colors.faint} 
                  value={newBill} 
                  onChangeText={setNewBill} 
                  onSubmitEditing={handleAddBill} 
                />
                <Pressable onPress={handleAddBill} style={[styles.treeAddBtnMobile, { height: 44, width: 44, backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>
              </View>
            )}
          </Card>

          {/* 收入类别口径配置 */}
          <Card>
            <Pressable onPress={() => toggleSection('income')} style={styles.sectionHeader}>
              <View style={styles.sectionHeaderTitle}>
                <Text style={[styles.cardTitle, { marginBottom: spacing.xs }]}>收入类别口径</Text>
                <Text style={[styles.helperText, { marginBottom: 0 }]}>决定收入项在分析报表中的计算逻辑。</Text>
              </View>
              <Ionicons name={expandedSections.income ? "chevron-up" : "chevron-down"} size={24} color={colors.muted} />
            </Pressable>
            
            {expandedSections.income && (
              <View style={styles.sectionContent}>
                <View style={styles.incomeCatList}>
              {configs.finance_income_categories.map((cat: string) => {
                let level = 'net';
                if (configs.finance_income_total_cats?.includes(cat)) level = 'total';
                if (configs.finance_income_gross_cats?.includes(cat)) level = 'gross';
                const hex = getTagHexColor(cat);
                const softHex = getTagSoftColor(cat);

                const levelLabel = level === 'net' ? '到手' : level === 'total' ? '福利' : '全包';

                return (
                  <View key={cat} style={styles.incomeCatRowCompact}>
                    <View style={[styles.tagBadgeCompact, { backgroundColor: softHex, borderColor: hex }]}>
                      <Text style={[styles.tagBadgeText, { color: hex }]}>{cat}</Text>
                      <Pressable onPress={() => handleRemoveItem('finance_income_categories', cat)} style={styles.tagRemove} hitSlop={10}>
                        <Ionicons name="close" size={14} color={hex} />
                      </Pressable>
                    </View>
                    
                    <Pressable 
                      style={styles.levelSelectorBtn}
                      onPress={() => showLevelSelector(cat, level)}
                    >
                      <Text style={styles.levelSelectorText}>{levelLabel}</Text>
                      <Ionicons name="chevron-down" size={16} color={colors.textSoft} />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={[styles.treeAddRowMobile, { marginTop: spacing.md, paddingHorizontal: 0 }]}>
              <TextInput
                style={[styles.treeInputMobile, { backgroundColor: colors.surfaceMuted, height: 44 }]}
                placeholder="输入新收入类别..."
                placeholderTextColor={colors.faint}
                value={newItems.finance_income_categories}
                onChangeText={(text) => setNewItems(prev => ({ ...prev, finance_income_categories: text }))}
                onSubmitEditing={() => handleAddItem('finance_income_categories')}
              />
              <Pressable onPress={() => handleAddItem('finance_income_categories')} style={[styles.treeAddBtnMobile, { height: 44, width: 44, backgroundColor: colors.primarySoft }]}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>
              </View>
            )}
          </Card>

          {/* 随手记标签 */}
          <Card>
            <Pressable onPress={() => toggleSection('note')} style={styles.sectionHeader}>
              <View style={styles.sectionHeaderTitle}>
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>随手记标签</Text>
              </View>
              <Ionicons name={expandedSections.note ? "chevron-up" : "chevron-down"} size={24} color={colors.muted} />
            </Pressable>
            {expandedSections.note && (
              <View style={styles.sectionContent}>
                {renderTags('note_tags', configs.note_tags, '输入新标签...')}
              </View>
            )}
          </Card>

          {/* 课堂类型标签 */}
          <Card>
            <Pressable onPress={() => toggleSection('class')} style={styles.sectionHeader}>
              <View style={styles.sectionHeaderTitle}>
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>课堂类型标签</Text>
              </View>
              <Ionicons name={expandedSections.class ? "chevron-up" : "chevron-down"} size={24} color={colors.muted} />
            </Pressable>
            {expandedSections.class && (
              <View style={styles.sectionContent}>
                {renderTags('teaching_class_types', configs.teaching_class_types, '输入新类型...')}
              </View>
            )}
          </Card>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 0,
  },
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  accountIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  accountMain: {
    flex: 1,
  },
  accountName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: {
    flex: 1,
    paddingRight: spacing.md,
  },
  sectionContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },

  // Tags UI
  sectionBlock: {
    marginTop: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  tagBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tagRemove: {
    marginLeft: 6,
    opacity: 0.7,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    color: colors.text,
    fontSize: 15,
    height: 44,
    paddingHorizontal: spacing.md,
  },
  addBtnMobile: {
    height: 44,
    width: 44,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Income Category Levels
  incomeCatList: {
    gap: spacing.sm,
  },
  incomeCatRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  levelSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  levelSelectorText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  // Accordion Expense Tree UI
  accordionContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  accordionGroup: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  accordionHeaderActive: {
    backgroundColor: colors.primarySoft,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  accordionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  accordionMetaText: {
    fontSize: 12,
    color: colors.muted,
    marginLeft: 'auto',
    marginRight: spacing.sm,
  },
  deleteIcon: {
    padding: 4,
  },
  accordionContentLevel1: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.sm,
  },
  
  // Level 2 Categories
  accordionGroupLevel2: {
    marginLeft: spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
  },
  accordionHeaderLevel2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  accordionHeaderActiveLevel2: {
    backgroundColor: colors.surface,
  },
  accordionTitleTextLevel2: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSoft,
  },
  accordionContentLevel2: {
    marginLeft: spacing.lg,
    paddingVertical: spacing.xs,
  },

  // Level 3 Subcategories
  subcatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  subcatText: {
    fontSize: 14,
    color: colors.textSoft,
  },

  // Tree Inputs Mobile
  treeAddRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  treeInputMobile: {
    flex: 1,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  treeAddBtnMobile: {
    height: 36,
    width: 36,
    backgroundColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
