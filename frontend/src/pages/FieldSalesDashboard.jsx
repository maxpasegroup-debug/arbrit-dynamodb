import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Award, User, TrendingUp, Calendar, GraduationCap, Receipt, MessageCircle, UserCheck, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeadTracker from '@/components/sales/LeadTracker';
import MyTrainingTracker from '@/components/sales/MyTrainingTracker';
import AcademicCalendar from '@/components/sales/AcademicCalendar';
import ExpenseSubmission from '@/components/expenses/ExpenseSubmission';
import FeedbackMessages from '@/components/sales/FeedbackMessages';
import LeaveRequest from '@/components/sales/LeaveRequest';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FieldSalesDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('leads');
  const [stats, setStats] = useState({ leadsCount: 0, revenue: 0, trainingsCount: 0 });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserData(user);
      fetchUserStats();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/sales/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data || { leadsCount: 0, revenue: 0, trainingsCount: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Show zero stats if API fails
      setStats({ leadsCount: 0, revenue: 0, trainingsCount: 0 });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900 border-b border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Field Sales Dashboard</h1>
                <p className="text-green-300">Welcome back, {userData.name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-gray-900">
                <Award className="w-4 h-4 mr-1" />
                {userData.role}
              </Badge>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm" 
                className="border-white/20 text-green-400 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Dashboard Overview</h2>
          <p className="text-slate-300 text-lg">
            Manage field visits, track leads, and coordinate your on-site sales activities.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">My Leads</p>
                <p className="text-2xl font-bold text-white">{stats.leadsCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Revenue Generated</p>
                <p className="text-2xl font-bold text-white">{stats.revenue.toLocaleString()} AED</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Trainings Tracked</p>
                <p className="text-2xl font-bold text-white">{stats.trainingsCount}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-slate-900/5 backdrop-blur-sm border border-white/10">
            <TabsTrigger 
              value="leads"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-green-400"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger 
              value="trainings"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-green-400"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Trainings
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-green-400"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Academic Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="expenses"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-green-400"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger 
              value="feedback"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-green-400"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger 
              value="leave"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-green-400"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Leave
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-6">
            <LeadTracker />
          </TabsContent>
          
          <TabsContent value="trainings" className="mt-6">
            <MyTrainingTracker />
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-6">
            <AcademicCalendar />
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-6">
            <ExpenseSubmission />
          </TabsContent>
          
          <TabsContent value="feedback" className="mt-6">
            <FeedbackMessages />
          </TabsContent>
          
          <TabsContent value="leave" className="mt-6">
            <LeaveRequest />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FieldSalesDashboard;