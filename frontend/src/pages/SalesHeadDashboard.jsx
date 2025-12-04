import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, TrendingUp, CalendarCheck, Receipt, BarChart3, Target, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PerformanceOverview from '@/components/sales/PerformanceOverview';
import LeadTracker from '@/components/sales/LeadTracker';
import LeaveApprovalManagement from '@/components/hr/LeaveApprovalManagement';
import ExpenseApprovalManagement from '@/components/hr/ExpenseApprovalManagement';
import TargetManagement from '@/components/sales/TargetManagement';
import AcademicCalendar from '@/components/sales/AcademicCalendar';
import UnifiedLeadForm from '@/components/sales/UnifiedLeadForm';
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
  const [onlineLeadDialogOpen, setOnlineLeadDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalLeads: 0,
    teamMembers: 0,
    monthlyRevenue: 0,
    pendingTasks: 0
  });
  const [duplicateCount, setDuplicateCount] = useState(0);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales-head/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Show zero stats if API fails
      setStats({
        totalLeads: 0,
        teamMembers: 0,
        monthlyRevenue: 0,
        pendingTasks: 0
      });
    }
  };

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
        fetchDashboardStats();
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
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
      setTimeout(() => {
        navigate('/login');
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0a1e3d 0%, #1a2f4d 50%, #0d1b2a 100%)'
      }}>
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0a1e3d 0%, #1a2f4d 50%, #0d1b2a 100%)'
    }}>
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
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
                  <TrendingUp className="w-5 h-5 text-gray-700" />
                  <h1 className="text-2xl font-bold text-gray-900">Sales Head Dashboard</h1>
                </div>
                <p className="text-sm text-gray-400">Sales Management & Operations</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => setOnlineLeadDialogOpen(true)}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
                className="text-[#0a1e3d] font-semibold"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Online Lead
              </Button>
              <DuplicateAlertsNotification onViewAll={() => setActiveTab('duplicates')} />
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-700">Sales Head</p>
              </div>
              <Button
                data-testid="logout-button"
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
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
        <div className="mb-8 bg-white/5  rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-700">
            Monitor your sales team, manage leads, create quotations, and approve leave requests.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger 
              value="overview" 
              data-testid="tab-overview"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="lead-management"
              data-testid="tab-lead-management"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Lead Management
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              data-testid="tab-calendar"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Academic Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="targets"
              data-testid="tab-targets"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <Target className="w-4 h-4 mr-2" />
              Targets
            </TabsTrigger>
            <TabsTrigger 
              value="leaves"
              data-testid="tab-leaves"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              Leaves
            </TabsTrigger>
            <TabsTrigger 
              value="expenses"
              data-testid="tab-expenses"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <PerformanceOverview />
            </TabsContent>

            <TabsContent value="lead-management" className="mt-0">
              <LeadTracker />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <AcademicCalendar />
            </TabsContent>

            <TabsContent value="targets" className="mt-0">
              <TargetManagement />
            </TabsContent>

            <TabsContent value="leaves" className="mt-0">
              <LeaveApprovalManagement role="Sales Head" />
            </TabsContent>

            <TabsContent value="expenses" className="mt-0">
              <ExpenseApprovalManagement />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Online Lead Dialog with Employee Assignment */}
      <Dialog open={onlineLeadDialogOpen} onOpenChange={setOnlineLeadDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">📥 Add Online Lead</DialogTitle>
            <DialogDescription className="text-slate-400">
              Record online enquiries and assign to your team members
            </DialogDescription>
          </DialogHeader>
          <UnifiedLeadForm 
            mode="online"
            onSuccess={() => {
              setOnlineLeadDialogOpen(false);
              toast.success('Online lead added and assigned successfully');
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesHeadDashboard;