import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, ClipboardCheck, Award, Upload, LayoutDashboard, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import TrainerSchedule from '@/components/trainer/TrainerSchedule';
import AttendanceReport from '@/components/trainer/AttendanceReport';
import CertificateRequest from '@/components/trainer/CertificateRequest';
import TrainerUploads from '@/components/trainer/TrainerUploads';
import AssessmentQRGenerator from '@/components/assessment/AssessmentQRGenerator';
import { toast } from 'sonner';

const TrainerDashboard = () => {
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
      if (parsedUser.role !== 'Trainer') {
        toast.error('Access denied. Trainer only.');
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
      id: 'schedule',
      title: 'My Training Schedule',
      description: 'View your upcoming training sessions',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400'
    },
    {
      id: 'attendance',
      title: 'Attendance & Reports',
      description: 'Mark attendance and submit session reports',
      icon: ClipboardCheck,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-400'
    },
    {
      id: 'certificate',
      title: 'Certificate Request',
      description: 'Request certificates for completed sessions',
      icon: Award,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      iconColor: 'text-yellow-400'
    },
    {
      id: 'uploads',
      title: 'Communication & Uploads',
      description: 'Upload materials and communicate with coordinators',
      icon: Upload,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400'
    }
  ];

  const handleModuleClick = (moduleId) => {
    setActiveTab(moduleId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1e3d] via-[#1a2f4d] to-[#0a1e3d]">
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Trainer Dashboard</h1>
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
            View your schedule, mark attendance, submit reports, and request certificates.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="schedule"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="attendance"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger 
              value="certificate"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Award className="w-4 h-4 mr-2" />
              Certificate
            </TabsTrigger>
            <TabsTrigger 
              value="qr-codes"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Codes
            </TabsTrigger>
            <TabsTrigger 
              value="uploads"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Uploads
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <TabsContent value="schedule" className="mt-0">
              <TrainerSchedule />
            </TabsContent>

            <TabsContent value="attendance" className="mt-0">
              <AttendanceReport />
            </TabsContent>

            <TabsContent value="certificate" className="mt-0">
              <CertificateRequest />
            </TabsContent>

            <TabsContent value="uploads" className="mt-0">
              <TrainerUploads />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default TrainerDashboard;
