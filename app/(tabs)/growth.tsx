import { CrudScreen } from '@/src/features/CrudScreen';
import { growthModules } from '@/src/features/moduleConfig';

export default function GrowthRoute() {
  return <CrudScreen modules={growthModules} title="成长" subtitle="愿望、足迹、阅读、作品和目标" />;
}
