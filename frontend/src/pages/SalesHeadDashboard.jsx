import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, TrendingUp, FileText, CalendarCheck, ClipboardList, Receipt, CheckSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesOverview from '@/components/sales/SalesOverview';
import EmployeeMonitoring from '@/components/sales/EmployeeMonitoring';
import LeadAllocation from '@/components/sales/LeadAllocation';
import LeadManagementEnhanced from '@/components/sales/LeadManagementEnhanced';
import LeadTracker from '@/components/sales/LeadTracker';
import QuotationManagementEnhanced from '@/components/sales/QuotationManagementEnhanced';
import LeaveApprovals from '@/components/sales/LeaveApprovals';
import RequestsView from '@/components/sales/RequestsView';
import ExpenseSubmission from '@/components/expenses/ExpenseSubmission';
import ExpenseApprovals from '@/components/expenses/ExpenseApprovals';
import DuplicateManagement from '@/components/sales/DuplicateManagement';
import DuplicateAlertsNotification from '@/components/sales/DuplicateAlertsNotification';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SalesHeadDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [duplicateCount, setDuplicateCount] = useState(0);

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
        
        if (!['Sales Head', 'COO', 'MD', 'CEO'].includes(userInfo.role)) {
          toast.error('Access denied. Sales Head access required.');
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

  // Fetch duplicate alerts count
  useEffect(() => {
    const fetchDuplicateCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/sales/duplicate-alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const pendingAlerts = response.data.filter(alert => alert.status === 'pending');
        setDuplicateCount(pendingAlerts.length);
      } catch (error) {
        console.error('Error fetching duplicate count:', error);
      }
    };

    if (user) {
      fetchDuplicateCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchDuplicateCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
              <DuplicateAlertsNotification onViewAll={() => setActiveTab('duplicates')} />
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
          <TabsList className="grid w-full grid-cols-9 bg-white/5 border border-white/10">
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
              className={`relative transition-all duration-300 ${
                duplicateCount > 0 
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse data-[state=active]:bg-red-700 data-[state=active]:text-white shadow-lg shadow-red-500/50' 
                  : 'data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Leads
              {duplicateCount > 0 && (
                <Badge className="ml-2 bg-white text-red-600 font-bold text-xs px-2 animate-bounce">
                  {duplicateCount} ALERT{duplicateCount > 1 ? 'S' : ''}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="duplicates"
              data-testid="tab-duplicates"
              className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-white text-gray-300"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Duplicates
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
            <TabsTrigger 
              value="my-expenses"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Receipt className="w-4 h-4 mr-2" />
              My Expenses
            </TabsTrigger>
            <TabsTrigger 
              value="expense-approvals"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Approve Expenses
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
              <LeadTracker />
            </TabsContent>

            <TabsContent value="duplicates" className="mt-0">
              <DuplicateManagement />
            </TabsContent>

            <TabsContent value="quotations" className="mt-0">
              <QuotationManagementEnhanced />
            </TabsContent>

            <TabsContent value="requests" className="mt-0">
              <RequestsView />
            </TabsContent>

            <TabsContent value="leaves" className="mt-0">
              <LeaveApprovals />
            </TabsContent>

            <TabsContent value="my-expenses" className="mt-0">
              <ExpenseSubmission />
            </TabsContent>

            <TabsContent value="expense-approvals" className="mt-0">
              <ExpenseApprovals userRole="Sales Head" />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default SalesHeadDashboard;