import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, TrendingUp, FileText, CalendarCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesOverview from '@/components/sales/SalesOverview';
import EmployeeMonitoring from '@/components/sales/EmployeeMonitoring';
import LeadAllocation from '@/components/sales/LeadAllocation';
import QuotationApproval from '@/components/sales/QuotationApproval';
import LeaveApprovals from '@/components/sales/LeaveApprovals';
import RequestsView from '@/components/sales/RequestsView';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SalesHeadDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const userInfo = response.data;
        
        if (userInfo.role !== 'Sales Head') {
          toast.error('Access denied. Sales Head role required.');
          navigate('/login');
          return;
        }

        setUser(userInfo);
        setLoading(false);
      } catch (error) {
        console.error('Auth verification failed:', error);
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0a1e3d 0%, #1a2f4d 50%, #0d1b2a 100%)'
      }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0a1e3d 0%, #1a2f4d 50%, #0d1b2a 100%)'
    }}>
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_b916bfee-a2e0-4a78-a130-e219040d5774/artifacts/qhdckkjh_ARBRIT.jpeg" 
                alt="Arbrit Logo" 
                className="h-12 w-12 object-contain bg-white rounded-lg p-1"
              />
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h1 className="text-2xl font-bold text-white">Sales Head Dashboard</h1>
                </div>
                <p className="text-sm text-gray-400">Sales Management & Operations</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-blue-400">Sales Head</p>
              </div>
              <Button
                data-testid="logout-button"
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-300">
            Monitor your sales team, manage leads, create quotations, and approve leave requests.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="overview" 
              data-testid="tab-overview"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="monitoring" 
              data-testid="tab-monitoring"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger 
              value="leads"
              data-testid="tab-leads"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger 
              value="quotations"
              data-testid="tab-quotations"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Quotations
            </TabsTrigger>
            <TabsTrigger 
              value="requests"
              data-testid="tab-requests"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Requests
            </TabsTrigger>
            <TabsTrigger 
              value="leaves"
              data-testid="tab-leaves"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              Leaves
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <SalesOverview />
            </TabsContent>

            <TabsContent value="monitoring" className="mt-0">
              <EmployeeMonitoring />
            </TabsContent>

            <TabsContent value="leads" className="mt-0">
              <LeadAllocation />
            </TabsContent>

            <TabsContent value="quotations" className="mt-0">
              <QuotationApproval />
            </TabsContent>

            <TabsContent value="requests" className="mt-0">
              <RequestsView />
            </TabsContent>

            <TabsContent value="leaves" className="mt-0">
              <LeaveApprovals />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default SalesHeadDashboard;