import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, DollarSign, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvoiceManagementEnhanced from '@/components/accounts/InvoiceManagementEnhanced';
import ExpenseAccountsPayment from '@/components/expenses/ExpenseAccountsPayment';
import { toast } from 'sonner';

const AccountsDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (!['Accounts Head', 'Accountant', 'COO', 'MD', 'CEO'].includes(parsedUser.role)) {
        toast.error('Access denied. Accounts team access only.');
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
            <h1 className="text-3xl font-bold text-white">Accounts Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Financial Management & Billing</p>
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

      <main className="max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="invoices">
              <DollarSign className="w-4 h-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <Wallet className="w-4 h-4 mr-2" />
              Expense Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <InvoiceManagementEnhanced />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseAccountsPayment />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AccountsDashboard;
