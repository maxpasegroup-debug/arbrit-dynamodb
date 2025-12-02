import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Users, FileText, TrendingUp, Award, Calendar, DollarSign, 
  CheckCircle, Clock, AlertTriangle, GraduationCap, Package, 
  ClipboardCheck, BookOpen, LayoutDashboard, Trash2, UserCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

// Executive Components
import DeletionApprovals from '@/components/executive/DeletionApprovals';

import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COODashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'COO') {
        toast.error('Access denied. COO access required.');
        navigate('/login');
        return;
      }
      setUser(parsedUser);
      fetchDashboardStats();
    } catch (error) {
      console.error('Error parsing user:', error);
      toast.error('Session expired. Please login again.');
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/coo/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
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
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-full px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">COO Executive Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Arbrit Safety Management - Complete Operations Oversight</p>
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

      {/* Main Content */}
      <main className="max-w-full px-6 py-8">
        {/* Tabs Navigation */}
        <Tabs defaultValue="dashboard" className="mb-8">
          <TabsList className="grid w-full grid-cols-10 bg-white/10 border border-white/20 text-xs">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="w-4 h-4 mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="sales">
              <TrendingUp className="w-4 h-4 mr-1" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="academic">
              <GraduationCap className="w-4 h-4 mr-1" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="w-4 h-4 mr-1" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="certificate-management">
              <Package className="w-4 h-4 mr-1" />
              Cert Mgmt
            </TabsTrigger>
            <TabsTrigger value="accounting">
              <DollarSign className="w-4 h-4 mr-1" />
              Accounting
            </TabsTrigger>
            <TabsTrigger value="assessments">
              <ClipboardCheck className="w-4 h-4 mr-1" />
              Assessments
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-1" />
              Team
            </TabsTrigger>
            <TabsTrigger value="library">
              <FileText className="w-4 h-4 mr-1" />
              Library
            </TabsTrigger>
            <TabsTrigger value="deletions">
              <Trash2 className="w-4 h-4 mr-1" />
              Deletions
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab - Executive Overview */}
          <TabsContent value="dashboard">
            <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="text-gray-300">
                Monitor organizational performance and oversee operational efficiency.
              </p>
            </div>

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      Active Leads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{stats.active_leads || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Across all pipelines</p>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-400">{stats.conversion_rate || 0}%</p>
                    <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-400" />
                      Monthly Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-400">AED {stats.monthly_revenue || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Current month</p>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-400" />
                      Trainings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-400">{stats.total_trainings || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">This month</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => setLeadModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Create New Lead
              </Button>
            </div>
          </TabsContent>

          {/* Sales Operations */}
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

          {/* Academic Operations */}
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

          {/* Certificates */}
          <TabsContent value="certificates">
            <Tabs defaultValue="approval" className="w-full">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="approval">Approval</TabsTrigger>
                <TabsTrigger value="generation">Generation</TabsTrigger>
              </TabsList>
              <TabsContent value="approval" className="mt-4">
                <CertificateApproval />
              </TabsContent>
              <TabsContent value="generation" className="mt-4">
                <CertificateGeneration />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Certificate Management (Dispatch & Reports) */}
          <TabsContent value="certificate-management">
            <CertificateManagement />
          </TabsContent>

          {/* Accounting */}
          <TabsContent value="accounting">
            <AccountingDashboard />
          </TabsContent>

          {/* Assessments */}
          <TabsContent value="assessments">
            <AssessmentFormBuilder />
          </TabsContent>

          {/* Team Monitoring */}
          <TabsContent value="team">
            <TeamMonitoring />
          </TabsContent>

          {/* Library */}
          <TabsContent value="library">
            <TrainingLibrary />
          </TabsContent>

          {/* Deletions */}
          <TabsContent value="deletions">
            <DeletionApprovals />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <UnifiedLeadForm mode="enhanced" open={leadModalOpen} onOpenChange={setLeadModalOpen} />
    </div>
  );
};

export default COODashboard;
