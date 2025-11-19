import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
      toast.error('Failed to load expense claims');
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
    setDialogOpen(true);
  };

  const pendingClaims = claims.filter(c => c.status === 'PENDING_ACCOUNTS');
  const paidClaims = claims.filter(c => c.status === 'PAID');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Expense Payments</h2>
        <Badge variant="outline" className="text-base">
          {pendingClaims.length} pending payment
        </Badge>
      </div>

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-slate-600">Loading...</p>
          ) : pendingClaims.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No pending payments</p>
          ) : (
            <div className="space-y-3">
              {pendingClaims.map((claim) => (
                <div key={claim.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{claim.employee_name}</h3>
                        <Badge className="bg-purple-500/20 text-purple-600 border-purple-400/50">
                          Pending Payment
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Category:</span> {claim.category}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span> AED {claim.amount.toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {claim.department}
                        </div>
                        <div>
                          <span className="font-medium">Mobile:</span> {claim.mobile}
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mt-2">
                        <span className="font-medium">Description:</span> {claim.description}
                      </p>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        size="sm"
                        onClick={() => openPaymentDialog(claim)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Mark as Paid
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paid Claims */}
      {paidClaims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paidClaims.slice(0, 5).map((claim) => (
                <div key={claim.id} className="border border-slate-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{claim.employee_name}</h3>
                        <Badge className="bg-green-500/20 text-green-600 border-green-400/50">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600">
                        AED {claim.amount.toFixed(2)} - {claim.category}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Ref: {claim.payment_reference} | Paid: {new Date(claim.paid_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Expense as Paid</DialogTitle>
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
              <label className="text-sm font-medium text-slate-700">Payment Reference *</label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., TXN123456, Cheque #789"
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleMarkAsPaid}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseAccountsPayment;