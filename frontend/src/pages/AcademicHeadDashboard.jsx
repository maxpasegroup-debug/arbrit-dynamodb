import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, GraduationCap, Users, FileText, Calendar, Award, UserCheck, LayoutDashboard, FileCheck, ClipboardCheck, Receipt, Package, FileBarChart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import TrainingRequests from '@/components/academic/TrainingRequests';
import TrainerAllocation from '@/components/academic/TrainerAllocation';
import WorkOrderManagement from '@/components/academic/WorkOrderManagement';
import TrainingSchedule from '@/components/academic/TrainingSchedule';
import CertificateApproval from '@/components/academic/CertificateApproval';
import CertificateGeneration from '@/components/academic/CertificateGeneration';
import TeamMonitoring from '@/components/academic/TeamMonitoring';
import AssessmentFormBuilder from '@/components/assessment/AssessmentFormBuilder';
import AssessmentQRGenerator from '@/components/assessment/AssessmentQRGenerator';
import AssessmentReports from '@/components/assessment/AssessmentReports';
import CourseManagement from '@/components/academic/CourseManagement';
import CertificateManagement from '@/components/certificates/CertificateManagement';
import CertificateDispatchManagement from '@/components/certificates/CertificateDispatchManagement';
import AcademicTrainingBoard from '@/components/training/AcademicTrainingBoard';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AcademicHeadDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (!['Academic Head', 'COO', 'MD', 'CEO'].includes(parsedUser.role)) {
        toast.error('Access denied. Academic Head access required.');
        navigate('/login');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user:', error);
      toast.error('Session expired. Please login again.');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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

  const modules = [
    {
      id: 'training-requests',
      title: 'Training Requests',
      description: 'Review and approve trainer availability requests',
      icon: GraduationCap,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      iconColor: 'text-yellow-400'
    },
    {
      id: 'trainers',
      title: 'Trainer Allocation',
      description: 'Manage trainer pool and assignments',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400'
    },
    {
      id: 'work-orders',
      title: 'Work Orders',
      description: 'Approve and assign work orders',
      icon: FileText,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-400'
    },
    {
      id: 'schedule',
      title: 'Training Schedule',
      description: 'View and manage training sessions',
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400'
    },
    {
      id: 'certificates',
      title: 'Certificate Approval',
      description: 'Approve certificate issuance',
      icon: Award,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-500/10',
      iconColor: 'text-indigo-400'
    },
    {
      id: 'team',
      title: 'Academic Team',
      description: 'Monitor team attendance and performance',
      icon: UserCheck,
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-500/10',
      iconColor: 'text-teal-400'
    }
  ];

  const handleModuleClick = (moduleId) => {
    const moduleToTab = {
      'training-requests': 'requests',
      'trainers': 'trainers',
      'work-orders': 'work-orders',
      'schedule': 'schedule',
      'certificates': 'certificates',
      'team': 'team'
    };
    setActiveTab(moduleToTab[moduleId] || 'overview');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1e3d] via-[#1a2f4d] to-[#0a1e3d]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Academic Head Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Arbrit Safety Management</p>
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
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-300">
            Manage training operations, approve work orders, and oversee the academic team.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="overview"
              data-testid="tab-overview"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="training-tracker"
              data-testid="tab-training-tracker"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Training Tracker
            </TabsTrigger>
            <TabsTrigger 
              value="schedule-trainings"
              data-testid="tab-schedule-trainings"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Trainings
            </TabsTrigger>
            <TabsTrigger 
              value="courses"
              data-testid="tab-courses"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger 
              value="my-team"
              data-testid="tab-my-team"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Users className="w-4 h-4 mr-2" />
              My Team
            </TabsTrigger>
            <TabsTrigger 
              value="certifications"
              data-testid="tab-certifications"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Award className="w-4 h-4 mr-2" />
              Certifications & Despatch
            </TabsTrigger>
            <TabsTrigger 
              value="assessments-feedbacks"
              data-testid="tab-assessments-feedbacks"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Assessments & Feedbacks
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* A. OVERVIEW TAB */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Card
                      key={module.id}
                      onClick={() => handleModuleClick(module.id)}
                      className="group relative overflow-hidden cursor-pointer border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                      style={{ minHeight: '160px' }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      
                      <div className="p-6 relative z-10">
                        <div className={`${module.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 ${module.iconColor}`} />
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-2">{module.title}</h3>
                        <p className="text-sm text-gray-400">{module.description}</p>
                      </div>

                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${module.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* B. TRAINING TRACKER TAB */}
            <TabsContent value="training-tracker" className="mt-0">
              <AcademicTrainingBoard />
            </TabsContent>

            {/* C. SCHEDULE TRAININGS TAB - Calendar requests + scheduling */}
            <TabsContent value="schedule-trainings" className="mt-0">
              <Tabs defaultValue="requests" className="space-y-6">
                <TabsList className="bg-white/10 border border-white/20">
                  <TabsTrigger value="requests">Booking Requests</TabsTrigger>
                  <TabsTrigger value="schedule">Training Schedule</TabsTrigger>
                  <TabsTrigger value="trainers">Trainer Allocation</TabsTrigger>
                  <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="requests">
                  <TrainingRequests />
                </TabsContent>
                
                <TabsContent value="schedule">
                  <TrainingSchedule />
                </TabsContent>

                <TabsContent value="trainers">
                  <TrainerAllocation />
                </TabsContent>

                <TabsContent value="work-orders">
                  <WorkOrderManagement />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* D. COURSES TAB */}
            <TabsContent value="courses" className="mt-0">
              <CourseManagement />
            </TabsContent>

            {/* E. MY TEAM TAB */}
            <TabsContent value="my-team" className="mt-0">
              <TeamMonitoring />
            </TabsContent>

            {/* F. CERTIFICATIONS AND DESPATCH TRACKER TAB */}
            <TabsContent value="certifications" className="mt-0">
              <Tabs defaultValue="approval" className="space-y-6">
                <TabsList className="bg-white/10 border border-white/20">
                  <TabsTrigger value="approval">Certificate Approval</TabsTrigger>
                  <TabsTrigger value="generate">Generate Certificates</TabsTrigger>
                  <TabsTrigger value="dispatch">Despatch Management</TabsTrigger>
                  <TabsTrigger value="management">Certificate Mgmt</TabsTrigger>
                </TabsList>
                
                <TabsContent value="approval">
                  <CertificateApproval />
                </TabsContent>
                
                <TabsContent value="generate">
                  <CertificateGeneration />
                </TabsContent>

                <TabsContent value="dispatch">
                  <CertificateDispatchManagement />
                </TabsContent>

                <TabsContent value="management">
                  <CertificateManagement />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* G. ASSESSMENTS AND FEEDBACKS TAB */}
            <TabsContent value="assessments-feedbacks" className="mt-0">
              <Tabs defaultValue="create" className="space-y-6">
                <TabsList className="bg-white/10 border border-white/20">
                  <TabsTrigger value="create">Create Form</TabsTrigger>
                  <TabsTrigger value="qr">Generate QR</TabsTrigger>
                  <TabsTrigger value="reports">Reports & Feedbacks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="create">
                  <AssessmentFormBuilder onBack={() => {}} onFormCreated={() => {}} />
                </TabsContent>
                
                <TabsContent value="qr">
                  <AssessmentQRGenerator userRole="Academic Head" />
                </TabsContent>
                
                <TabsContent value="reports">
                  <AssessmentReports />
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
