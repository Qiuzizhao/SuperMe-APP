import { CrudScreen } from '@/src/features/CrudScreen';
import {
  FootprintScreen,
  GoalScreen,
  GrowthRadarScreen,
  PortfolioScreen,
  ReadingScreen,
  WishlistScreen,
} from '@/src/features/ReplicatedScreens';
import { growthModules } from '@/src/features/moduleConfig';

export default function GrowthRoute() {
  const renderGrowthModule = ({ module, onBack }: { module: { key: string }; onBack: () => void }) => {
    if (module.key === 'wishlists') return <WishlistScreen onBack={onBack} />;
    if (module.key === 'footprints') return <FootprintScreen onBack={onBack} />;
    if (module.key === 'readings') return <ReadingScreen onBack={onBack} />;
    if (module.key === 'portfolios') return <PortfolioScreen onBack={onBack} />;
    if (module.key === 'growth') return <GrowthRadarScreen onBack={onBack} />;
    if (module.key === 'goals') return <GoalScreen onBack={onBack} />;
    return null;
  };

  return <CrudScreen modules={growthModules} title="成长" subtitle="愿望、足迹、阅读、作品和目标" renderModule={renderGrowthModule} />;
}
