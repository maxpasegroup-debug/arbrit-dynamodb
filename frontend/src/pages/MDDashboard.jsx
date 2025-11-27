import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, TrendingUp, Users, GraduationCap, AlertTriangle, Lightbulb, Building2, BarChart4, Shield, Plus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LeadSubmissionModal from '@/components/coo/LeadSubmissionModal';
import ExpenseSubmissionModal from '@/components/coo/ExpenseSubmissionModal';
import DeletionApprovals from '@/components/executive/DeletionApprovals';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MDDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (!['MD', 'CEO', 'Management'].includes(parsedUser.role)) {
        toast.error('Access denied. MD/CEO access only.');
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
      const response = await axios.get(`${API}/executive/md-dashboard`, {
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

  const getHealthColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-400';
    if (score >= 60) return 'from-yellow-500 to-amber-400';
    return 'from-red-500 to-rose-400';
  };

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center">
        <p className="text-amber-200">Loading executive intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* Royal Header */}
      <div className="bg-gradient-to-r from-amber-900/20 via-amber-800/10 to-amber-900/20 backdrop-blur-sm border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                Executive Intelligence Panel
              </h1>
              <p className="text-xs sm:text-sm text-amber-300/70 mt-1">Strategic Overview & Business Insights</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-left sm:text-right flex-1 sm:flex-initial">
                <p className="text-sm font-medium text-amber-100">{user?.name}</p>
                <p className="text-xs text-amber-300/70">{user?.role}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-10 bg-gradient-to-r from-amber-900/10 to-transparent rounded-xl sm:rounded-2xl border border-amber-500/20 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-100 mb-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}
              </h2>
              <p className="text-sm sm:text-base text-amber-200/70">
                Here's your strategic business intelligence for today
              </p>
            </div>
            <Button
              onClick={() => navigate('/dashboard/coo')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold px-4 sm:px-6 py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto text-sm sm:text-base"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Access Control Panel
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setLeadModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Submit New Lead
          </button>
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
          >
            <DollarSign className="w-5 h-5" /> Submit Expense
          </button>
        </div>

        {/* Top Row - Corporate Health */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-amber-500/30 hover:border-amber-500/50 transition-all">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-amber-400" />
                  <CardTitle className="text-xl text-amber-100">Corporate Health Score</CardTitle>
                </div>
                <Badge className={`bg-gradient-to-r ${getHealthColor(dashboardData.corporate_health.score)} text-white px-4 py-1 text-lg`}>
                  {dashboardData.corporate_health.score}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-amber-100 mb-1">{dashboardData.corporate_health.attendance_score.toFixed(0)}%</p>
                  <p className="text-xs sm:text-sm text-amber-300/70">Workforce</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-amber-100 mb-1">{dashboardData.corporate_health.sales_score.toFixed(0)}%</p>
                  <p className="text-sm text-amber-300/70">Sales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-amber-100 mb-1">{dashboardData.corporate_health.operations_score.toFixed(0)}%</p>
                  <p className="text-xs sm:text-sm text-amber-300/70">Operations</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-400 mb-1">{dashboardData.corporate_health.rating}</p>
                  <p className="text-sm text-amber-300/70">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Executive Analytics */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 hover:border-amber-500/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart4 className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-base text-amber-100">Executive Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-amber-100">{dashboardData.executive_analytics.total_employees}</p>
                <p className="text-sm text-slate-400">Total Workforce</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-semibold text-amber-200">{dashboardData.executive_analytics.total_work_orders}</p>
                  <p className="text-xs text-slate-400">Work Orders</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-green-400">{dashboardData.executive_analytics.completion_rate}%</p>
                  <p className="text-xs text-slate-400">Completion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workforce Intelligence */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 hover:border-amber-500/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-base text-amber-100">Workforce Intelligence</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-amber-100">{dashboardData.workforce.total}</p>
                <p className="text-sm text-slate-400">Active Employees</p>
              </div>
              <div className="space-y-2">
                {Object.entries(dashboardData.workforce.by_department).slice(0, 4).map(([dept, count]) => (
                  <div key={dept} className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{dept}</span>
                    <Badge className="bg-slate-700/50 text-slate-200 border-slate-600">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sales Intelligence */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 hover:border-amber-500/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <CardTitle className="text-base text-amber-100">Sales Intelligence</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold text-amber-100">{dashboardData.sales.total_leads}</p>
                  <p className="text-xs text-slate-400">Total Leads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{dashboardData.sales.converted}</p>
                  <p className="text-xs text-slate-400">Converted</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Conversion Rate</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                      style={{ width: `${dashboardData.sales.conversion_rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-green-400">{dashboardData.sales.conversion_rate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Excellence */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 hover:border-amber-500/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-yellow-400" />
                <CardTitle className="text-base text-amber-100">Academic Excellence</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-amber-100">{dashboardData.academic.certificates_issued}</p>
                <p className="text-sm text-slate-400">Certificates Issued</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-semibold text-amber-200">{dashboardData.academic.active_trainers}</p>
                  <p className="text-xs text-slate-400">Active Trainers</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-blue-400">{dashboardData.academic.completed_sessions}</p>
                  <p className="text-xs text-slate-400">Sessions Done</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executive Alerts */}
          <Card className="bg-gradient-to-br from-red-900/20 to-slate-900/40 border-red-500/30 hover:border-red-500/50 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <CardTitle className="text-base text-amber-100">Executive Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-red-400">{dashboardData.alerts.total_critical}</p>
                <p className="text-sm text-slate-400">Critical Items</p>
              </div>
              <div className="space-y-2">
                {dashboardData.alerts.pending_dispatch > 0 && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="text-xs text-red-300">🚨 {dashboardData.alerts.pending_dispatch} Pending Dispatches</p>
                  </div>
                )}
                {dashboardData.alerts.expiring_documents > 0 && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                    <p className="text-xs text-amber-300">⏰ {dashboardData.alerts.expiring_documents} Documents Expiring</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900/40 border-purple-500/30 hover:border-purple-500/50 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-base text-amber-100">AI Business Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.ai_insights.map((insight, idx) => (
                  <div key={idx} className="p-2 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-300">
                    {insight}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modals */}
      <LeadSubmissionModal open={leadModalOpen} onOpenChange={setLeadModalOpen} />
      <ExpenseSubmissionModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
    </div>
  );
};

export default MDDashboard;
