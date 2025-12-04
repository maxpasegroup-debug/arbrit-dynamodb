import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, Eye, Clock, Receipt, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExpenseApprovalManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expenses/for-approval`, {
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

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setViewDialogOpen(true);
  };

  const handleOpenActionDialog = (expense, action) => {
    setSelectedExpense(expense);
    setActionType(action);
    setRemarks('');
    setActionDialogOpen(true);
  };

  const handleApproveReject = async () => {
    if (!selectedExpense) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/expenses/for-approval/${selectedExpense.id}`,
        { 
          decision: actionType,
          remarks 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Expense claim ${actionType}d successfully`);
      setActionDialogOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error(`Error ${actionType}ing expense:`, error);
      toast.error(`Failed to ${actionType} expense claim`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING_DEPT_HEAD': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock, label: 'Pending' },
      'PENDING_HR': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock, label: 'Pending HR' },
      'PENDING_ACCOUNTS': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Clock, label: 'Pending Accounts' },
      'REJECTED': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Rejected' },
      'PAID': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle, label: 'Paid' }
    };

    const config = statusConfig[status] || statusConfig['PENDING_DEPT_HEAD'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Travel': 'text-blue-400',
      'Food': 'text-green-400',
      'Accommodation': 'text-purple-400',
      'Stationery': 'text-yellow-400',
      'Others': 'text-gray-400'
    };
    return colors[category] || colors['Others'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading expense claims...</div>
      </div>
    );
  }

  const pendingExpenses = expenses.filter(e => e.status === 'PENDING_DEPT_HEAD');
  const processedExpenses = expenses.filter(e => e.status !== 'PENDING_DEPT_HEAD');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Expense Approval Management</h2>
        <p className="text-gray-300">Review and approve expense claims from your team</p>
      </div>

      {/* Pending Expense Claims */}
      <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending Approvals ({pendingExpenses.length})
        </h3>

        {pendingExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pending expense claims to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingExpenses.map((expense) => (
              <div 
                key={expense.id}
                className="bg-gradient-to-r from-emerald-500/5 to-green-500/5 border border-emerald-500/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{expense.employee_name}</h4>
                      {getStatusBadge(expense.status)}
                      <Badge className={`${getCategoryColor(expense.category)} bg-white border-gray-200`}>
                        {expense.category}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <DollarSign className="w-4 h-4" />
                        <span>Amount: {expense.currency} {Number(expense.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Receipt className="w-4 h-4" />
                        <span>Date: {expense.expense_date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <FileText className="w-4 h-4" />
                        <span>Dept: {expense.department}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2">
                      {expense.description}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(expense)}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenActionDialog(expense, 'approve')}
                      className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenActionDialog(expense, 'reject')}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Expense Claims */}
      {processedExpenses.length > 0 && (
        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recently Processed</h3>
          <div className="space-y-3">
            {processedExpenses.slice(0, 5).map((expense) => (
              <div 
                key={expense.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium">{expense.employee_name}</p>
                  <p className="text-sm text-gray-400">
                    {expense.category} - {expense.currency} {Number(expense.amount).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(expense.status)}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(expense)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-gray-200 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Expense Claim Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Employee</p>
                  <p className="text-white font-medium">{selectedExpense.employee_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Department</p>
                  <p className="text-white font-medium">{selectedExpense.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="text-white font-medium">
                    {selectedExpense.currency} {Number(selectedExpense.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Category</p>
                  <p className="text-white font-medium">{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Expense Date</p>
                  <p className="text-white font-medium">{selectedExpense.expense_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedExpense.status)}</div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Description</p>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-white whitespace-pre-wrap">{selectedExpense.description}</p>
                </div>
              </div>

              {selectedExpense.dept_head_remarks && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Manager Remarks</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-white">{selectedExpense.dept_head_remarks}</p>
                  </div>
                </div>
              )}

              {selectedExpense.attachment_url && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Receipt/Bill</p>
                  <a 
                    href={selectedExpense.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-gray-200 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {actionType === 'approve' ? 'Approve Expense Claim' : 'Reject Expense Claim'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === 'approve' 
                ? 'Approved expenses will be sent to HR for final review'
                : 'Please provide a reason for rejection'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedExpense && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-400">Employee</p>
                <p className="text-white font-medium">{selectedExpense.employee_name}</p>
                <p className="text-sm text-gray-400 mt-2">Amount</p>
                <p className="text-white font-medium">
                  {selectedExpense.currency} {Number(selectedExpense.amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 mt-2">Category</p>
                <p className="text-white font-medium">{selectedExpense.category}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Remarks {actionType === 'reject' && <span className="text-red-400">*</span>}
              </label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={actionType === 'approve' ? 'Add any notes...' : 'Reason for rejection...'}
                className="bg-white border-gray-200 text-white"
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                disabled={processing}
                className="border-gray-300 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveReject}
                disabled={processing || (actionType === 'reject' && !remarks.trim())}
                className={actionType === 'approve' 
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                }
              >
                {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve & Send to HR' : 'Reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseApprovalManagement;