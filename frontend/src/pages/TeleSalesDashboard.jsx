import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Phone, TrendingUp, FileText, GraduationCap, DollarSign, Calendar, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SelfLeadForm from '@/components/sales/SelfLeadForm';
import LeadManagement from '@/components/sales/LeadManagement';
import QuotationManager from '@/components/sales/QuotationManager';
import TrainerRequest from '@/components/sales/TrainerRequest';
import InvoiceRequest from '@/components/sales/InvoiceRequest';
import FollowUps from '@/components/sales/FollowUps';
import ExpenseSubmission from '@/components/expenses/ExpenseSubmission';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeleSalesDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        
        if (userInfo.role !== 'Tele Sales') {
          toast.error('Access denied. Tele Sales role required.');
          navigate('/login');
          return;
        }

        setUser(userInfo);

        const dashResponse = await axios.get(`${API}/dashboard/tele-sales`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(dashResponse.data);
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

  const [activeTab, setActiveTab] = useState('leads');

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
                  <Phone className="w-5 h-5 text-blue-400" />
                  <h1 className="text-2xl font-bold text-white">Tele Sales Dashboard</h1>
                </div>
                <p className="text-sm text-gray-400">Inhouse Sales Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {dashboardData?.badge_title || 'Tele Sales'}
                </Badge>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-300">
            Manage your leads, create quotations, and request services from your dashboard.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="leads"
              data-testid="tab-leads"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger 
              value="followups"
              data-testid="tab-followups"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Follow-ups
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
              value="trainer"
              data-testid="tab-trainer"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Trainer
            </TabsTrigger>
            <TabsTrigger 
              value="invoice"
              data-testid="tab-invoice"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Invoice
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="leads" className="mt-0 space-y-6">
              <div className="flex justify-end">
                <SelfLeadForm />
              </div>
              <LeadManagement />
            </TabsContent>

            <TabsContent value="followups" className="mt-0">
              <FollowUps />
            </TabsContent>

            <TabsContent value="quotations" className="mt-0">
              <QuotationManager />
            </TabsContent>

            <TabsContent value="trainer" className="mt-0">
              <TrainerRequest />
            </TabsContent>

            <TabsContent value="invoice" className="mt-0">
              <InvoiceRequest />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default TeleSalesDashboard;