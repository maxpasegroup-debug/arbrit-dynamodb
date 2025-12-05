import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Building2, Package, FileText, Plus, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import PaymentRecording from './PaymentRecording';
import ClientAccounts from './ClientAccounts';
import VendorManagement from './VendorManagement';
import ExpenseApprovals from './ExpenseApprovals';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    expenseClaims: 0,
    activeClients: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAccountingStats();
  }, []);

  const fetchAccountingStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch payments
      const paymentsRes = await axios.get(`${API}/accounts/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch expense claims
      const expensesRes = await axios.get(`${API}/expenses/accounts-review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const payments = paymentsRes.data || [];
      const expenses = expensesRes.data || [];
      
      // Calculate stats
      const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      
      setStats({
        totalRevenue: totalRevenue.toFixed(2),
        pendingPayments,
        expenseClaims: expenses.length,
        activeClients: new Set(payments.map(p => p.client_id)).size
      });
      
    } catch (error) {
      console.error('Error fetching accounting stats:', error);
      toast.error('Failed to load accounting statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">Loading accounting data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              Accounting & Finance Dashboard
            </h2>
            <p className="text-emerald-100 mt-1">Manage payments, expenses, and financial records</p>
          </div>
          <Button 
            onClick={fetchAccountingStats}
            className="bg-slate-900 text-emerald-600 hover:bg-emerald-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <p className="text-sm text-emerald-100">Total Revenue</p>
            </div>
            <p className="text-3xl font-bold">AED {stats.totalRevenue}</p>
          </div>
          <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5" />
              <p className="text-sm text-yellow-100">Pending Payments</p>
            </div>
            <p className="text-3xl font-bold text-yellow-200">{stats.pendingPayments}</p>
          </div>
          <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5" />
              <p className="text-sm text-orange-100">Expense Claims</p>
            </div>
            <p className="text-3xl font-bold text-orange-200">{stats.expenseClaims}</p>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" />
              <p className="text-sm text-blue-100">Active Clients</p>
            </div>
            <p className="text-3xl font-bold text-blue-200">{stats.activeClients}</p>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-900 border border-white/10">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white text-gray-300"
          >
            <FileText className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="payments"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white text-gray-300"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger 
            value="clients"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white text-gray-300"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Clients
          </TabsTrigger>
          <TabsTrigger 
            value="vendors"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white text-gray-300"
          >
            <Package className="w-4 h-4 mr-2" />
            Vendors
          </TabsTrigger>
          <TabsTrigger 
            value="expenses"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white text-gray-300"
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Expenses
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm">
                    View recent payments, invoices, and financial transactions
                  </p>
                  <Button className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700">
                    View All Activity
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActiveTab('payments')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => setActiveTab('expenses')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Review Expenses
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <PaymentRecording onSuccess={fetchAccountingStats} />
          </TabsContent>

          <TabsContent value="clients" className="mt-0">
            <ClientAccounts />
          </TabsContent>

          <TabsContent value="vendors" className="mt-0">
            <VendorManagement />
          </TabsContent>

          <TabsContent value="expenses" className="mt-0">
            <ExpenseApprovals onApproval={fetchAccountingStats} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AccountingDashboard;
