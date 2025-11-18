import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Briefcase, TrendingUp, FileText, MapPin, GraduationCap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SelfLeadForm from '@/components/sales/SelfLeadForm';
import LeadManagement from '@/components/sales/LeadManagement';
import QuotationManager from '@/components/sales/QuotationManager';
import TrainerRequest from '@/components/sales/TrainerRequest';
import InvoiceRequest from '@/components/sales/InvoiceRequest';
import VisitLogs from '@/components/sales/VisitLogs';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FieldSalesDashboard = () => {
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
        
        if (userInfo.role !== 'Field Sales') {
          toast.error('Access denied. Field Sales role required.');
          navigate('/login');
          return;
        }

        setUser(userInfo);

        const dashResponse = await axios.get(`${API}/dashboard/field-sales`, {
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

  const modules = [
    {
      id: 'my-leads',
      title: 'My Assigned Leads',
      description: 'Corporate leads assigned to you',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400'
    },
    {
      id: 'corporate-leads',
      title: 'Corporate Enquiries',
      description: 'Add and track corporate leads',
      icon: Briefcase,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-400'
    },
    {
      id: 'visit-logs',
      title: 'Visit Logs',
      description: 'Track client visits & meetings',
      icon: MapPin,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400'
    },
    {
      id: 'quotations',
      title: 'Quotations',
      description: 'Create corporate quotations',
      icon: FileText,
      color: 'from-orange-500 to-yellow-500',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-400'
    },
    {
      id: 'conversions',
      title: 'Client Conversion',
      description: 'Track conversion pipeline',
      icon: Target,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
      iconColor: 'text-pink-400'
    }
  ];

  const handleModuleClick = (moduleId) => {
    toast.info(`${moduleId} - Feature coming in Phase 2`);
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
                  <Briefcase className="w-5 h-5 text-green-400" />
                  <h1 className="text-2xl font-bold text-white">Field Sales Dashboard</h1>
                </div>
                <p className="text-sm text-gray-400">Corporate & Onsite Sales</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  {dashboardData?.badge_title || 'Field Sales'}
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
            Manage corporate leads, track client visits, and create professional quotations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                data-testid={`module-${module.id}`}
                onClick={() => handleModuleClick(module.title)}
                className="group relative overflow-hidden cursor-pointer border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ minHeight: '160px' }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="p-6 relative z-10">
                  <div className={`${module.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${module.iconColor}`} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2">{module.title}</h3>
                  <p className="text-sm text-gray-400">{module.description}</p>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${module.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
              </Card>
            );
          })}
        </div>

      </main>
    </div>
  );
};

export default FieldSalesDashboard;
