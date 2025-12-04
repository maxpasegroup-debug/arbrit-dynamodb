import { useState, useEffect } from 'react';
import { Receipt, Plus, CheckCircle, XCircle, Clock, Eye, Send, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ExpenseSubmission from '@/components/expenses/ExpenseSubmission';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ExpenseManagement = () => {
  const [activeView, setActiveView] = useState('team_expenses');
  const [teamExpenses, setTeamExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);

  const [stats, setStats] = useState({
    pendingReview: 0,
    approvedThisMonth: 0,
    totalAmount: 0,
    myPendingExpenses: 0
  });

  useEffect(() => {
    fetchTeamExpenses();
    fetchStats();
  }, []);

  const fetchTeamExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/sales-head/team-expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamExpenses(response.data || []);
    } catch (error) {
      console.error('Error fetching team expenses:', error);
      // Show empty state if API fails
      setTeamExpenses([]);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/sales-head/expense-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Show zero stats if API fails
      setStats({
        pendingReview: 0,
        approvedThisMonth: 0,
        totalAmount: 0,
        myPendingExpenses: 0
      });
    }
  };

  const handleReviewExpense = async () => {
    if (!selectedExpense || !reviewAction) {
      toast.error('Please select an action');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/sales-head/review-expense`, {
        expenseId: selectedExpense.id,
        action: reviewAction, // 'approve', 'reject'
        comments: reviewComments,
        forwardToAccounts: reviewAction === 'approve'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let message = reviewAction === 'approve' 
        ? 'Expense approved and forwarded to Accounts' 
        : 'Expense rejected';

      toast.success(message);
      setReviewDialogOpen(false);
      setSelectedExpense(null);
      setReviewAction('');
      setReviewComments('');
      fetchTeamExpenses();
      fetchStats();
    } catch (error) {
      console.error('Error reviewing expense:', error);
      toast.error('Failed to process expense review');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'forwarded': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'forwarded': return <Send className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Travel': return 'bg-blue-500/20 text-blue-400';
      case 'Food': return 'bg-green-500/20 text-green-400';
      case 'Communication': return 'bg-purple-500/20 text-purple-400';
      case 'Accommodation': return 'bg-orange-500/20 text-orange-400';
      case 'Office Supplies': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Expense Management Center
          </h3>
          <p className="text-slate-400">
            Review team expenses and manage your own expense claims
          </p>
        </div>
        <Button
          onClick={() => setCreateExpenseOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit Expense
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-orange-500/10 border-orange-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-orange-400" />
              <div>
                <p className="text-orange-400 font-semibold">Pending Review</p>
                <p className="text-xl font-bold text-orange-300">{stats.pendingReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Approved This Month</p>
                <p className="text-xl font-bold text-green-300">{stats.approvedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-blue-400 font-semibold">Total Amount</p>
                <p className="text-xl font-bold text-blue-300">{stats.totalAmount.toLocaleString()} AED</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-purple-400 font-semibold">My Pending</p>
                <p className="text-xl font-bold text-purple-300">{stats.myPendingExpenses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveView('team_expenses')}
          variant={activeView === 'team_expenses' ? 'default' : 'outline'}
          className={activeView === 'team_expenses' ? 'bg-blue-600' : 'border-white/20'}
        >
          Team Expenses ({teamExpenses.filter(e => e.status === 'pending').length})
        </Button>
        <Button
          onClick={() => setActiveView('my_expenses')}
          variant={activeView === 'my_expenses' ? 'default' : 'outline'}
          className={activeView === 'my_expenses' ? 'bg-blue-600' : 'border-white/20'}
        >
          My Expenses
        </Button>
      </div>

      {/* Team Expenses */}
      {activeView === 'team_expenses' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Team Expense Claims for Review</h4>
          {teamExpenses.map((expense) => (
            <Card key={expense.id} className="bg-white/50 border-gray-300">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h5 className="text-white font-semibold">{expense.employeeName}</h5>
                      <p className="text-slate-400">{expense.employeeRole}</p>
                    </div>
                    <Badge className={getCategoryColor(expense.category)}>
                      {expense.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{expense.amount} AED</p>
                    <Badge className={getStatusColor(expense.status)}>
                      {getStatusIcon(expense.status)}
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">Expense Date</p>
                    <p className="text-white">{expense.expenseDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Submitted On</p>
                    <p className="text-white">{expense.submittedDate}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-slate-400 text-sm">Description</p>
                  <p className="text-white bg-gray-50/50 p-2 rounded">{expense.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expense.receiptUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20"
                        onClick={() => window.open(expense.receiptUrl, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Receipt
                      </Button>
                    )}
                  </div>

                  {expense.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setReviewAction('approve');
                          setReviewDialogOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve & Forward
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setReviewAction('reject');
                          setReviewDialogOpen(true);
                        }}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                {expense.status !== 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-300 text-sm text-slate-400">
                    {expense.status === 'approved' && (
                      <>
                        <p>✅ Approved by {expense.reviewedBy} on {expense.reviewDate}</p>
                        {expense.forwardedToAccounts && (
                          <p className="text-green-400">📤 Forwarded to Accounts for payment processing</p>
                        )}
                      </>
                    )}
                    {expense.status === 'rejected' && (
                      <p>❌ Rejected by {expense.reviewedBy} on {expense.reviewDate}</p>
                    )}
                    {expense.reviewComments && (
                      <p className="mt-1 text-gray-700">Comments: {expense.reviewComments}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {teamExpenses.filter(e => e.status === 'pending').length === 0 && (
            <Card className="bg-green-500/10 border-green-400/30">
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-green-300 text-lg font-semibold mb-2">
                  All Caught Up!
                </h3>
                <p className="text-green-400">
                  No pending expense claims to review.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* My Expenses */}
      {activeView === 'my_expenses' && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">My Expense Claims</h4>
          <ExpenseSubmission />
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-white">
              {reviewAction === 'approve' && 'Approve & Forward Expense'}
              {reviewAction === 'reject' && 'Reject Expense Claim'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedExpense && (
              <div className="bg-gray-50/50 p-3 rounded-lg">
                <p className="text-white font-medium">{selectedExpense.employeeName}</p>
                <p className="text-slate-400">{selectedExpense.category} - {selectedExpense.amount} AED</p>
                <p className="text-gray-700 text-sm">{selectedExpense.description}</p>
              </div>
            )}

            <div>
              <Label className="text-gray-700">Review Comments</Label>
              <Textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder={
                  reviewAction === 'approve' 
                    ? "Optional: Add approval notes..." 
                    : "Please provide reason for rejection..."
                }
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>

            {reviewAction === 'approve' && (
              <div className="bg-blue-500/10 border border-blue-400/30 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400">
                  <Send className="w-4 h-4" />
                  <span className="font-medium">Auto-Forward to Accounts</span>
                </div>
                <p className="text-blue-300 text-sm mt-1">
                  Upon approval, this expense will be automatically forwarded to the Accounts department for payment processing.
                </p>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReviewExpense}
                className={
                  reviewAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {reviewAction === 'approve' && '✓ Approve & Forward'}
                {reviewAction === 'reject' && '✗ Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Expense Modal */}
      <Dialog open={createExpenseOpen} onOpenChange={setCreateExpenseOpen}>
        <DialogContent className="max-w-2xl bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-white">Submit Personal Expense Claim</DialogTitle>
          </DialogHeader>
          
          <div className="bg-blue-500/10 border border-blue-400/30 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-blue-400">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Sales Head Expense Process</span>
            </div>
            <p className="text-blue-300 text-sm mt-1">
              Your expense claims will be sent directly to the Accounts department for review and approval.
            </p>
          </div>

          <ExpenseSubmission />
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setCreateExpenseOpen(false)}
              className="border-white/20"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseManagement;