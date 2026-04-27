import { CrudScreen } from '@/src/features/CrudScreen';
import { dailyModules } from '@/src/features/moduleConfig';

export default function DailyRoute() {
  return <CrudScreen modules={dailyModules} title="日常" subtitle="待办、心情、笔记和工作记录" />;
}
