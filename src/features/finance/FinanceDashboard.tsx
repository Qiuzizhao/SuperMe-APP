import { CrudScreen } from '@/src/features/crud/CrudScreen';
import { financeModules } from '@/src/features/modules/moduleConfig';

import { AssetScreen } from './assets';
import { IncomeAnalysis } from './income-analysis/IncomeAnalysis';
import { FinanceRecordsScreen } from './records/FinanceRecordsScreen';
import { FinanceReportScreen } from './reports/FinanceReportScreen';
import { SubscriptionScreen } from './subscriptions';

const extendedFinanceModules = [
  ...financeModules,
  {
    key: 'finance_report',
    title: '报表',
    subtitle: '收支占比与趋势',
    endpoint: '',
    fields: [],
    titleField: '',
    detailFields: [],
    icon: 'bar-chart-outline' as any,
    accent: '#10B981',
    emptyText: '',
  },
  {
    key: 'income_analysis',
    title: '收入分析',
    subtitle: '图表与数据统计',
    endpoint: '',
    fields: [],
    titleField: '',
    detailFields: [],
    icon: 'pie-chart-outline' as any,
    accent: '#2563EB',
    emptyText: '',
  }
];

export function FinanceDashboard() {
  return (
    <CrudScreen
      modules={extendedFinanceModules}
      title="财务"
      subtitle="账单、报表、资产与分析"
      renderModule={({ module, onBack }) => {
        if (module.key === 'finances') return <FinanceRecordsScreen onBack={onBack} />;
        if (module.key === 'subscriptions') return <SubscriptionScreen onBack={onBack} />;
        if (module.key === 'guiwu') return <AssetScreen onBack={onBack} />;
        if (module.key === 'finance_report') return <FinanceReportScreen onBack={onBack} />;
        if (module.key === 'income_analysis') return <IncomeAnalysis onBack={onBack} />;
        return null;
      }}
    />
  );
}
