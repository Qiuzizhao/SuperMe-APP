import { CrudScreen } from '@/src/features/crud';
import { FootprintScreen } from '@/src/features/daily/footprints';
import { MoodScreen } from '@/src/features/daily/moods';
import { NoteScreen } from '@/src/features/daily/notes';
import { ReadingScreen } from '@/src/features/daily/readings';
import { TeachingScreen } from '@/src/features/daily/teachings';
import { TodoScreen } from '@/src/features/daily/todos';
import { WishlistScreen } from '@/src/features/daily/wishlists';
import { WorkLogScreen } from '@/src/features/daily/worklogs';
import { dailyModules } from '@/src/features/modules';

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
