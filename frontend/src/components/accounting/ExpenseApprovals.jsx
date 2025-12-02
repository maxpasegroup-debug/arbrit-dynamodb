import { useState, useEffect } from 'react';
import { TrendingDown, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExpenseApprovals = ({ onApproval }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expenses/accounts-review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expense claims');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (claimId, approved) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/expenses/accounts-review/${claimId}`,
        { status: approved ? 'approved' : 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Expense ${approved ? 'approved' : 'rejected'} successfully!`);
      fetchExpenses();
      if (onApproval) onApproval();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense claim');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Expense Approvals</h3>
        <p className="text-slate-400 text-sm mt-1">Review and approve employee expense claims</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-12 text-slate-400">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
            <TrendingDown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No pending expense claims</p>
          </div>
        ) : (
          expenses.map((expense, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-white">{expense.employee_name}</h4>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/50">
                      {expense.category || 'Expense'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
                    <div>
                      <span className="text-slate-400">Amount:</span> AED {expense.amount}
                    </div>
                    <div>
                      <span className="text-slate-400">Date:</span> {expense.date}
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span> {expense.status}
                    </div>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-slate-400 mt-2">{expense.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproval(expense.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproval(expense.id, false)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpenseApprovals;