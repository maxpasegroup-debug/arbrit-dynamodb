import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, TrendingUp, GraduationCap, DollarSign, Truck, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COODashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (!['COO', 'Management', 'MD', 'CEO'].includes(parsedUser.role)) {
        toast.error('Access denied. Executive access only.');
        navigate('/login');
        return;
      }
      setUser(parsedUser);
      fetchDashboardData();
    } catch (error) {
      console.error('Error parsing user:', error);
      toast.error('Session expired. Please login again.');
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/executive/coo-dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1e3d] via-[#1a2f4d] to-[#0a1e3d] flex items-center justify-center">
        <p className="text-white">Loading executive dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1e3d] via-[#1a2f4d] to-[#0a1e3d]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">COO Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Executive Operations Control Center</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-300">
            Real-time operational intelligence across all departments
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* HRM Overview */}
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-white">HRM Overview</CardTitle>
              <Users className="w-5 h-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Employees</span>
                  <span className="text-2xl font-bold text-white">{dashboardData.hrm.total_employees}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Present Today</span>
                  <span className="text-lg font-semibold text-green-400">{dashboardData.hrm.present_today}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Attendance Rate</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                    {dashboardData.hrm.attendance_rate}%
                  </Badge>
                </div>
                {dashboardData.hrm.expiring_documents > 0 && (
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-400/30 rounded">
                    <p className="text-xs text-amber-300">
                      ⚠️ {dashboardData.hrm.expiring_documents} documents expiring soon
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sales Performance */}
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-white">Sales Performance</CardTitle>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Leads</span>
                  <span className="text-2xl font-bold text-white">{dashboardData.sales.total_leads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Converted</span>
                  <span className="text-lg font-semibold text-green-400">{dashboardData.sales.converted_leads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Conversion Rate</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                    {dashboardData.sales.conversion_rate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Active Quotations</span>
                  <span className="text-lg font-semibold text-blue-400">{dashboardData.sales.active_quotations}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Operations */}
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-white">Academic Operations</CardTitle>
              <GraduationCap className="w-5 h-5 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Active Trainers</span>
                  <span className="text-2xl font-bold text-white">{dashboardData.academic.active_trainers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Work Orders</span>
                  <span className="text-lg font-semibold text-blue-400">{dashboardData.academic.total_work_orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Completed</span>
                  <span className="text-lg font-semibold text-green-400">{dashboardData.academic.completed_sessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Certificates</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/50">
                    {dashboardData.academic.certificates_generated}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accounts Snapshot */}
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-white">Accounts & Finance</CardTitle>
              <DollarSign className="w-5 h-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Invoices</span>
                  <span className="text-2xl font-bold text-white">{dashboardData.accounts.total_invoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Pending Payments</span>
                  <span className="text-lg font-semibold text-amber-400">{dashboardData.accounts.pending_payments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Revenue (Month)</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                    AED {dashboardData.accounts.revenue_this_month}
                  </Badge>
                </div>
                <div className="mt-3 p-2 bg-blue-500/10 border border-blue-400/30 rounded">
                  <p className="text-xs text-blue-300">
                    💡 Finance module integration pending
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispatch Status */}
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-white">Dispatch Status</CardTitle>
              <Truck className="w-5 h-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Pending Dispatch</span>
                  <span className="text-2xl font-bold text-white">{dashboardData.dispatch.pending_dispatch}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Out for Delivery</span>
                  <span className="text-lg font-semibold text-blue-400">{dashboardData.dispatch.out_for_delivery}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Delivered Today</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                    {dashboardData.dispatch.delivered_today}
                  </Badge>
                </div>
                {dashboardData.dispatch.pending_dispatch > 10 && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-400/30 rounded">
                    <p className="text-xs text-red-300">
                      🚨 High pending dispatches - allocate resources
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organization KPIs */}
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-white">Organization KPIs</CardTitle>
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Overall Health</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                    Excellent
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Productivity</span>
                      <span className="text-white">{dashboardData.hrm.attendance_rate}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                        style={{ width: `${dashboardData.hrm.attendance_rate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Sales Performance</span>
                      <span className="text-white">{dashboardData.sales.conversion_rate}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${dashboardData.sales.conversion_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default COODashboard;
