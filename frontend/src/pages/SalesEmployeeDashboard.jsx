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

const SalesEmployeeDashboard = () => {
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
      navigate('/login');
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-900 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sales Employee Dashboard</h1>
                <p className="text-gray-600">Welcome back, {userData.name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-gray-900 text-white border-gray-900">
                <Award className="w-4 h-4 mr-1" />
                {userData.role}
              </Badge>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard Overview</h2>
          <p className="text-gray-600 text-lg">
            Manage your sales activities, track progress, and coordinate with the team.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">My Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.leadsCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-700" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Revenue Generated</p>
                <p className="text-2xl font-bold text-gray-900">{stats.revenue.toLocaleString()} AED</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Trainings Tracked</p>
                <p className="text-2xl font-bold text-gray-900">{stats.trainingsCount}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-gray-700" />
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger 
              value="leads"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger 
              value="trainings"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Trainings
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Academic Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="expenses"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger 
              value="feedback"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger 
              value="leave"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-300"
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

export default SalesEmployeeDashboard;