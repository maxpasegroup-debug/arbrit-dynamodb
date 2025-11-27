import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const ExpenseHRReview = () => {
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
      const response = await axios.get(`${API}/expenses/hr-review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaims(response.data);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async () => {
    if (!selectedClaim || !decision) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/expenses/hr-review/${selectedClaim.id}`,
        { decision, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Expense ${decision}d by HR successfully`);
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
        <h2 className="text-2xl font-bold text-slate-100">HR Expense Authorisation</h2>
        <Badge variant="outline" className="text-base border-white/20">
          {claims.length} pending
        </Badge>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Pending HR Review</h3>
        {loading ? (
          <p className="text-center py-8 text-slate-400">Loading...</p>
        ) : claims.length === 0 ? (
          <p className="text-center py-8 text-slate-400">No pending expense claims for HR review</p>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-100">{claim.employee_name}</h3>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">{claim.department}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div>
                        <span className="font-medium">Category:</span> {claim.category}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> AED {claim.amount?.toFixed(2) || '0.00'}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(claim.expense_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Branch:</span> {claim.branch}
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-300 mt-2">
                      <span className="font-medium">Description:</span> {claim.description}
                    </p>
                    
                    {claim.dept_head_remarks && (
                      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-400/30 rounded">
                        <p className="text-xs text-slate-300">
                          <strong>Dept Head:</strong> {claim.dept_head_remarks}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => openApprovalDialog(claim, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openApprovalDialog(claim, 'reject')}
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

      {/* Approval Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              HR {decision === 'approve' ? 'Approval' : 'Rejection'}
            </DialogTitle>
            <DialogDescription>
              {selectedClaim && (
                <>
                  <p className="font-medium text-slate-200 mt-2">
                    {selectedClaim.employee_name} - AED {selectedClaim.amount?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-slate-400">{selectedClaim.category}</p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300">HR Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2 mt-1 min-h-[80px]"
                placeholder="Add any notes or comments..."
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-white/20 hover:bg-white/10">
                Cancel
              </Button>
              <Button
                onClick={handleApproveReject}
                className={`flex-1 ${decision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
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

export default ExpenseHRReview;