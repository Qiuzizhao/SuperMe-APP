import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '@/src/shared/theme';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 9999,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonPlain: {
    backgroundColor: colors.primarySoft,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPlainText: {
    color: colors.primary,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonSoft: {
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow,
  },
  bottomSheetBg: {
    backgroundColor: colors.surface,
    borderRadius: 24,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 6,
    width: 48,
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  field: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  fieldCompact: {
    flex: 1,
  },
  fieldLabel: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 4,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.xl,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  inputCompact: {
    minHeight: 48,
    borderRadius: radius.lg,
  },
  inputMultiline: {
    minHeight: 120,
    paddingTop: spacing.lg,
    textAlignVertical: 'top',
  },
  dateInput: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dateInputText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dateInputTextCompact: {
    fontSize: 13,
    fontWeight: '800',
  },
  dateInputPlaceholder: {
    color: colors.faint,
  },
  pickerOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pickerPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    maxWidth: 360,
    padding: spacing.lg,
    width: '100%',
    ...shadow,
  },
  pickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  dayCell: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: radius.md,
    justifyContent: 'center',
    width: '14.285%',
  },
  dayCellText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  dayCellMuted: {
    color: colors.faint,
  },
  todayCell: {
    backgroundColor: colors.primarySoft,
  },
  pickerCellSelected: {
    backgroundColor: colors.text,
  },
  pickerCellTextSelected: {
    color: '#fff',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  monthCell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    minHeight: 48,
    justifyContent: 'center',
    width: '30%',
  },
  monthCellText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  pickerFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  optionList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  optionRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  optionRowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionRowText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  segmented: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  segment: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 9999,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  segmentSelected: {
    backgroundColor: colors.text,
  },
  segmentText: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '800',
  },
  segmentTextSelected: {
    color: '#fff',
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
