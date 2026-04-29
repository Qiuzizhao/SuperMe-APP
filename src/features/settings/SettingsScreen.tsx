import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, LayoutAnimation, Platform, RefreshControl, ScrollView, View } from 'react-native';

import { Header, Screen, StateView } from '@/src/shared/components';
import { useAuth } from '@/src/auth/AuthContext';
import { normalizeIncomeConfig } from '@/src/shared/utils/incomeConfig';
import {
  createBill,
  createCategory,
  createSubcategory,
  deleteBill,
  deleteCategory,
  deleteSubcategory,
  fetchExpenseTree,
  fetchSettingsConfig,
  saveSettingsConfig,
} from './api';
import { AccountCard, ExpenseTreeEditor, IncomeCategoryEditor, SettingsDetailPanel, SettingsOverviewCard, TagEditor } from './components';
import { styles } from './styles';
import type { ConfigListKey, FinanceBill, IncomeLevel, NewConfigItems, SettingsConfig, SettingsPanelKey } from './types';
import { defaultSettingsConfig } from './utils';

const panelMeta: Record<SettingsPanelKey, {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof SettingsOverviewCard>['icon'];
  colors: [string, string];
}> = {
  expense: {
    title: '支出类别',
    subtitle: '账本、类别、子类别的层级配置',
    icon: 'wallet-outline',
    colors: ['#EAF2FF', '#F4EDFF'],
  },
  income: {
    title: '收入类别口径',
    subtitle: '配置收入分析里的到手、福利、全包',
    icon: 'trending-up-outline',
    colors: ['#EAFBF1', '#FFF7E6'],
  },
  note: {
    title: '随手记标签',
    subtitle: '为灵感和片段记录保留柔软索引',
    icon: 'pricetags-outline',
    colors: ['#FFF0F6', '#EEF6FF'],
  },
  class: {
    title: '课堂类型标签',
    subtitle: '整理课堂日志的类型与场景',
    icon: 'school-outline',
    colors: ['#F2FFF7', '#FFF7E6'],
  },
};

export function SettingsScreen() {
  const { username, logout } = useAuth();
  const [activePanel, setActivePanel] = useState<SettingsPanelKey | null>(null);
  const [expenseTree, setExpenseTree] = useState<FinanceBill[]>([]);
  const [configs, setConfigs] = useState<SettingsConfig>(defaultSettingsConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedBillIdx, setExpandedBillIdx] = useState<number | null>(null);
  const [expandedCatIdx, setExpandedCatIdx] = useState<number | null>(null);
  const [newBill, setNewBill] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newSubcat, setNewSubcat] = useState('');
  const [newItems, setNewItems] = useState<NewConfigItems>({
    finance_income_categories: '',
    note_tags: '',
    teaching_class_types: '',
  });

  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [tree, data] = await Promise.all([fetchExpenseTree(), fetchSettingsConfig()]);
      const incomeConfigs = normalizeIncomeConfig(data) as Pick<SettingsConfig, 'finance_income_categories' | 'finance_income_net_cats' | 'finance_income_total_cats' | 'finance_income_gross_cats'>;
      setExpenseTree(tree);
      setConfigs({
        ...defaultSettingsConfig,
        ...incomeConfigs,
        note_tags: data.note_tags || [],
        teaching_class_types: data.teaching_class_types || [],
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
      const payload = { ...configs, ...normalizedIncomeConfigs } as SettingsConfig;
      await saveSettingsConfig(payload);
      setConfigs(payload);
      Alert.alert('已保存', '配置已更新。');
    } catch (err) {
      Alert.alert('保存失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const overviewCards = useMemo(() => {
    const categoryCount = expenseTree.reduce((total, bill) => total + bill.categories.length, 0);
    const subcategoryCount = expenseTree.reduce((total, bill) => (
      total + bill.categories.reduce((catTotal, category) => catTotal + category.subcategories.length, 0)
    ), 0);
    const incomeNet = configs.finance_income_net_cats.length;
    const incomeTotal = configs.finance_income_total_cats.length;
    const incomeGross = configs.finance_income_gross_cats.length;

    return [
      {
        panel: 'expense' as const,
        meta: `${expenseTree.length} 个账本 / ${categoryCount} 个类别 / ${subcategoryCount} 个子类`,
        featured: true,
      },
      {
        panel: 'income' as const,
        meta: `${configs.finance_income_categories.length} 个收入类 / ${incomeNet}-${incomeTotal}-${incomeGross} 口径`,
      },
      {
        panel: 'note' as const,
        meta: `${configs.note_tags.length} 个标签`,
      },
      {
        panel: 'class' as const,
        meta: `${configs.teaching_class_types.length} 个课堂类型`,
      },
    ];
  }, [configs, expenseTree]);

  const openPanel = (panel: SettingsPanelKey) => {
    animate();
    setActivePanel(panel);
  };

  const closePanel = () => {
    animate();
    setActivePanel(null);
  };

  const handleAddItem = (key: ConfigListKey) => {
    const value = newItems[key].trim();
    if (!value) return;
    if (configs[key].includes(value)) {
      setNewItems((prev) => ({ ...prev, [key]: '' }));
      return;
    }

    animate();
    setConfigs((prev) => {
      const next = { ...prev, [key]: [...prev[key], value] };
      if (key === 'finance_income_categories') {
        next.finance_income_net_cats = [...(prev.finance_income_net_cats || []), value];
      }
      return next;
    });
    setNewItems((prev) => ({ ...prev, [key]: '' }));
  };

  const handleRemoveItem = (key: ConfigListKey, itemToRemove: string) => {
    animate();
    setConfigs((prev) => {
      const next = { ...prev, [key]: prev[key].filter((item) => item !== itemToRemove) };
      if (key === 'finance_income_categories') {
        next.finance_income_net_cats = prev.finance_income_net_cats.filter((item) => item !== itemToRemove);
        next.finance_income_total_cats = prev.finance_income_total_cats.filter((item) => item !== itemToRemove);
        next.finance_income_gross_cats = prev.finance_income_gross_cats.filter((item) => item !== itemToRemove);
      }
      return next;
    });
  };

  const handleCategoryLevelChange = (category: string, nextLevel: IncomeLevel) => {
    setConfigs((prev) => {
      const net = prev.finance_income_net_cats.filter((item) => item !== category);
      const total = prev.finance_income_total_cats.filter((item) => item !== category);
      const gross = prev.finance_income_gross_cats.filter((item) => item !== category);
      if (nextLevel === 'net') net.push(category);
      if (nextLevel === 'total') total.push(category);
      if (nextLevel === 'gross') gross.push(category);
      return { ...prev, finance_income_net_cats: net, finance_income_total_cats: total, finance_income_gross_cats: gross };
    });
  };

  const handleAddBill = async () => {
    const value = newBill.trim();
    if (!value || expenseTree.some((bill) => bill.name === value)) return;
    try {
      const bill = await createBill(value);
      animate();
      setExpenseTree((prev) => [...prev, { ...bill, categories: [] }]);
      setNewBill('');
    } catch (err) {
      Alert.alert('新增失败', err instanceof Error ? err.message : '请稍后重试');
    }
  };

  const handleRemoveBill = (billIndex: number) => {
    const bill = expenseTree[billIndex];
    Alert.alert('删除账本', `确定删除「${bill.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(bill.id);
            animate();
            setExpenseTree((prev) => prev.filter((_, index) => index !== billIndex));
            if (expandedBillIdx === billIndex) {
              setExpandedBillIdx(null);
              setExpandedCatIdx(null);
            } else if (expandedBillIdx !== null && expandedBillIdx > billIndex) {
              setExpandedBillIdx(expandedBillIdx - 1);
            }
          } catch (err) {
            Alert.alert('删除失败', err instanceof Error ? err.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const handleAddCat = async (billIndex: number) => {
    const value = newCat.trim();
    const bill = expenseTree[billIndex];
    if (!value || bill.categories.some((category) => category.name === value)) return;
    try {
      const category = await createCategory(value, bill.id);
      animate();
      setExpenseTree((prev) => prev.map((item, index) => (
        index === billIndex ? { ...item, categories: [...item.categories, { ...category, subcategories: [] }] } : item
      )));
      setNewCat('');
    } catch (err) {
      Alert.alert('新增失败', err instanceof Error ? err.message : '请稍后重试');
    }
  };

  const handleRemoveCat = (billIndex: number, categoryIndex: number) => {
    const category = expenseTree[billIndex].categories[categoryIndex];
    Alert.alert('删除类别', `确定删除「${category.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(category.id);
            animate();
            setExpenseTree((prev) => prev.map((bill, index) => (
              index === billIndex ? { ...bill, categories: bill.categories.filter((_, catIdx) => catIdx !== categoryIndex) } : bill
            )));
            if (expandedCatIdx === categoryIndex) {
              setExpandedCatIdx(null);
            } else if (expandedCatIdx !== null && expandedCatIdx > categoryIndex) {
              setExpandedCatIdx(expandedCatIdx - 1);
            }
          } catch (err) {
            Alert.alert('删除失败', err instanceof Error ? err.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const handleAddSubcat = async (billIndex: number, categoryIndex: number) => {
    const value = newSubcat.trim();
    const category = expenseTree[billIndex].categories[categoryIndex];
    if (!value || category.subcategories.some((subcategory) => subcategory.name === value)) return;
    try {
      const subcategory = await createSubcategory(value, category.id);
      animate();
      setExpenseTree((prev) => prev.map((bill, index) => {
        if (index !== billIndex) return bill;
        const categories = bill.categories.map((item, catIdx) => (
          catIdx === categoryIndex ? { ...item, subcategories: [...item.subcategories, subcategory] } : item
        ));
        return { ...bill, categories };
      }));
      setNewSubcat('');
    } catch (err) {
      Alert.alert('新增失败', err instanceof Error ? err.message : '请稍后重试');
    }
  };

  const handleRemoveSubcat = (billIndex: number, categoryIndex: number, subcategoryIndex: number) => {
    const subcategory = expenseTree[billIndex].categories[categoryIndex].subcategories[subcategoryIndex];
    Alert.alert('删除子类别', `确定删除「${subcategory.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSubcategory(subcategory.id);
            animate();
            setExpenseTree((prev) => prev.map((bill, index) => {
              if (index !== billIndex) return bill;
              const categories = bill.categories.map((category, catIdx) => (
                catIdx === categoryIndex
                  ? { ...category, subcategories: category.subcategories.filter((_, subIdx) => subIdx !== subcategoryIndex) }
                  : category
              ));
              return { ...bill, categories };
            }));
          } catch (err) {
            Alert.alert('删除失败', err instanceof Error ? err.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const toggleBill = (billIndex: number) => {
    animate();
    setExpandedBillIdx((current) => current === billIndex ? null : billIndex);
    setExpandedCatIdx(null);
  };

  const toggleCat = (categoryIndex: number) => {
    animate();
    setExpandedCatIdx((current) => current === categoryIndex ? null : categoryIndex);
  };

  const showLevelSelector = (category: string) => {
    const options = ['取消', '到手', '福利', '全包'];
    const levelMap: Record<string, IncomeLevel> = { 到手: 'net', 福利: 'total', 全包: 'gross' };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 0, title: `选择「${category}」的统计口径` }, (buttonIndex) => {
        if (buttonIndex > 0) handleCategoryLevelChange(category, levelMap[options[buttonIndex]]);
      });
    } else {
      Alert.alert(`选择「${category}」的统计口径`, undefined, [
        { text: '到手', onPress: () => handleCategoryLevelChange(category, 'net') },
        { text: '福利', onPress: () => handleCategoryLevelChange(category, 'total') },
        { text: '全包', onPress: () => handleCategoryLevelChange(category, 'gross') },
        { text: '取消', style: 'cancel' },
      ]);
    }
  };

  const renderActivePanel = () => {
    if (!activePanel) return null;
    const meta = panelMeta[activePanel];

    return (
      <SettingsDetailPanel
        title={meta.title}
        subtitle={meta.subtitle}
        icon={meta.icon}
        gradientColors={meta.colors}
        saving={saving}
        onBack={closePanel}
        onSave={handleSaveConfigs}
      >
        {activePanel === 'expense' ? (
          <ExpenseTreeEditor
            expenseTree={expenseTree}
            expandedBillIdx={expandedBillIdx}
            expandedCatIdx={expandedCatIdx}
            newBill={newBill}
            newCat={newCat}
            newSubcat={newSubcat}
            onNewBillChange={setNewBill}
            onNewCatChange={setNewCat}
            onNewSubcatChange={setNewSubcat}
            onToggleBill={toggleBill}
            onToggleCat={toggleCat}
            onAddBill={() => void handleAddBill()}
            onRemoveBill={handleRemoveBill}
            onAddCat={(billIndex) => void handleAddCat(billIndex)}
            onRemoveCat={handleRemoveCat}
            onAddSubcat={(billIndex, categoryIndex) => void handleAddSubcat(billIndex, categoryIndex)}
            onRemoveSubcat={handleRemoveSubcat}
          />
        ) : null}

        {activePanel === 'income' ? (
          <IncomeCategoryEditor
            configs={configs}
            newValue={newItems.finance_income_categories}
            onNewValueChange={(value) => setNewItems((prev) => ({ ...prev, finance_income_categories: value }))}
            onAdd={handleAddItem}
            onRemove={handleRemoveItem}
            onSelectLevel={showLevelSelector}
          />
        ) : null}

        {activePanel === 'note' ? (
          <TagEditor
            configKey="note_tags"
            items={configs.note_tags}
            value={newItems.note_tags}
            placeholder="输入新标签..."
            onValueChange={(value) => setNewItems((prev) => ({ ...prev, note_tags: value }))}
            onAdd={handleAddItem}
            onRemove={handleRemoveItem}
          />
        ) : null}

        {activePanel === 'class' ? (
          <TagEditor
            configKey="teaching_class_types"
            items={configs.teaching_class_types}
            value={newItems.teaching_class_types}
            placeholder="输入新类型..."
            onValueChange={(value) => setNewItems((prev) => ({ ...prev, teaching_class_types: value }))}
            onAdd={handleAddItem}
            onRemove={handleRemoveItem}
          />
        ) : null}
      </SettingsDetailPanel>
    );
  };

  return (
    <Screen>
      <Header
        title={activePanel ? panelMeta[activePanel].title : '设置中心'}
        subtitle={activePanel ? '配置会先保留在当前页面，点击保存后同步。' : '系统参数、标签与分类的 Pastel Bento 控制台'}
      />
      <StateView loading={loading} error={error} onRetry={load} />

      {!loading && !error ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!activePanel ? (
            <>
              <AccountCard username={username} onLogout={() => void logout()} />
              <View style={styles.overviewGrid}>
                {overviewCards.map((card) => {
                  const meta = panelMeta[card.panel];
                  return (
                    <SettingsOverviewCard
                      key={card.panel}
                      panel={card.panel}
                      title={meta.title}
                      subtitle={meta.subtitle}
                      meta={card.meta}
                      icon={meta.icon}
                      colors={meta.colors}
                      featured={card.featured}
                      onPress={openPanel}
                    />
                  );
                })}
              </View>
            </>
          ) : renderActivePanel()}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}
