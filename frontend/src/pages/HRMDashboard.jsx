import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, ClipboardCheck, FileText, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeManagement from '@/components/hrm/EmployeeManagement';
import AttendanceManagement from '@/components/hrm/AttendanceManagement';
import EmployeeRecords from '@/components/hrm/EmployeeRecords';
import CompanyDocuments from '@/components/hrm/CompanyDocuments';

const HRMDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('employees');

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0a1e3d 0%, #1a2f4d 50%, #0d1b2a 100%)'
    }}>
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                data-testid="back-button"
                onClick={() => navigate('/dashboard/coo')}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Human Resource Management</h1>
                <p className="text-sm text-gray-400">Manage employees, attendance, and documents</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger 
              value="employees" 
              data-testid="tab-employees"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Employee Management
            </TabsTrigger>
            <TabsTrigger 
              value="attendance"
              data-testid="tab-attendance"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-gray-300"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger 
              value="records"
              data-testid="tab-records"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-gray-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Employee Records
            </TabsTrigger>
            <TabsTrigger 
              value="company"
              data-testid="tab-company"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Company Documents
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="employees" className="mt-0">
              <EmployeeManagement />
            </TabsContent>

            <TabsContent value="attendance" className="mt-0">
              <AttendanceManagement />
            </TabsContent>

            <TabsContent value="records" className="mt-0">
              <EmployeeRecords />
            </TabsContent>

            <TabsContent value="company" className="mt-0">
              <CompanyDocuments />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default HRMDashboard;