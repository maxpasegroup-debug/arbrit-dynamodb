import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, GraduationCap, Users, FileText, Calendar, Award, UserCheck, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import TrainingRequests from '@/components/academic/TrainingRequests';
import TrainerAllocation from '@/components/academic/TrainerAllocation';
import WorkOrderManagement from '@/components/academic/WorkOrderManagement';
import TrainingSchedule from '@/components/academic/TrainingSchedule';
import CertificateApproval from '@/components/academic/CertificateApproval';
import TeamMonitoring from '@/components/academic/TeamMonitoring';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AcademicHeadDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'Academic Head') {
        toast.error('Access denied. Academic Head only.');
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
    if (moduleId === 'training-requests') {
      setActiveView('training-requests');
    } else {
      toast.info('This feature is being finalized');
    }
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
        {activeView === 'overview' ? (
          <>
            <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="text-gray-300">
                Manage training operations, approve work orders, and oversee the academic team.
              </p>
            </div>

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
          </>
        ) : activeView === 'training-requests' ? (
          <div>
            <Button
              onClick={() => setActiveView('overview')}
              variant="outline"
              className="mb-6 border-white/20 text-white hover:bg-white/10"
            >
              ← Back to Overview
            </Button>
            <TrainingRequests />
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default AcademicHeadDashboard;
