import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../styles';
import type { FinanceBill } from '../types';

export function ExpenseTreeEditor({
  expenseTree,
  expandedBillIdx,
  expandedCatIdx,
  newBill,
  newCat,
  newSubcat,
  onNewBillChange,
  onNewCatChange,
  onNewSubcatChange,
  onToggleBill,
  onToggleCat,
  onAddBill,
  onRemoveBill,
  onAddCat,
  onRemoveCat,
  onAddSubcat,
  onRemoveSubcat,
}: {
  expenseTree: FinanceBill[];
  expandedBillIdx: number | null;
  expandedCatIdx: number | null;
  newBill: string;
  newCat: string;
  newSubcat: string;
  onNewBillChange: (value: string) => void;
  onNewCatChange: (value: string) => void;
  onNewSubcatChange: (value: string) => void;
  onToggleBill: (index: number) => void;
  onToggleCat: (index: number) => void;
  onAddBill: () => void;
  onRemoveBill: (index: number) => void;
  onAddCat: (billIndex: number) => void;
  onRemoveCat: (billIndex: number, categoryIndex: number) => void;
  onAddSubcat: (billIndex: number, categoryIndex: number) => void;
  onRemoveSubcat: (billIndex: number, categoryIndex: number, subcategoryIndex: number) => void;
}) {
  return (
    <View style={styles.accordionContainer}>
      {expenseTree.map((bill, billIndex) => {
        const isBillExpanded = expandedBillIdx === billIndex;
        return (
          <View key={bill.id} style={styles.accordionGroup}>
            <View style={[styles.accordionHeader, isBillExpanded && styles.accordionHeaderActive]}>
              <Pressable style={styles.accordionTitleRow} onPress={() => onToggleBill(billIndex)}>
                <Ionicons name={isBillExpanded ? 'chevron-down' : 'chevron-forward'} size={20} color={isBillExpanded ? colors.primary : colors.text} />
                <Text style={[styles.accordionTitleText, isBillExpanded && { color: colors.primary }]}>{bill.name}</Text>
              </Pressable>
              <Pressable onPress={() => onRemoveBill(billIndex)} hitSlop={10} style={styles.deleteIcon}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>

            {isBillExpanded ? (
              <View style={styles.accordionContentLevel1}>
                {bill.categories.map((category, categoryIndex) => {
                  const isCategoryExpanded = expandedCatIdx === categoryIndex;
                  return (
                    <View key={category.id} style={styles.accordionGroupLevel2}>
                      <View style={[styles.accordionHeaderLevel2, isCategoryExpanded && styles.accordionHeaderActiveLevel2]}>
                        <Pressable style={styles.accordionTitleRow} onPress={() => onToggleCat(categoryIndex)}>
                          <Ionicons name={isCategoryExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color={isCategoryExpanded ? colors.primary : colors.textSoft} />
                          <Text style={[styles.accordionTitleTextLevel2, isCategoryExpanded && { color: colors.primary }]}>{category.name}</Text>
                        </Pressable>
                        <Pressable onPress={() => onRemoveCat(billIndex, categoryIndex)} hitSlop={10} style={styles.deleteIcon}>
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </Pressable>
                      </View>

                      {isCategoryExpanded ? (
                        <View style={styles.accordionContentLevel2}>
                          {category.subcategories.map((subcategory, subcategoryIndex) => (
                            <View key={subcategory.id} style={styles.subcatRow}>
                              <Text style={styles.subcatText}>{subcategory.name}</Text>
                              <Pressable onPress={() => onRemoveSubcat(billIndex, categoryIndex, subcategoryIndex)} hitSlop={10}>
                                <Ionicons name="trash-outline" size={14} color={colors.danger} />
                              </Pressable>
                            </View>
                          ))}

                          <View style={styles.treeAddRowMobile}>
                            <TextInput
                              style={styles.treeInputMobile}
                              placeholder="添加子类别..."
                              placeholderTextColor={colors.faint}
                              value={newSubcat}
                              onChangeText={onNewSubcatChange}
                              onSubmitEditing={() => onAddSubcat(billIndex, categoryIndex)}
                            />
                            <Pressable onPress={() => onAddSubcat(billIndex, categoryIndex)} style={styles.treeAddBtnMobile}>
                              <Ionicons name="add" size={16} color={colors.primary} />
                            </Pressable>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}

                <View style={[styles.treeAddRowMobile, { marginLeft: 12, marginTop: 8 }]}>
                  <TextInput
                    style={styles.treeInputMobile}
                    placeholder="添加新类别..."
                    placeholderTextColor={colors.faint}
                    value={newCat}
                    onChangeText={onNewCatChange}
                    onSubmitEditing={() => onAddCat(billIndex)}
                  />
                  <Pressable onPress={() => onAddCat(billIndex)} style={styles.treeAddBtnMobile}>
                    <Ionicons name="add" size={16} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      <View style={[styles.treeAddRowMobile, { marginTop: spacing.md }]}>
        <TextInput
          style={[styles.treeInputMobile, { backgroundColor: colors.surfaceMuted, height: 44 }]}
          placeholder="添加新账单..."
          placeholderTextColor={colors.faint}
          value={newBill}
          onChangeText={onNewBillChange}
          onSubmitEditing={onAddBill}
        />
        <Pressable onPress={onAddBill} style={[styles.treeAddBtnMobile, { height: 44, width: 44, backgroundColor: colors.primarySoft }]}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
