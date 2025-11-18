import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Award, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SalesEmployeeDashboard = () => {
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
        
        if (userInfo.role !== 'Sales Employee') {
          toast.error('Access denied. Sales Employee role required.');
          navigate('/login');
          return;
        }

        setUser(userInfo);

        // Get dashboard data with badge
        const dashResponse = await axios.get(`${API}/dashboard/sales-employee`, {
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

  const getBadgeColor = (badgeTitle) => {
    const badgeColors = {
      'Sales Manager': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Assistant Sales Manager': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Team Leader': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Business Development Executive': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'Sales Executive': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      'Tele Caller Executive': 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    };
    return badgeColors[badgeTitle] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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
                  <User className="w-5 h-5 text-cyan-400" />
                  <h1 className="text-2xl font-bold text-white">Sales Dashboard</h1>
                </div>
                <p className="text-sm text-gray-400">Employee Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <div className="flex items-center gap-2 justify-end">
                  <Badge className={getBadgeColor(dashboardData?.badge_title)}>
                    {dashboardData?.badge_title || 'Sales Staff'}
                  </Badge>
                </div>
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
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="bg-cyan-500/20 p-4 rounded-2xl">
              <Award className="w-12 h-12 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="text-gray-300 mb-4">
                Your role in the sales team is recognized and valued.
              </p>
              <div className="flex items-center gap-4">
                <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                  <p className="text-xs text-gray-400">Your Badge</p>
                  <Badge className={`${getBadgeColor(dashboardData?.badge_title)} text-base mt-1`}>
                    {dashboardData?.badge_title || 'Sales Staff'}
                  </Badge>
                </div>
                {dashboardData?.branch && (
                  <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                    <p className="text-xs text-gray-400">Branch</p>
                    <p className="text-base font-semibold text-white mt-1">{dashboardData.branch}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Performance</h3>
            </div>
            <p className="text-sm text-gray-300">Your performance metrics and achievements will be displayed here.</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Targets</h3>
            </div>
            <p className="text-sm text-gray-300">Track your sales targets and progress throughout the month.</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Training</h3>
            </div>
            <p className="text-sm text-gray-300">Access training materials and certification programs.</p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">More Features Coming Soon</h3>
            <p className="text-gray-400">Lead management, task tracking, and performance analytics will be available in the next update.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesEmployeeDashboard;