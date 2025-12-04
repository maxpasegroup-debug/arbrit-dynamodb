import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExpenseAccountsPayment = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  const fetchPendingClaims = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expenses/accounts-review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaims(response.data);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedClaim || !paymentReference) {
      toast.error('Please enter payment reference');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/expenses/accounts-review/${selectedClaim.id}/pay`,
        { paid: true, payment_reference: paymentReference },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Expense marked as paid successfully');
      setDialogOpen(false);
      setSelectedClaim(null);
      setPaymentReference('');
      fetchPendingClaims();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error(error.response?.data?.detail || 'Failed to mark as paid');
    }
  };

  const openPaymentDialog = (claim) => {
    setSelectedClaim(claim);
    setPaymentReference('');
    setDialogOpen(true);
  };

  const pendingClaims = claims.filter(c => c.status === 'PENDING_ACCOUNTS');
  const paidClaims = claims.filter(c => c.status === 'PAID');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Wallet className="w-7 h-7" />
            Expense Payments
          </h2>
          <p className="text-gray-400">Review and process approved expense claims</p>
        </div>
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-base px-4 py-2">
          {pendingClaims.length} Pending Payment
        </Badge>
      </div>

      {/* Pending Payments */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <h3 className="text-lg font-semibold text-white">Pending Payments</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-center py-8 text-gray-400">Loading...</p>
          ) : pendingClaims.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-50" />
              <p className="text-gray-400 text-lg">No pending payments</p>
              <p className="text-gray-500 text-sm mt-2">All expense claims have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingClaims.map((claim) => (
                <div key={claim.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:bg-white transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-white text-lg">{claim.employee_name}</h3>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          Pending Payment
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Category:</span>
                          <span className="text-white ml-2 font-medium">{claim.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-green-400 ml-2 font-semibold">AED {claim.amount?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Department:</span>
                          <span className="text-white ml-2">{claim.department}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Mobile:</span>
                          <span className="text-white ml-2">{claim.mobile}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                        <p className="text-sm text-gray-400">Description:</p>
                        <p className="text-white mt-1">{claim.description}</p>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        onClick={() => openPaymentDialog(claim)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Mark as Paid
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recently Paid Claims */}
      {paidClaims.length > 0 && (
        <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <h3 className="text-lg font-semibold text-white">Recently Paid</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {paidClaims.slice(0, 5).map((claim) => (
                <div key={claim.id} className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{claim.employee_name}</h3>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-green-400 ml-2 font-semibold">AED {claim.amount?.toFixed(2)}</span>
                          <span className="text-gray-400 ml-3">Category:</span>
                          <span className="text-white ml-2">{claim.category}</span>
                        </div>
                        <div className="text-gray-400">
                          Reference: <span className="text-white">{claim.payment_reference}</span>
                          <span className="ml-3">Paid:</span>
                          <span className="text-white ml-1">{claim.paid_at ? new Date(claim.paid_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Mark Expense as Paid</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedClaim && (
                <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                  <p className="font-semibold text-white text-lg">
                    {selectedClaim.employee_name}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-green-400 ml-2 font-semibold">AED {selectedClaim.amount?.toFixed(2)}</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white ml-2">{selectedClaim.category}</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Description:</span>
                      <span className="text-white ml-2">{selectedClaim.description}</span>
                    </p>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="payment_ref" className="text-white">Payment Reference *</Label>
              <Input
                id="payment_ref"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID, Cheque number, etc."
                className="bg-gray-50 border-slate-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-slate-600 text-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={!paymentReference}
              className="bg-green-500 hover:bg-green-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseAccountsPayment;