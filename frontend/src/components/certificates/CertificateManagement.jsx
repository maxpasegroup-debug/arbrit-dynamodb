import { useState } from 'react';
import { Package, FileBarChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CertificateDispatchManagement from './CertificateDispatchManagement';
import CertificationsReports from '../library/CertificationsReports';

/**
 * CertificateManagement - Unified component for certificate dispatch and reporting
 * Combines CertificateDispatchManagement and CertificationsReports into a single interface
 */
const CertificateManagement = () => {
  const [activeTab, setActiveTab] = useState('dispatch');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-white/10">
          <TabsTrigger 
            value="dispatch"
            className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-white text-gray-300"
          >
            <Package className="w-4 h-4 mr-2" />
            Dispatch & Tracking
          </TabsTrigger>
          <TabsTrigger 
            value="reports"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-gray-300"
          >
            <FileBarChart className="w-4 h-4 mr-2" />
            Status & Reports
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dispatch" className="mt-0">
            <CertificateDispatchManagement />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <CertificationsReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CertificateManagement;
