import { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentRecording = ({ onSuccess }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    client_name: '',
    amount: '',
    payment_date: '',
    payment_method: 'Bank Transfer',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/accounts/payments`, paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Payment recorded successfully!');
      setRecordOpen(false);
      setPaymentData({
        client_name: '',
        amount: '',
        payment_date: '',
        payment_method: 'Bank Transfer',
        reference_number: '',
        notes: ''
      });
      
      fetchPayments();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const getPaymentMethodBadge = (method) => {
    const colors = {
      'Bank Transfer': 'bg-blue-500/20 text-blue-300 border-blue-400/50',
      'Cash': 'bg-green-500/20 text-green-300 border-green-400/50',
      'Cheque': 'bg-purple-500/20 text-purple-300 border-purple-400/50',
      'Credit Card': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'
    };
    return colors[method] || 'bg-gray-500/20 text-gray-300 border-gray-400/50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Payment Recording</h3>
          <p className="text-slate-400 text-sm mt-1">Record and track client payments</p>
        </div>
        <Button
          onClick={() => setRecordOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-12 text-slate-400">Loading payments...</p>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
            <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No payments recorded yet</p>
          </div>
        ) : (
          payments.map((payment, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-white">{payment.client_name || 'Unknown Client'}</h4>
                    <Badge className={getPaymentMethodBadge(payment.payment_method)}>
                      {payment.payment_method}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
                    <div>
                      <span className="text-slate-400">Amount:</span> AED {payment.amount}
                    </div>
                    <div>
                      <span className="text-slate-400">Date:</span> {payment.payment_date}
                    </div>
                    <div>
                      <span className="text-slate-400">Ref:</span> {payment.reference_number || 'N/A'}
                    </div>
                  </div>
                  {payment.notes && (
                    <p className="text-sm text-slate-400 mt-2">{payment.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Record New Payment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter payment details to record a transaction
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Client Name *</Label>
                <Input
                  value={paymentData.client_name}
                  onChange={(e) => setPaymentData({ ...paymentData, client_name: e.target.value })}
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Amount (AED) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Payment Method *</Label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-md p-2"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label className="text-white">Reference Number</Label>
                <Input
                  value={paymentData.reference_number}
                  onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-white">Notes</Label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-md p-2 min-h-[80px]"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
              <Button type="button" variant="outline" onClick={() => setRecordOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentRecording;