import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, TrendingUp, GraduationCap, Award, MessageSquare, BookOpen,
  Settings, Users, DollarSign, Package, ChevronRight, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sales Components
import UnifiedLeadForm from '@/components/sales/UnifiedLeadForm';
import SalesOverview from '@/components/sales/SalesOverview';
import EmployeeMonitoring from '@/components/sales/EmployeeMonitoring';
import LeadTracker from '@/components/sales/LeadTracker';
import QuotationManagementEnhanced from '@/components/sales/QuotationManagementEnhanced';

// Academic Components
import CourseManagement from '@/components/academic/CourseManagement';
import TrainingRequests from '@/components/academic/TrainingRequests';
import TrainerAllocation from '@/components/academic/TrainerAllocation';
import WorkOrderManagement from '@/components/academic/WorkOrderManagement';
import TrainingSchedule from '@/components/academic/TrainingSchedule';
import AcademicLibrary from '@/components/academic/AcademicLibrary';

// Certificate Components
import CertificateApproval from '@/components/academic/CertificateApproval';
import CertificateGeneration from '@/components/academic/CertificateGeneration';
import CertificateManagement from '@/components/certificates/CertificateManagement';

// Other Components
import TrainingLibrary from '@/components/library/TrainingLibrary';
import AccountingDashboard from '@/components/accounting/AccountingDashboard';
import AssessmentFormBuilder from '@/components/assessment/AssessmentFormBuilder';
import TeamMonitoring from '@/components/academic/TeamMonitoring';
import DeletionApprovals from '@/components/executive/DeletionApprovals';
import ExpenseSubmissionModal from '@/components/coo/ExpenseSubmissionModal';

import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COODashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);

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
        if (userInfo.role !== 'COO') {
          toast.error('Access denied. COO access required.');
          navigate('/login');
          return;
        }

        setUser(userInfo);
        fetchDashboardData();
      } catch (error) {
        console.error('Auth check failed:', error);
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/executive/coo/dashboard-stats`, {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1e3d] via-[#1a2f4d] to-[#0a1e3d] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1e3d] via-[#1a2f4d] to-[#0a1e3d]">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-yellow-600 border-b border-amber-500/30">
        <div className="max-w-full px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-10 h-10" />
              Executive Intelligence Panel
            </h1>
            <p className="text-amber-100 mt-1 text-sm">Strategic Overview &amp; Business Insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-amber-200">{user?.role}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-full px-6 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}
              </h2>
              <p className="text-gray-300 text-lg">Here&apos;s your strategic business intelligence for today</p>
            </div>
            <Button
              onClick={() => setControlPanelOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold px-8 py-6 text-lg"
            >
              <Settings className="w-5 h-5 mr-2" />
              Access Department Access
            </Button>
          </div>
        </div>

        {/* Key Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sales Widget */}
          <Card className="bg-white/5 border-blue-500/30 hover:border-blue-500/50 transition-all cursor-pointer group"
                onClick={() => setControlPanelOpen(true)}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <span>Sales Performance</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Leads</span>
                <span className="text-2xl font-bold text-white">{dashboardData?.leads?.active || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Conversion Rate</span>
                <span className="text-2xl font-bold text-green-400">{dashboardData?.leads?.conversion_rate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Monthly Revenue</span>
                <span className="text-xl font-bold text-yellow-400">AED {dashboardData?.revenue?.monthly || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Academic Widget */}
          <Card className="bg-white/5 border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer group"
                onClick={() => setControlPanelOpen(true)}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-purple-400" />
                  </div>
                  <span>Academic Operations</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Courses</span>
                <span className="text-2xl font-bold text-white">{dashboardData?.courses?.active || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Training Requests</span>
                <span className="text-2xl font-bold text-orange-400">{dashboardData?.training_requests?.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Trainers</span>
                <span className="text-2xl font-bold text-cyan-400">{dashboardData?.trainers?.total || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Certificates Widget */}
          <Card className="bg-white/5 border-green-500/30 hover:border-green-500/50 transition-all cursor-pointer group"
                onClick={() => setControlPanelOpen(true)}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Award className="w-6 h-6 text-green-400" />
                  </div>
                  <span>Certificates & Dispatch</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Certificates</span>
                <span className="text-2xl font-bold text-white">{dashboardData?.certificates?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Pending Dispatch</span>
                <span className="text-2xl font-bold text-red-400">{dashboardData?.alerts?.pending_dispatch || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Delivered</span>
                <span className="text-2xl font-bold text-green-400">{dashboardData?.certificates?.delivered || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Feedbacks Widget */}
          <Card className="bg-white/5 border-pink-500/30 hover:border-pink-500/50 transition-all cursor-pointer group"
                onClick={() => setControlPanelOpen(true)}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-500/20 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-pink-400" />
                  </div>
                  <span>Feedbacks</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-400 transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Feedback</span>
                <span className="text-2xl font-bold text-white">{dashboardData?.feedback?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Average Rating</span>
                <span className="text-2xl font-bold text-yellow-400">{dashboardData?.feedback?.avg_rating || 0} ⭐</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Pending Review</span>
                <span className="text-2xl font-bold text-orange-400">{dashboardData?.feedback?.pending || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Arbrit&apos;s Journey (Library) Widget */}
          <Card className="bg-white/5 border-cyan-500/30 hover:border-cyan-500/50 transition-all cursor-pointer group"
                onClick={() => setControlPanelOpen(true)}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <BookOpen className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span>Arbrit&apos;s Journey</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Training Library</span>
                <span className="text-2xl font-bold text-white">{dashboardData?.library?.total_documents || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Resources</span>
                <span className="text-2xl font-bold text-blue-400">{dashboardData?.library?.resources || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Categories</span>
                <span className="text-2xl font-bold text-purple-400">{dashboardData?.library?.categories || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Department Access Dialog */}
      <Dialog open={controlPanelOpen} onOpenChange={setControlPanelOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">COO Department Access</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="grid w-full grid-cols-9 bg-white/5 border border-white/10 text-xs">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="accounting">Accounting</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="deletions">Deletions</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            {/* Sales */}
            <TabsContent value="sales">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="leads">Leads</TabsTrigger>
                  <TabsTrigger value="quotations">Quotations</TabsTrigger>
                  <TabsTrigger value="team">Team Monitoring</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4"><SalesOverview /></TabsContent>
                <TabsContent value="leads" className="mt-4"><LeadTracker /></TabsContent>
                <TabsContent value="quotations" className="mt-4"><QuotationManagementEnhanced /></TabsContent>
                <TabsContent value="team" className="mt-4"><EmployeeMonitoring /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* Academic */}
            <TabsContent value="academic">
              <Tabs defaultValue="courses" className="w-full">
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="requests">Requests</TabsTrigger>
                  <TabsTrigger value="trainers">Trainers</TabsTrigger>
                  <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="academic-library">Library</TabsTrigger>
                </TabsList>
                <TabsContent value="courses" className="mt-4"><CourseManagement /></TabsContent>
                <TabsContent value="requests" className="mt-4"><TrainingRequests /></TabsContent>
                <TabsContent value="trainers" className="mt-4"><TrainerAllocation /></TabsContent>
                <TabsContent value="work-orders" className="mt-4"><WorkOrderManagement /></TabsContent>
                <TabsContent value="schedule" className="mt-4"><TrainingSchedule /></TabsContent>
                <TabsContent value="academic-library" className="mt-4"><AcademicLibrary /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* Certificates */}
            <TabsContent value="certificates">
              <Tabs defaultValue="approval" className="w-full">
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="approval">Approval</TabsTrigger>
                  <TabsTrigger value="generation">Generation</TabsTrigger>
                  <TabsTrigger value="dispatch">Dispatch & Tracking</TabsTrigger>
                  <TabsTrigger value="reports">Status & Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="approval" className="mt-4"><CertificateApproval /></TabsContent>
                <TabsContent value="generation" className="mt-4"><CertificateGeneration /></TabsContent>
                <TabsContent value="dispatch" className="mt-4"><CertificateManagement /></TabsContent>
                <TabsContent value="reports" className="mt-4"><CertificateManagement /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* Accounting */}
            <TabsContent value="accounting"><AccountingDashboard /></TabsContent>

            {/* Assessments */}
            <TabsContent value="assessments"><AssessmentFormBuilder /></TabsContent>

            {/* Team */}
            <TabsContent value="team"><TeamMonitoring /></TabsContent>

            {/* Library */}
            <TabsContent value="library"><TrainingLibrary /></TabsContent>

            {/* Deletions */}
            <TabsContent value="deletions"><DeletionApprovals /></TabsContent>

            {/* Expenses */}
            <TabsContent value="expenses">
              <div className="text-center py-12">
                <Button onClick={() => setExpenseModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  Submit Expense
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <UnifiedLeadForm mode="enhanced" open={leadModalOpen} onOpenChange={setLeadModalOpen} />
      <ExpenseSubmissionModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
    </div>
  );
};

export default COODashboard;
