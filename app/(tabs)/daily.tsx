import { CrudScreen } from '@/src/features/CrudScreen';
import { MoodScreen, NoteScreen } from '@/src/features/ReplicatedScreens';
import { TodoScreen } from '@/src/features/TodoScreen';
import { dailyModules } from '@/src/features/moduleConfig';

export default function DailyRoute() {
  const renderDailyModule = ({ module, onBack }: { module: { key: string }; onBack: () => void }) => {
    if (module.key === 'todos') return <TodoScreen onBack={onBack} />;
    if (module.key === 'moods') return <MoodScreen onBack={onBack} />;
    if (module.key === 'notes') return <NoteScreen onBack={onBack} />;
    return null;
  };

  return (
    <CrudScreen
      modules={dailyModules}
      title="日常"
      subtitle="待办、心情和随手记"
      renderModule={renderDailyModule}
    />
  );
}
