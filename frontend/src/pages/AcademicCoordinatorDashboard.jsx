import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, FileText, Award, MessageSquare, LayoutDashboard, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import TrainingCalendar from '@/components/coordinator/TrainingCalendar';
import SessionDocumentation from '@/components/coordinator/SessionDocumentation';
import CertificateCoordination from '@/components/coordinator/CertificateCoordination';
import CoordinatorCommunication from '@/components/coordinator/CoordinatorCommunication';
import ExpenseSubmission from '@/components/expenses/ExpenseSubmission';
import { toast } from 'sonner';

const AcademicCoordinatorDashboard = () => {
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
      if (parsedUser.role !== 'Academic Coordinator') {
        toast.error('Access denied. Academic Coordinator only.');
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
        <p className="text-gray-900">Loading...</p>
      </div>
    );
  }

  const modules = [
    {
      id: 'calendar',
      title: 'Training Calendar',
      description: 'Manage training schedules and sessions',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-white',
      iconColor: 'text-green-400'
    },
    {
      id: 'documentation',
      title: 'Session Documentation',
      description: 'Document training sessions and materials',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-white',
      iconColor: 'text-green-400'
    },
    {
      id: 'certificates',
      title: 'Certificate Coordination',
      description: 'Coordinate certificate delivery and tracking',
      icon: Award,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-white',
      iconColor: 'text-yellow-400'
    },
    {
      id: 'communication',
      title: 'Communication',
      description: 'Communicate with trainers and clients',
      icon: MessageSquare,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-white',
      iconColor: 'text-green-400'
    }
  ];

  const handleModuleClick = (moduleId) => {
    setActiveTab(moduleId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1e3d] via-[#1a2f4d] to-[#0a1e3d]">
      <div className="bg-white/5  border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Academic Coordinator Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Arbrit Safety Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-gray-300 text-green-400 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 bg-white/5  rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-300">
            Manage training schedules, coordinate sessions, and handle certificate delivery.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white/5 backdrop-blur-sm border border-white/10">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="documentation"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documentation
            </TabsTrigger>
            <TabsTrigger 
              value="certificates"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Award className="w-4 h-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger 
              value="communication"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Communication
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
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Card
                      key={module.id}
                      onClick={() => handleModuleClick(module.id)}
                      className="group relative overflow-hidden cursor-pointer border-gray-200 bg-white/5  hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                      style={{ minHeight: '160px' }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      
                      <div className="p-6 relative z-10">
                        <div className={`${module.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 ${module.iconColor}`} />
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{module.title}</h3>
                        <p className="text-sm text-gray-400">{module.description}</p>
                      </div>

                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${module.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <TrainingCalendar />
            </TabsContent>

            <TabsContent value="documentation" className="mt-0">
              <SessionDocumentation />
            </TabsContent>

            <TabsContent value="certificates" className="mt-0">
              <CertificateCoordination />
            </TabsContent>

            <TabsContent value="communication" className="mt-0">
              <CoordinatorCommunication />
            </TabsContent>

            <TabsContent value="expenses" className="mt-0">
              <ExpenseSubmission />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default AcademicCoordinatorDashboard;
