import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LeadManagement = () => {
  const [activeTab, setActiveTab] = useState('online');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-blue-400" />
        <div>
          <h3 className="text-xl font-semibold text-white">Lead Management</h3>
          <p className="text-sm text-gray-400">Manage online and self-generated leads</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="online" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300">
            Online Leads
          </TabsTrigger>
          <TabsTrigger value="self" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300">
            Self-Generated Leads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="mt-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
            <p className="text-gray-300">Online Lead Management - Coming Soon</p>
            <p className="text-sm text-gray-500 mt-2">Feature under development</p>
          </div>
        </TabsContent>

        <TabsContent value="self" className="mt-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
            <p className="text-gray-300">Self-Generated Lead Management - Coming Soon</p>
            <p className="text-sm text-gray-500 mt-2">Feature under development</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadManagement;