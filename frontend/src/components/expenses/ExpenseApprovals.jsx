import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExpenseApprovals = ({ userRole }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [decision, setDecision] = useState('');

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  const fetchPendingClaims = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expenses/for-approval`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaims(response.data);
    } catch (error) {
      console.error('Error fetching claims:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async () => {
    if (!selectedClaim || !decision) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/expenses/for-approval/${selectedClaim.id}`,
        { decision, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Expense ${decision}d successfully`);
      setDialogOpen(false);
      setSelectedClaim(null);
      setRemarks('');
      setDecision('');
      fetchPendingClaims();
    } catch (error) {
      console.error('Error updating claim:', error);
      toast.error(error.response?.data?.detail || 'Failed to update expense');
    }
  };

  const openApprovalDialog = (claim, dec) => {
    setSelectedClaim(claim);
    setDecision(dec);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Expense Approvals</h2>
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-base px-4 py-2">
          {claims.length} pending
        </Badge>
      </div>

      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Pending Expense Claims</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-center py-8 text-gray-400">Loading...</p>
          ) : claims.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-50" />
              <p className="text-gray-400 text-lg">No pending expense claims</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="bg-slate-900 border border-white/10 rounded-lg p-5 hover:bg-white transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-white text-lg">{claim.employee_name}</h3>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{claim.department}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Category:</span>
                          <span className="text-white ml-2 font-medium">{claim.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-green-400 ml-2 font-semibold">AED {claim.amount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Date:</span>
                          <span className="text-white ml-2">{new Date(claim.expense_date).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Branch:</span>
                          <span className="text-white ml-2">{claim.branch}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-slate-900 rounded border border-white/10">
                        <p className="text-sm text-gray-400">Description:</p>
                        <p className="text-white mt-1">{claim.description}</p>
                      </div>
                      
                      {claim.attachment_url && (
                        <p className="text-sm text-blue-400 mt-2 hover:text-blue-300">
                          <a href={claim.attachment_url} target="_blank" rel="noopener noreferrer">
                            📎 View Attachment
                          </a>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => openApprovalDialog(claim, 'approve')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openApprovalDialog(claim, 'reject')}
                        className="bg-red-500 hover:bg-red-600"
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
      </div>

      {/* Approval Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {decision === 'approve' ? 'Approve' : 'Reject'} Expense Claim
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedClaim && (
                <div className="mt-3 p-4 bg-slate-900 rounded-lg border border-white/10">
                  <p className="font-semibold text-white text-lg">
                    {selectedClaim.employee_name} - AED {selectedClaim.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{selectedClaim.category}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white">Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-md p-3 mt-2 min-h-[80px] text-white placeholder:text-gray-500"
                placeholder="Add any notes or comments..."
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)} 
                className="flex-1 border-slate-600 text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveReject}
                className={`flex-1 ${decision === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                Confirm {decision === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseApprovals;