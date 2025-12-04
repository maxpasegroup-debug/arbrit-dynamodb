import { useState, useEffect } from 'react';
import { DollarSign, Send, CheckCircle, Clock, AlertTriangle, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentManagement = () => {
  const [approvedInvoices, setApprovedInvoices] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Send invoice form
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sentVia, setSentVia] = useState('Email');
  
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [approvedRes, pendingRes, historyRes] = await Promise.all([
        axios.get(`${API}/accounts/approved-invoices`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/accounts/pending-payments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/accounts/payments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setApprovedInvoices(approvedRes.data || []);
      setPendingPayments(pendingRes.data || []);
      setPaymentHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleOpenSendDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceNumber(invoice.quotation_ref || `INV-${Date.now()}`);
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
    setSendVia('Email');
    setSendDialogOpen(true);
  };

  const handleMarkAsSent = async () => {
    if (!selectedInvoice || !invoiceNumber) {
      toast.error('Invoice number is required');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/accounts/invoices/${selectedInvoice.id}/mark-sent`,
        {
          invoice_number: invoiceNumber,
          due_date: dueDate,
          sent_via: sentVia
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Invoice marked as sent to client');
      setSendDialogOpen(false);
      fetchAllData();
    } catch (error) {
      console.error('Error marking invoice as sent:', error);
      toast.error('Failed to mark invoice as sent');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenPaymentDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(Number(invoice.amount).toFixed(2));
    setPaymentMethod('Bank Transfer');
    setPaymentReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentAmount || !paymentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/accounts/payments`,
        {
          invoice_id: selectedInvoice.id,
          invoice_number: selectedInvoice.invoice_number || selectedInvoice.quotation_ref,
          client_name: selectedInvoice.client_name,
          amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          payment_date: paymentDate,
          notes: paymentNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Payment recorded successfully');
      setPaymentDialogOpen(false);
      fetchAllData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status, isOverdue = false) => {
    if (isOverdue) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </Badge>
      );
    }

    const statusConfig = {
      'Approved': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      'Sent': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Send },
      'Paid': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: DollarSign },
      'Pending': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading payment data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Payment Management</h2>
        <p className="text-gray-300">Process invoices and track payments</p>
      </div>

      {/* Approved Invoices - Ready to Send */}
      <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Approved Invoices - Ready to Send ({approvedInvoices.filter(i => !i.sent_to_client).length})
        </h3>

        {approvedInvoices.filter(i => !i.sent_to_client).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No approved invoices pending</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedInvoices.filter(i => !i.sent_to_client).map((invoice) => (
              <div 
                key={invoice.id}
                className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-white font-medium">{invoice.client_name}</h4>
                  <p className="text-sm text-gray-400">AED {Number(invoice.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Ref: {invoice.quotation_ref}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge('Approved')}
                  <Button
                    size="sm"
                    onClick={() => handleOpenSendDialog(invoice)}
                    className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send to Client
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Payments */}
      <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending Payments ({pendingPayments.length})
        </h3>

        {pendingPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>All payments received</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((invoice) => (
              <div 
                key={invoice.id}
                className={`border rounded-lg p-4 flex items-center justify-between ${
                  invoice.is_overdue 
                    ? 'bg-gradient-to-r from-red-500/5 to-orange-500/5 border-red-500/30'
                    : 'bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border-yellow-500/20'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-medium">{invoice.client_name}</h4>
                    {getStatusBadge('Sent', invoice.is_overdue)}
                  </div>
                  <p className="text-sm text-gray-400">Amount: AED {Number(invoice.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Invoice: {invoice.invoice_number}</p>
                  {invoice.is_overdue && (
                    <p className="text-xs text-red-400 mt-1">
                      Overdue by {invoice.days_overdue} days
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(invoice)}
                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenPaymentDialog(invoice)}
                    className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Record Payment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Payments */}
      {paymentHistory.length > 0 && (
        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {paymentHistory.slice(0, 5).map((payment) => (
              <div 
                key={payment.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium">{payment.client_name}</p>
                  <p className="text-sm text-gray-400">
                    AED {Number(payment.amount).toLocaleString()} via {payment.payment_method}
                  </p>
                  <p className="text-xs text-gray-500">{payment.payment_date}</p>
                </div>
                {getStatusBadge('Paid')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Invoice Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-gray-200 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Send Invoice to Client</DialogTitle>
            <DialogDescription className="text-gray-400">
              Generate invoice number and mark as sent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInvoice && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-400">Client</p>
                <p className="text-white font-medium">{selectedInvoice.client_name}</p>
                <p className="text-sm text-gray-400 mt-2">Amount</p>
                <p className="text-white font-medium">AED {Number(selectedInvoice.amount).toLocaleString()}</p>
              </div>
            )}

            <div>
              <Label className="text-gray-400">Invoice Number *</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2025-001"
                className="bg-white border-gray-200 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-400">Due Date *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-white border-gray-200 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-400">Send Via</Label>
              <Select value={sentVia} onValueChange={setSentVia}>
                <SelectTrigger className="bg-white border-gray-200 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-gray-200">
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                  <SelectItem value="Hand Delivery">Hand Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setSendDialogOpen(false)}
                disabled={processing}
                className="border-gray-300 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkAsSent}
                disabled={processing || !invoiceNumber}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {processing ? 'Processing...' : 'Mark as Sent'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-gray-200 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Record Payment Received</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter payment details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInvoice && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Client</p>
                  <p className="text-white font-medium">{selectedInvoice.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Invoice</p>
                  <p className="text-white font-medium">{selectedInvoice.invoice_number}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Amount (AED) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="bg-white border-gray-200 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-400">Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="bg-white border-gray-200 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-white border-gray-200 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-gray-200">
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Online Payment">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Reference Number</Label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="TXN12345"
                  className="bg-white border-gray-200 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-400">Notes</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="bg-white border-gray-200 text-white mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={processing}
                className="border-gray-300 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={processing || !paymentAmount || !paymentDate}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {processing ? 'Processing...' : 'Record Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-gray-200 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Client</p>
                  <p className="text-white font-medium">{selectedInvoice.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="text-white font-medium">AED {Number(selectedInvoice.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Invoice Number</p>
                  <p className="text-white font-medium">{selectedInvoice.invoice_number || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.invoice_status || 'Approved')}</div>
                </div>
              </div>
              
              {selectedInvoice.description && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Description</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-white">{selectedInvoice.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagement;
