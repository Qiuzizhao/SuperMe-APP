import { CrudScreen } from '@/src/features/CrudScreen';
import { TeachingScreen, WorkLogScreen } from '@/src/features/ReplicatedScreens';
import { workModules } from '@/src/features/moduleConfig';

export default function WorkRoute() {
  const renderWorkModule = ({ module, onBack }: { module: { key: string }; onBack: () => void }) => {
    if (module.key === 'worklogs') return <WorkLogScreen onBack={onBack} />;
    if (module.key === 'teachings') return <TeachingScreen onBack={onBack} />;
    return null;
  };

  return (
    <CrudScreen
      modules={workModules}
      title="工作"
      subtitle="工作日志和课堂日志"
      renderModule={renderWorkModule}
    />
  );
}
