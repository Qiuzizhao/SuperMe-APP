import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '@/src/shared/theme';

export const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingTop: 0,
  },
  accountHero: {
    borderColor: 'rgba(0,0,0,0.03)',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadow,
  },
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  accountIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: radius.lg,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  accountMain: {
    flex: 1,
  },
  accountEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  accountName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  accountHeroFooter: {
    marginTop: spacing.lg,
  },
  accountHeroPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  accountHeroPillText: {
    color: colors.textSoft,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  overviewCardPressable: {
    borderRadius: radius.xl,
    minHeight: 176,
    overflow: 'hidden',
    width: '47.5%',
    ...shadow,
  },
  overviewCardFeatured: {
    minHeight: 172,
    width: '100%',
  },
  cardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  overviewCardGradient: {
    borderColor: 'rgba(0,0,0,0.03)',
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  overviewCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderRadius: radius.lg,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  overviewCardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
  },
  overviewCardSubtitle: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  overviewCardMeta: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderRadius: radius.full,
    color: colors.textSoft,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailPanel: {
    gap: spacing.lg,
  },
  detailHero: {
    borderColor: 'rgba(0,0,0,0.03)',
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadow,
  },
  detailNavRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  detailBackButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  detailBackText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  detailTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: radius.xl,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  detailTitleText: {
    flex: 1,
  },
  detailTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  detailSubtitle: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  detailContent: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(0,0,0,0.03)',
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow,
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
