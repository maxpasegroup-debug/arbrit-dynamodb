import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LogOut, TrendingUp, Users, Phone } from 'lucide-react';
import { toast } from 'sonner';
import LeadTracker from '../components/sales/LeadTracker';

const API = process.env.REACT_APP_BACKEND_URL;

export default function TeleSalesDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ leads: 0, quoted: 0, won: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'Tele Sales') {
      navigate('/login');
      return;
    }

    setUserData(user);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const leads = response.data || [];
      setStats({
        leads: leads.length,
        quoted: leads.filter(l => l.quotation_sent).length,
        won: leads.filter(l => l.status === 'Won').length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-white/10 sticky top-0 z-10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Tele Sales Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">Welcome, {userData.name}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-400/50 text-red-300 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Leads</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.leads}</p>
                </div>
                <Users className="w-12 h-12 text-blue-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Quoted</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.quoted}</p>
                </div>
                <Phone className="w-12 h-12 text-purple-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Won Deals</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.won}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-400 opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Lead Tracker */}
        <LeadTracker />
      </div>
    </div>
  );
}
