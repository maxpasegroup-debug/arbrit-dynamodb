import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  LayoutDashboard, 
  GraduationCap, 
  Package, 
  Calendar, 
  BookOpen, 
  ClipboardCheck, 
  Users, 
  Receipt,
  TrendingUp,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

// Import components
import TrainingTrackerMetroNew from '@/components/training/TrainingTrackerMetroNew';
import CertificateDispatchManagement from '@/components/certificates/CertificateDispatchManagement';
import TrainingAllocationManagement from '@/components/academic/TrainingAllocationManagement';
import CourseManagement from '@/components/academic/CourseManagement';
import AssessmentFormBuilder from '@/components/assessment/AssessmentFormBuilder';
import AssessmentQRGenerator from '@/components/assessment/AssessmentQRGenerator';
import AssessmentReports from '@/components/assessment/AssessmentReports';
import TeamMonitoring from '@/components/academic/TeamMonitoring';
import ExpenseSubmission from '@/components/expenses/ExpenseSubmission';
import QuotationApprovalManagement from '@/components/approvals/QuotationApprovalManagement';
import InvoiceApprovalManagement from '@/components/approvals/InvoiceApprovalManagement';
import LeaveApprovalManagement from '@/components/hr/LeaveApprovalManagement';
import ExpenseApprovalManagement from '@/components/hr/ExpenseApprovalManagement';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AcademicHeadDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalTrainings: 0,
    activeTrainings: 0,
    completedTrainings: 0,
    pendingCertificates: 0,
    totalTrainers: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token || userData.role !== 'Academic Head') {
      toast.error('Access denied');
      navigate('/login');
    } else {
      setUser(userData);
      fetchStats();
      setLoading(false);
    }
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [trainingsRes, certificatesRes, trainersRes, requestsRes] = await Promise.all([
        axios.get(`${API}/academic/trainings`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/certificates`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/academic/trainers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/booking-requests`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const trainings = trainingsRes.data || [];
      const certificates = certificatesRes.data || [];
      const requests = requestsRes.data || [];

      setStats({
        totalTrainings: trainings.length,
        activeTrainings: trainings.filter(t => t.status === 'Active' || t.status === 'In Progress').length,
        completedTrainings: trainings.filter(t => t.status === 'Completed').length,
        pendingCertificates: certificates.filter(c => c.status === 'pending').length,
        totalTrainers: trainersRes.data?.length || 0,
        pendingRequests: requests.filter(r => r.status === 'pending').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1e3d] via-[#1a2f4d] to-[#2a3f5d] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1e3d] via-[#1a2f4d] to-[#2a3f5d]">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Academic Head Dashboard</h1>
              <p className="text-sm text-slate-400">Arbrit Safety Management</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-yellow-400">Academic Head</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-white/20 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-10 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="approvals"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approvals
            </TabsTrigger>
            <TabsTrigger 
              value="training-tracker"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Training Tracker
            </TabsTrigger>
            <TabsTrigger 
              value="despatch-delivery"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Package className="w-4 h-4 mr-2" />
              Despatch & Delivery
            </TabsTrigger>
            <TabsTrigger 
              value="training-calendar"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Training Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="courses"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger 
              value="assessments-feedback"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Assessments & Feedback
            </TabsTrigger>
            <TabsTrigger 
              value="my-team"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Users className="w-4 h-4 mr-2" />
              My Team
            </TabsTrigger>
            <TabsTrigger 
              value="leaves"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Leaves
            </TabsTrigger>
            <TabsTrigger 
              value="expenses"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* 1. OVERVIEW */}
            <TabsContent value="overview" className="mt-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Trainings */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">Total Trainings</p>
                        <p className="text-4xl font-bold text-white mt-2">{stats.totalTrainings}</p>
                        <p className="text-xs text-gray-400 mt-1">All time</p>
                      </div>
                      <GraduationCap className="w-12 h-12 text-blue-400 opacity-50" />
                    </div>
                  </div>

                  {/* Active Trainings */}
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">Active Trainings</p>
                        <p className="text-4xl font-bold text-white mt-2">{stats.activeTrainings}</p>
                        <p className="text-xs text-gray-400 mt-1">In progress</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-green-400 opacity-50" />
                    </div>
                  </div>

                  {/* Completed Trainings */}
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">Completed</p>
                        <p className="text-4xl font-bold text-white mt-2">{stats.completedTrainings}</p>
                        <p className="text-xs text-gray-400 mt-1">Finished</p>
                      </div>
                      <Award className="w-12 h-12 text-purple-400 opacity-50" />
                    </div>
                  </div>

                  {/* Pending Certificates */}
                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">Pending Certificates</p>
                        <p className="text-4xl font-bold text-white mt-2">{stats.pendingCertificates}</p>
                        <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
                      </div>
                      <Package className="w-12 h-12 text-yellow-400 opacity-50" />
                    </div>
                  </div>

                  {/* Total Trainers */}
                  <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">Total Trainers</p>
                        <p className="text-4xl font-bold text-white mt-2">{stats.totalTrainers}</p>
                        <p className="text-xs text-gray-400 mt-1">Active trainers</p>
                      </div>
                      <Users className="w-12 h-12 text-cyan-400 opacity-50" />
                    </div>
                  </div>

                  {/* Pending Requests */}
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">Pending Requests</p>
                        <p className="text-4xl font-bold text-white mt-2">{stats.pendingRequests}</p>
                        <p className="text-xs text-gray-400 mt-1">Needs review</p>
                      </div>
                      <Clock className="w-12 h-12 text-red-400 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>


            {/* 2. APPROVALS - Quotations & Invoices */}
            <TabsContent value="approvals" className="mt-0">
              <Tabs defaultValue="quotations" className="space-y-6">
                <TabsList className="bg-white/10 border border-white/20">
                  <TabsTrigger value="quotations" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white">
                    Quotations
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white">
                    Invoices
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="quotations" className="mt-0">
                  <QuotationApprovalManagement />
                </TabsContent>
                
                <TabsContent value="invoices" className="mt-0">
                  <InvoiceApprovalManagement />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* 2. TRAINING TRACKER - Metro Style */}
            <TabsContent value="training-tracker" className="mt-0">
              <TrainingTrackerMetroNew />
            </TabsContent>

            {/* 3. DESPATCH & DELIVERY */}
            <TabsContent value="despatch-delivery" className="mt-0">
              <CertificateDispatchManagement />
            </TabsContent>

            {/* 4. TRAINING CALENDAR - Unified Workflow */}
            <TabsContent value="training-calendar" className="mt-0">
              <TrainingCalendarUnified />
            </TabsContent>

            {/* 5. COURSES */}
            <TabsContent value="courses" className="mt-0">
              <CourseManagement />
            </TabsContent>

            {/* 6. ASSESSMENTS & FEEDBACK */}
            <TabsContent value="assessments-feedback" className="mt-0">
              <Tabs defaultValue="assessments" className="space-y-6">
                <TabsList className="bg-white/10 border border-white/20">
                  <TabsTrigger value="assessments">Assessments</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback Forms</TabsTrigger>
                  <TabsTrigger value="reports">Reports & Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="assessments">
                  <Tabs defaultValue="create" className="space-y-4">
                    <TabsList className="bg-white/5 border border-white/10">
                      <TabsTrigger value="create">Create Assessment</TabsTrigger>
                      <TabsTrigger value="qr">Generate QR</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="create">
                      <AssessmentFormBuilder onBack={() => {}} onFormCreated={() => {}} />
                    </TabsContent>
                    
                    <TabsContent value="qr">
                      <AssessmentQRGenerator userRole="Academic Head" />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
                
                <TabsContent value="feedback">
                  <Tabs defaultValue="create" className="space-y-4">
                    <TabsList className="bg-white/5 border border-white/10">
                      <TabsTrigger value="create">Create Feedback Form</TabsTrigger>
                      <TabsTrigger value="qr">Generate QR</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="create">
                      <AssessmentFormBuilder onBack={() => {}} onFormCreated={() => {}} formType="feedback" />
                    </TabsContent>
                    
                    <TabsContent value="qr">
                      <AssessmentQRGenerator userRole="Academic Head" formType="feedback" />
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="reports">
                  <AssessmentReports />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* 7. MY TEAM */}
            <TabsContent value="my-team" className="mt-0">
              <TeamMonitoring />
            </TabsContent>

            {/* 8. EXPENSES */}

            {/* 9. LEAVES */}
            <TabsContent value="leaves" className="mt-0">
              <LeaveApprovalManagement role="Academic Head" />
            </TabsContent>

            <TabsContent value="expenses" className="mt-0">
              <Tabs defaultValue="my-expenses" className="space-y-6">
                <TabsList className="bg-white/10 border border-white/20">
                  <TabsTrigger value="my-expenses">My Expenses</TabsTrigger>
                  <TabsTrigger value="team-expenses">Team Expenses Review</TabsTrigger>
                </TabsList>
                
                <TabsContent value="my-expenses">
                  <ExpenseSubmission />
                </TabsContent>
                
                <TabsContent value="team-expenses">
                  <ExpenseApprovalManagement />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default AcademicHeadDashboard;
