import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, AlertCircle, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinancialDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/financial-dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading financial data...</div>;
  }

  if (!dashboardData) {
    return <div className="text-white">No data available</div>;
  }

  const { summary, invoice_stats } = dashboardData;
  const profitMargin = summary.total_revenue > 0 
    ? ((summary.profit / summary.total_revenue) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Financial Overview</h2>
        <p className="text-gray-400">Real-time financial performance metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-900/20 to-slate-900/40 border-green-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-300">Total Revenue</CardTitle>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              AED {summary.total_revenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 mt-2">{invoice_stats.paid_count} paid invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/20 to-slate-900/40 border-red-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-300">Total Expenses</CardTitle>
              <DollarSign className="w-5 h-5 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">
              AED {summary.total_expenses.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 mt-2">All expense categories</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border-blue-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-300">Net Profit</CardTitle>
              <PieChart className="w-5 h-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              AED {summary.profit.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 mt-2">{profitMargin}% margin</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/20 to-slate-900/40 border-yellow-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-300">Outstanding</CardTitle>
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">
              AED {summary.outstanding_receivables.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 mt-2">{invoice_stats.pending_count} pending invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Invoice Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Invoices:</span>
              <span className="text-white font-semibold">{invoice_stats.total_invoices}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Paid:</span>
              <span className="text-green-400 font-semibold">{invoice_stats.paid_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending:</span>
              <span className="text-yellow-400 font-semibold">{invoice_stats.pending_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Collection Rate:</span>
              <span className="text-white font-semibold">
                {invoice_stats.total_invoices > 0 
                  ? ((invoice_stats.paid_count / invoice_stats.total_invoices) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">VAT Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">VAT Rate:</span>
              <span className="text-white font-semibold">5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total VAT Collected:</span>
              <span className="text-white font-semibold">AED {summary.vat_collected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sales (excl. VAT):</span>
              <span className="text-white font-semibold">
                AED {(summary.total_revenue - summary.vat_collected).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialDashboard;