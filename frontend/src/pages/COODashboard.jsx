import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, TrendingUp, GraduationCap, DollarSign, ArrowRight, Receipt, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpenseReadOnlyView from '@/components/expenses/ExpenseReadOnlyView';
import LeadManagementEnhanced from '@/components/sales/LeadManagementEnhanced';
import LeadSubmissionModal from '@/components/coo/LeadSubmissionModal';
import ExpenseSubmissionModal from '@/components/coo/ExpenseSubmissionModal';
import { toast } from 'sonner';

const COODashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (!['COO', 'Management', 'MD', 'CEO'].includes(parsedUser.role)) {
        toast.error('Access denied. Executive access only.');
        navigate('/login');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user:', error);
      toast.error('Session expired. Please login again.');
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigationModules = [
    {
      title: 'Marketing & Sales',
      description: 'Manage leads, quotations, and sales performance',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      path: '/dashboard/sales-head',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400'
    },
    {
      title: 'Human Resources',
      description: 'Employee management, attendance, and documents',
      icon: Users,
      color: 'from-blue-500 to-cyan-600',
      path: '/dashboard/hr',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Academics',
      description: 'Training programs, work orders, and certifications',
      icon: GraduationCap,
      color: 'from-yellow-500 to-amber-600',
      path: '/dashboard/academic',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400'
    },
    {
      title: 'Accounts',
      description: 'Invoices, payments, and financial management',
      icon: DollarSign,
      color: 'from-purple-500 to-pink-600',
      path: '/dashboard/accounts',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user?.role === 'MD' || user?.role === 'CEO' ? 'CEO Command Panel' : 'COO Dashboard'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">Executive Operations Control Center</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="leads">
              <FileText className="w-4 h-4 mr-2" />
              Lead Management
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <Receipt className="w-4 h-4 mr-2" />
              Expense Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules">
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <button
                onClick={() => setLeadModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Submit New Lead
              </button>
              <button
                onClick={() => setExpenseModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
              >
                <DollarSign className="w-5 h-5" /> Submit Expense
              </button>
            </div>

            {/* Welcome Section */}
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-bold text-white mb-3">
                Welcome, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="text-lg text-slate-300">
                Navigate to your operational modules
              </p>
            </div>

            {/* Navigation Grid - 2x2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {navigationModules.map((module, index) => {
            const IconComponent = module.icon;
            return (
              <Card
                key={index}
                onClick={() => navigate(module.path)}
                className="group relative bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative p-8">
                  {/* Icon */}
                  <div className={`${module.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`w-8 h-8 ${module.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-white/90">
                      {module.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">
                      {module.description}
                    </p>

                    {/* Arrow */}
                    <div className="flex items-center text-slate-300 group-hover:text-white transition-colors">
                      <span className="text-sm font-medium mr-2">Open Module</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="leads">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <LeadManagementEnhanced />
        </div>
      </TabsContent>

      <TabsContent value="expenses">
        <ExpenseReadOnlyView />
      </TabsContent>
    </Tabs>
      </main>

      {/* Modals */}
      <LeadSubmissionModal open={leadModalOpen} onOpenChange={setLeadModalOpen} />
      <ExpenseSubmissionModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
    </div>
  );
};

export default COODashboard;
