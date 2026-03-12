import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft } from 'lucide-react';
import { SingleSwitchPanel } from '@/pages/admin/strategy-switch/components/SingleSwitchPanel';
import { BulkCampaignPanel } from '@/pages/admin/strategy-switch/components/BulkCampaignPanel';
import { useStrategySwitchPageModel } from '@/pages/admin/strategy-switch/hooks/useStrategySwitchPageModel';

const StrategySwitch = () => {
  const { t, activeTab, setActiveTab, singlePanelProps, bulkPanelProps } = useStrategySwitchPageModel();

  return (
    <div className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <ArrowRightLeft className="w-7 h-7 text-primary" />
          {t('admin:strategy_switch.title')}
        </h1>
        <p className="text-slate-500 font-medium mt-1">{t('admin:strategy_switch.description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/50 border border-slate-200 p-1 rounded-xl">
          <TabsTrigger value="single">{t('admin:strategy_switch.tab_single')}</TabsTrigger>
          <TabsTrigger value="bulk">{t('admin:strategy_switch.tab_bulk')}</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <SingleSwitchPanel {...singlePanelProps} />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkCampaignPanel {...bulkPanelProps} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategySwitch;
