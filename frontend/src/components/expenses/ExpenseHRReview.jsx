import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
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
      toast.error('Failed to load expense claims');
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
        <h2 className="text-2xl font-bold text-slate-900">HR Expense Authorisation</h2>
        <Badge variant="outline" className="text-base">
          {claims.length} pending
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending HR Review</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-slate-600">Loading...</p>
          ) : claims.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No pending expense claims for HR review</p>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <div key={claim.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{claim.employee_name}</h3>
                        <Badge className="bg-slate-200 text-slate-700">{claim.department}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Category:</span> {claim.category}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span> AED {claim.amount.toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(claim.expense_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Branch:</span> {claim.branch}
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mt-2">
                        <span className="font-medium">Description:</span> {claim.description}
                      </p>
                      
                      {claim.dept_head_remarks && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs text-slate-600">
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
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              HR {decision === 'approve' ? 'Approval' : 'Rejection'}
            </DialogTitle>
            <DialogDescription>
              {selectedClaim && (
                <>
                  <p className="font-medium text-slate-900 mt-2">
                    {selectedClaim.employee_name} - AED {selectedClaim.amount.toFixed(2)}
                  </p>
                  <p className="text-sm">{selectedClaim.category}</p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">HR Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 mt-1 min-h-[80px]"
                placeholder="Add any notes or comments..."
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
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