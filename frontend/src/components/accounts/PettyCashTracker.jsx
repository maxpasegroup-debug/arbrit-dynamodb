import { useEffect, useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PettyCashTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Office Supplies',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_number: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/petty-cash`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching petty cash:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      amount: '',
      category: 'Office Supplies',
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
      receipt_number: ''
    });
    setShowDialog(true);
  };

  const submitExpense = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/accounts/petty-cash`,
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Petty cash expense recorded');
      setShowDialog(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error recording expense:', error);
      toast.error('Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const thisMonth = expenses.filter(exp => {
    const expDate = new Date(exp.expense_date);
    const now = new Date();
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Petty Cash Tracker</h2>
          <p className="text-gray-400">Track small cash expenses and miscellaneous costs</p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border-blue-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-400">Total Expenses</p>
            <p className="text-3xl font-bold text-white mt-2">AED {totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/20 to-slate-900/40 border-green-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-400">This Month</p>
            <p className="text-3xl font-bold text-green-400 mt-2">AED {monthTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900/40 border-purple-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-400">Total Transactions</p>
            <p className="text-3xl font-bold text-white mt-2">{expenses.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-300">Date</TableHead>
              <TableHead className="text-gray-300">Category</TableHead>
              <TableHead className="text-gray-300">Description</TableHead>
              <TableHead className="text-gray-300">Amount</TableHead>
              <TableHead className="text-gray-300">Receipt #</TableHead>
              <TableHead className="text-gray-300">Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  No petty cash expenses recorded yet
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="border-white/10">
                  <TableCell className="text-white">
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-white">{expense.category}</TableCell>
                  <TableCell className="text-gray-300">{expense.description}</TableCell>
                  <TableCell className="text-red-400 font-semibold">AED {expense.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-300">{expense.receipt_number || '-'}</TableCell>
                  <TableCell className="text-gray-300">{expense.recorded_by_name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-slate-700 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-400" />
              Record Petty Cash Expense
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (AED) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Meals">Meals</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Misc">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="What was this expense for?"
              />
            </div>

            <div className="space-y-2">
              <Label>Receipt Number</Label>
              <Input
                value={formData.receipt_number}
                onChange={(e) => setFormData({...formData, receipt_number: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Optional receipt reference"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-slate-600 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={submitExpense} disabled={loading || !formData.amount || !formData.description} className="bg-blue-500 hover:bg-blue-600">
              {loading ? 'Recording...' : 'Record Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PettyCashTracker;