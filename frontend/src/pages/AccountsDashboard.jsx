import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, DollarSign, Wallet, FileText, TrendingUp, Users, Truck, Receipt, FileX, RefreshCw, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FinancialDashboard from '@/components/accounts/FinancialDashboard';
import InvoiceManagementEnhanced from '@/components/accounts/InvoiceManagementEnhanced';
import PaymentManagement from '@/components/accounts/PaymentManagement';
import VATReports from '@/components/accounts/VATReports';
import ClientManagement from '@/components/accounts/ClientManagement';
import VendorManagement from '@/components/accounts/VendorManagement';
import PettyCashTracker from '@/components/accounts/PettyCashTracker';
import CreditNoteManager from '@/components/accounts/CreditNoteManager';
import RecurringInvoiceSetup from '@/components/accounts/RecurringInvoiceSetup';
import AuditLogViewer from '@/components/accounts/AuditLogViewer';
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
        <p className="text-gray-900">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-white/5  border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Accounts Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Complete Financial Management System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
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

      <main className="max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white border border-gray-300 flex-wrap h-auto">
            <TabsTrigger value="dashboard">
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="w-4 h-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="vat">
              <Receipt className="w-4 h-4 mr-2" />
              VAT Reports
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Users className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="vendors">
              <Truck className="w-4 h-4 mr-2" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="petty-cash">
              <Wallet className="w-4 h-4 mr-2" />
              Petty Cash
            </TabsTrigger>
            <TabsTrigger value="credit-notes">
              <FileX className="w-4 h-4 mr-2" />
              Credit Notes
            </TabsTrigger>
            <TabsTrigger value="recurring">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recurring
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <Wallet className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="w-4 h-4 mr-2" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <FinancialDashboard />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoiceManagementEnhanced />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentManagement />
          </TabsContent>

          <TabsContent value="vat">
            <VATReports />
          </TabsContent>

          <TabsContent value="clients">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorManagement />
          </TabsContent>

          <TabsContent value="petty-cash">
            <PettyCashTracker />
          </TabsContent>

          <TabsContent value="credit-notes">
            <CreditNoteManager />
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringInvoiceSetup />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseAccountsPayment />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogViewer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AccountsDashboard;