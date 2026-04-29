export type FinanceItem = {
  id: number;
  amount: number;
  transaction_type: 'income' | 'expense';
  bill?: string | null;
  bill_id?: number | null;
  category?: string | null;
  category_id?: number | null;
  subcategory?: string | null;
  subcategory_id?: number | null;
  description?: string | null;
  transaction_date: string;
  belong_month?: string | null;
  created_at?: string;
};

export type FinanceSubcategory = {
  id: number;
  name: string;
};

export type FinanceCategory = {
  id: number;
  name: string;
  subcategories: FinanceSubcategory[];
};

export type FinanceBill = {
  id: number;
  name: string;
  categories: FinanceCategory[];
};

export type ReportType = 'weekly' | 'monthly' | 'yearly' | 'custom';
