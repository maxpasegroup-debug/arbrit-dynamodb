import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, Users, Truck, FileCheck, UserCheck, BarChart3, LayoutDashboard, Receipt, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import CertificatesReady from '@/components/dispatch/CertificatesReady';
import AssignmentBoard from '@/components/dispatch/AssignmentBoard';
import LiveDeliveries from '@/components/dispatch/LiveDeliveries';
import DeliveryHistory from '@/components/dispatch/DeliveryHistory';
import DispatchTeam from '@/components/dispatch/DispatchTeam';
import ExpenseSubmission from '@/components/expenses/ExpenseSubmission';
import ExpenseApprovals from '@/components/expenses/ExpenseApprovals';
import { toast } from 'sonner';

const DispatchHeadDashboard = () => {
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
      if (!['Dispatch Head', 'COO', 'MD', 'CEO'].includes(parsedUser.role)) {
        toast.error('Access denied. Dispatch Head access required.');
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
      id: 'certificates',
      title: 'Certificates Ready',
      description: 'Assign certificates for delivery',
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400'
    },
    {
      id: 'assignments',
      title: 'Assignment Board',
      description: 'Manage task assignments',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400'
    },
    {
      id: 'live',
      title: 'Live Deliveries',
      description: 'Track ongoing deliveries',
      icon: Truck,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      iconColor: 'text-yellow-400'
    },
    {
      id: 'history',
      title: 'History & Proofs',
      description: 'View completed deliveries',
      icon: FileCheck,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-400'
    },
    {
      id: 'team',
      title: 'Dispatch Team',
      description: 'Monitor team attendance',
      icon: UserCheck,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-500/10',
      iconColor: 'text-indigo-400'
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
            <h1 className="text-2xl font-bold text-gray-900">Dispatch Head Dashboard</h1>
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
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
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
          <p className="text-gray-700">
            Manage certificate deliveries, assign tasks to assistants, and track delivery status.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="certificates"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Package className="w-4 h-4 mr-2" />
              Ready
            </TabsTrigger>
            <TabsTrigger 
              value="assignments"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Assignments
            </TabsTrigger>
            <TabsTrigger 
              value="live"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Truck className="w-4 h-4 mr-2" />
              Live
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger 
              value="team"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger 
              value="my-expenses"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Receipt className="w-4 h-4 mr-2" />
              My Expenses
            </TabsTrigger>
            <TabsTrigger 
              value="expense-approvals"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-white text-gray-300"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Approve Expenses
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Card
                      key={module.id}
                      onClick={() => handleModuleClick(module.id)}
                      className="group relative overflow-hidden cursor-pointer border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                      style={{ minHeight: '140px' }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      
                      <div className="p-5 relative z-10">
                        <div className={`${module.bgColor} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                          <Icon className={`w-5 h-5 ${module.iconColor}`} />
                        </div>
                        
                        <h3 className="text-base font-bold text-white mb-1">{module.title}</h3>
                        <p className="text-sm text-gray-400">{module.description}</p>
                      </div>

                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${module.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="certificates" className="mt-0">
              <CertificatesReady />
            </TabsContent>

            <TabsContent value="assignments" className="mt-0">
              <AssignmentBoard />
            </TabsContent>

            <TabsContent value="live" className="mt-0">
              <LiveDeliveries />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <DeliveryHistory />
            </TabsContent>

            <TabsContent value="team" className="mt-0">
              <DispatchTeam />
            </TabsContent>

            <TabsContent value="my-expenses" className="mt-0">
              <ExpenseSubmission />
            </TabsContent>

            <TabsContent value="expense-approvals" className="mt-0">
              <ExpenseApprovals userRole="Dispatch Head" />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default DispatchHeadDashboard;
