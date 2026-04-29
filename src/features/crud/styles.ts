import { Platform, StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '@/src/shared/theme';

export const styles = StyleSheet.create({
  bentoContainer: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 64 : spacing.xl,
    paddingBottom: spacing.xxl,
  },
  heroSection: {
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  heroGreeting: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  heroDate: {
    fontSize: 15,
    color: colors.textSoft,
    fontWeight: '600',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bentoCard: {
    width: '47.5%',
    aspectRatio: 1.05,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    backgroundColor: colors.surface,
  },
  bentoCardLarge: {
    width: '100%',
    aspectRatio: 2.1,
  },
  bentoContent: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: 'space-between',
  },
  bentoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoTextWrapper: {
    gap: 4,
  },
  bentoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  bentoTitleLarge: {
    fontSize: 20,
  },
  bentoSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSoft,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  toolbar: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchBox: {
    paddingHorizontal: spacing.lg,
  },
  list: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 0,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  itemIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  itemMain: {
    flex: 1,
    gap: spacing.xs,
  },
  itemTitleRow: {
    gap: spacing.sm,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  itemDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  swipeContainer: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  swipeActions: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  thumb: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
    height: 58,
    width: 58,
  },
  modal: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 68 : spacing.xxl,
    paddingBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  modalContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  modalFooter: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...shadow,
    elevation: 8,
    zIndex: 100,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetBg: {
    backgroundColor: colors.surface,
    borderRadius: 24,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.border,
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  formBlock: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  preview: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
    height: 180,
    marginBottom: spacing.md,
    width: '100%',
  },
});
