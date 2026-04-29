import type { FieldConfig, ModuleConfig } from '@/src/features/modules/moduleConfig';

export type RecordItem = Record<string, any> & { id: number };
export type FormState = Record<string, string>;

export type CrudScreenProps = {
  modules: ModuleConfig[];
  initialModuleKey?: string;
  title?: string;
  subtitle?: string;
  renderModule?: (params: {
    module: ModuleConfig;
    siblingModules: ModuleConfig[];
    onBack: () => void;
    onSwitchModule: (key: string) => void;
  }) => React.ReactNode;
};

export type CrudModuleProps = {
  config: ModuleConfig;
  siblingModules: ModuleConfig[];
  onBack: () => void;
  onSwitchModule: (key: string) => void;
};

export type EditModalProps = {
  config: ModuleConfig;
  bottomSheetRef: React.RefObject<any>;
  editing: RecordItem | null;
  form: FormState;
  saving: boolean;
  onChange: (key: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export type { FieldConfig, ModuleConfig };
