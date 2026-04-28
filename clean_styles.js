const fs = require('fs');
const path = 'src/features/FinanceDashboard.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const startIdx = lines.findIndex(line => line.includes('xqDonutStage: {'));
const endIdx = lines.findIndex((line, i) => i > startIdx && line.includes('billList: {'));

if (startIdx !== -1 && endIdx !== -1) {
  const newStyles = `  donutStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  donutTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  donutHint: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  donutLabel: {
    maxWidth: 96,
    position: 'absolute',
    width: 90,
  },
  donutLabelSmall: {
    maxWidth: 60,
    position: 'absolute',
    width: 60,
  },
  donutLabelText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  donutLabelPercent: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  treemap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    height: 200,
    marginTop: 16,
  },
  treemapEmpty: {
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
  },
  treemapTile: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 6,
    justifyContent: 'flex-end',
    padding: 8,
  },
  treemapTile0: { height: 200, width: '33%' },
  treemapTile1: { height: 200, width: '33%' },
  treemapTile2: { height: 64, width: '30%' },
  treemapTile3: { height: 64, width: '30%' },
  treemapTile4: { height: 64, width: '30%' },
  treemapTile5: { height: 64, width: '30%' },
  treemapName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  treemapPercent: { color: colors.textSoft, fontSize: 13, fontWeight: '700', marginTop: 2 },`;

  const newLines = [...lines.slice(0, startIdx), newStyles, ...lines.slice(endIdx)];
  fs.writeFileSync(path, newLines.join('\n'));
  console.log('Successfully replaced xq styles!');
} else {
  console.log('Could not find boundaries.', startIdx, endIdx);
}
