import { useEffect, useState } from 'react';
import { DollarSign, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentRecording = () => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'Bank Transfer',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchPayments();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter unpaid and partially paid invoices
      const unpaid = response.data.filter(inv => 
        inv.payment_status === 'Unpaid' || inv.payment_status === 'Partially Paid'
      );
      setInvoices(unpaid);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleRecordPayment = (invoice) => {
    setSelectedInvoice(invoice);
    const outstanding = (invoice.total_amount || invoice.amount) - (invoice.paid_amount || 0);
    setFormData({
      amount: outstanding.toString(),
      payment_method: 'Bank Transfer',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
    setShowDialog(true);
  };

  const submitPayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/accounts/payments/record`,
        {
          invoice_id: selectedInvoice.id,
          amount: parseFloat(formData.amount),
          payment_method: formData.payment_method,
          payment_date: formData.payment_date,
          reference_number: formData.reference_number,
          notes: formData.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Payment recorded successfully');
      setShowDialog(false);
      fetchInvoices();
      fetchPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      'Unpaid': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Partially Paid': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Paid': 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colors[status] || colors['Unpaid'];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment Recording</h2>
        <p className="text-gray-400">Record payments received from clients</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/10">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by client name or invoice number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-white focus-visible:ring-0"
        />
      </div>

      {/* Unpaid Invoices */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Outstanding Invoices ({filteredInvoices.length})</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-300">Invoice #</TableHead>
              <TableHead className="text-gray-300">Client</TableHead>
              <TableHead className="text-gray-300">Total Amount</TableHead>
              <TableHead className="text-gray-300">Paid</TableHead>
              <TableHead className="text-gray-300">Outstanding</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  {searchTerm ? 'No matching invoices found' : 'All invoices are paid! 🎉'}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => {
                const total = invoice.total_amount || invoice.amount || 0;
                const paid = invoice.paid_amount || 0;
                const outstanding = total - paid;
                return (
                  <TableRow key={invoice.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell className="text-white">{invoice.client_name}</TableCell>
                    <TableCell className="text-white">AED {total.toLocaleString()}</TableCell>
                    <TableCell className="text-green-400">AED {paid.toLocaleString()}</TableCell>
                    <TableCell className="text-red-400 font-semibold">AED {outstanding.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.payment_status)}>{invoice.payment_status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleRecordPayment(invoice)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Recent Payments */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Recent Payments</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-300">Date</TableHead>
              <TableHead className="text-gray-300">Invoice #</TableHead>
              <TableHead className="text-gray-300">Client</TableHead>
              <TableHead className="text-gray-300">Amount</TableHead>
              <TableHead className="text-gray-300">Method</TableHead>
              <TableHead className="text-gray-300">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.slice(0, 10).map((payment) => (
              <TableRow key={payment.id} className="border-white/10">
                <TableCell className="text-white">
                  {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-white">{payment.invoice_number}</TableCell>
                <TableCell className="text-white">{payment.client_name}</TableCell>
                <TableCell className="text-green-400 font-semibold">AED {payment.amount.toLocaleString()}</TableCell>
                <TableCell className="text-gray-300">{payment.payment_method}</TableCell>
                <TableCell className="text-gray-300">{payment.reference_number || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Check className="w-6 h-6 text-green-400" />
              Record Payment
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 my-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400">Invoice: <span className="text-white font-medium">{selectedInvoice.invoice_number}</span></p>
                <p className="text-sm text-gray-400 mt-1">Client: <span className="text-white font-medium">{selectedInvoice.client_name}</span></p>
                <p className="text-sm text-gray-400 mt-1">
                  Total: <span className="text-white font-medium">AED {(selectedInvoice.total_amount || selectedInvoice.amount).toLocaleString()}</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Outstanding: <span className="text-red-400 font-semibold">
                    AED {((selectedInvoice.total_amount || selectedInvoice.amount) - (selectedInvoice.paid_amount || 0)).toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (AED) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_date">Payment Date *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select value={formData.payment_method} onValueChange={(val) => setFormData({...formData, payment_method: val})}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                  placeholder="Transaction ID, Cheque number, etc."
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={submitPayment}
              disabled={loading || !formData.amount}
              className="bg-green-500 hover:bg-green-600"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentRecording;