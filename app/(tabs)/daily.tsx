import { CrudScreen } from '@/src/features/CrudScreen';
import {
  FootprintScreen,
  MoodScreen,
  NoteScreen,
  ReadingScreen,
  TeachingScreen,
  WishlistScreen,
  WorkLogScreen,
} from '@/src/features/ReplicatedScreens';
import { TodoScreen } from '@/src/features/TodoScreen';
import { dailyModules } from '@/src/features/moduleConfig';

export default function DailyRoute() {
  const renderDailyModule = ({ module, onBack }: { module: { key: string }; onBack: () => void }) => {
    if (module.key === 'todos') return <TodoScreen onBack={onBack} />;
    if (module.key === 'moods') return <MoodScreen onBack={onBack} />;
    if (module.key === 'notes') return <NoteScreen onBack={onBack} />;
    if (module.key === 'worklogs') return <WorkLogScreen onBack={onBack} />;
    if (module.key === 'teachings') return <TeachingScreen onBack={onBack} />;
    if (module.key === 'wishlists') return <WishlistScreen onBack={onBack} />;
    if (module.key === 'footprints') return <FootprintScreen onBack={onBack} />;
    if (module.key === 'readings') return <ReadingScreen onBack={onBack} />;
    return null;
  };

  return (
    <CrudScreen
      modules={dailyModules}
      title="日常"
      subtitle="待办、心情、工作、愿望、足迹与阅读"
      renderModule={renderDailyModule}
    />
  );
}
