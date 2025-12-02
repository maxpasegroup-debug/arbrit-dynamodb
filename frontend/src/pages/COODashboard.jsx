import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, TrendingUp, Users, GraduationCap, AlertTriangle, Lightbulb, 
  Building2, BarChart4, Shield, Plus, DollarSign, Briefcase, Award, 
  Package, FileText, Trash2, Calendar, UserCheck, ClipboardCheck, 
  Receipt, BookOpen, LayoutDashboard, FileCheck, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import CertificateApproval from '@/components/academic/CertificateApproval';
import CertificateGeneration from '@/components/academic/CertificateGeneration';
import TeamMonitoring from '@/components/academic/TeamMonitoring';
import AcademicLibrary from '@/components/academic/AcademicLibrary';

// Assessment Components
import AssessmentFormBuilder from '@/components/assessment/AssessmentFormBuilder';

// Certificate & Library Components
import TrainingLibrary from '@/components/library/TrainingLibrary';
import CertificateManagement from '@/components/certificates/CertificateManagement';

// Accounting Components
import AccountingDashboard from '@/components/accounting/AccountingDashboard';

// Feedback & Library Components
import FeedbackManagement from '@/components/feedback/FeedbackManagement';
import CompletedTrainings from '@/components/library/CompletedTrainings';

// Executive Components
import ExpenseSubmissionModal from '@/components/coo/ExpenseSubmissionModal';
import DeletionApprovals from '@/components/executive/DeletionApprovals';

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
  const [departmentPanelOpen, setDepartmentPanelOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (!['COO', 'CEO', 'Management'].includes(parsedUser.role)) {
        toast.error('Access denied. COO/CEO access only.');
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
      // COO dashboard doesn't need to fetch data - tabs handle their own data
      setDashboardData({});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
                Here&apos;s your strategic business intelligence for today
              </p>
            </div>
            <Button
              onClick={() => navigate('/dashboard/coo')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold px-4 sm:px-6 py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto text-sm sm:text-base"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Access Department Panel
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="sales" className="mb-8">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 border border-white/20">
            <TabsTrigger value="sales">
              <TrendingUp className="w-4 h-4 mr-2" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="academics">
              <GraduationCap className="w-4 h-4 mr-2" />
              Academics
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="w-4 h-4 mr-2" />
              Certificates & Dispatch
            </TabsTrigger>
            <TabsTrigger value="feedbacks">
              <MessageSquare className="w-4 h-4 mr-2" />
              Feedbacks
            </TabsTrigger>
            <TabsTrigger value="arbrits-journey">
              <BookOpen className="w-4 h-4 mr-2" />
              Arbrit&apos;s Journey
            </TabsTrigger>
          </TabsList>


          {/* Sales Tab */}
          <TabsContent value="sales">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="leads">Leads</TabsTrigger>
                <TabsTrigger value="quotations">Quotations</TabsTrigger>
                <TabsTrigger value="team">Team Monitoring</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <SalesOverview />
              </TabsContent>
              <TabsContent value="leads" className="mt-4">
                <LeadTracker />
              </TabsContent>
              <TabsContent value="quotations" className="mt-4">
                <QuotationManagementEnhanced />
              </TabsContent>
              <TabsContent value="team" className="mt-4">
                <EmployeeMonitoring />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Academics Tab */}
          <TabsContent value="academics">
            <Tabs defaultValue="courses" className="w-full">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="trainers">Trainers</TabsTrigger>
                <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="academic-library">Library</TabsTrigger>
              </TabsList>
              <TabsContent value="courses" className="mt-4">
                <CourseManagement />
              </TabsContent>
              <TabsContent value="requests" className="mt-4">
                <TrainingRequests />
              </TabsContent>
              <TabsContent value="trainers" className="mt-4">
                <TrainerAllocation />
              </TabsContent>
              <TabsContent value="work-orders" className="mt-4">
                <WorkOrderManagement />
              </TabsContent>
              <TabsContent value="schedule" className="mt-4">
                <TrainingSchedule />
              </TabsContent>
              <TabsContent value="academic-library" className="mt-4">
                <AcademicLibrary />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Certificates & Dispatch Tab */}
          <TabsContent value="certificates">
            <CertificateManagement />
          </TabsContent>

          {/* Feedbacks Tab */}
          <TabsContent value="feedbacks">
            <FeedbackManagement />
          </TabsContent>

          {/* Arbrit&apos;s Journey Tab */}
          <TabsContent value="arbrits-journey">
            <CompletedTrainings />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <UnifiedLeadForm mode="enhanced" open={leadModalOpen} onOpenChange={setLeadModalOpen} />
      <ExpenseSubmissionModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
    </div>
  );
};

export default COODashboard;
