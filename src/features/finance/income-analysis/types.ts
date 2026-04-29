export type IncomeConfig = {
  finance_income_categories: string[];
  finance_income_net_cats: string[];
  finance_income_total_cats: string[];
  finance_income_gross_cats: string[];
};

export type IncomeTotals = {
  netTotal: number;
  totalIncome: number;
  grossTotal: number;
};

export type ProjectionStats = {
  avgMonthlyNet: number;
  avgMonthlyTotal: number;
  avgMonthlyGross: number;
  annualNetProjection: number;
  annualTotalProjection: number;
  annualGrossProjection: number;
  totalMonths: number;
};

export type CategoryStat = {
  actual: number;
  avg: number;
  projection: number;
  currentMonth: string;
};

export type CategoryStats = Record<string, CategoryStat>;

export type CategoryAggregates = {
  avgNet: number;
  avgTotal: number;
  avgGross: number;
  annualNet: number;
  annualTotal: number;
  annualGross: number;
};
