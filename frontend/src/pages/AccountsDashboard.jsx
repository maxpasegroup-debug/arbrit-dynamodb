import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, DollarSign, Receipt, Plus, Search, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountsDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [invoiceRequests, setInvoiceRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Dialog states
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [recordPaymentDialogOpen, setRecordPaymentDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    client_name: '',
    invoice_number: '',
    amount: '',
    description: '',
    due_date: ''
  });
  
  const [paymentForm, setPaymentForm] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'Bank Transfer',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (!['Accounts Head', 'Accountant', 'COO', 'MD', 'CEO'].includes(parsedUser.role)) {
        toast.error('Access denied. Accounts team access only.');
        navigate('/login');
        return;
      }
      setUser(parsedUser);
      fetchAllData();
    } catch (error) {
      console.error('Error parsing user:', error);
      toast.error('Session expired. Please login again.');
      navigate('/login');
    }
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [requestsRes, invoicesRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/accounts/invoice-requests`, { headers }),
        axios.get(`${API}/accounts/invoices`, { headers }),
        axios.get(`${API}/accounts/payments`, { headers })
      ]);
      
      setInvoiceRequests(requestsRes.data);
      setInvoices(invoicesRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/accounts/invoices`, invoiceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Invoice created successfully');
      setCreateInvoiceDialogOpen(false);
      setInvoiceForm({
        client_name: '',
        invoice_number: '',
        amount: '',
        description: '',
        due_date: ''
      });
      fetchAllData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/accounts/payments`, paymentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Payment recorded successfully');
      setRecordPaymentDialogOpen(false);
      setPaymentForm({
        invoice_id: '',
        amount: '',
        payment_method: 'Bank Transfer',
        reference_number: '',
        notes: ''
      });
      fetchAllData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    }
  };

  const handleGenerateInvoiceFromRequest = (request) => {
    setInvoiceForm({
      client_name: request.client_name,
      invoice_number: `INV-${Date.now()}`,
      amount: request.amount || '',
      description: request.description || '',
      due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
    });
    setSelectedRequest(request);
    setCreateInvoiceDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50', icon: Clock },
      'Generated': { color: 'bg-blue-500/20 text-blue-400 border-blue-400/50', icon: FileText },
      'Paid': { color: 'bg-green-500/20 text-green-400 border-green-400/50', icon: CheckCircle2 },
      'Overdue': { color: 'bg-red-500/20 text-red-400 border-red-400/50', icon: XCircle },
      'Partially Paid': { color: 'bg-orange-500/20 text-orange-400 border-orange-400/50', icon: Clock }
    };
    
    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Accounts Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">Financial Management & Billing</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-600">{user?.role}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-slate-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="requests" className="data-[state=active]:bg-blue-50">
              <Receipt className="w-4 h-4 mr-2" />
              Requests from Sales
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-blue-50">
              <FileText className="w-4 h-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-blue-50">
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
          </TabsList>

          {/* Invoice Requests Tab */}
          <TabsContent value="requests">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Invoice Requests from Sales Team</CardTitle>
                <Badge variant="outline" className="text-base">
                  {invoiceRequests.length} requests
                </Badge>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-slate-600">Loading...</p>
                ) : invoiceRequests.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No invoice requests found</p>
                ) : (
                  <div className="space-y-3">
                    {invoiceRequests.map((request) => (
                      <div key={request.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-slate-900">{request.client_name}</h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">Amount:</span> AED {request.amount?.toLocaleString() || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Quotation:</span> {request.quotation_ref || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Requested by:</span> {request.requested_by_name}
                              </div>
                              <div>
                                <span className="font-medium">Date:</span> {new Date(request.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            {request.description && (
                              <p className="text-sm text-slate-600 mt-2">
                                <span className="font-medium">Description:</span> {request.description}
                              </p>
                            )}
                          </div>
                          {request.status === 'Pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateInvoiceFromRequest(request)}
                              className="ml-4"
                            >
                              Generate Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">All Invoices</CardTitle>
                <Dialog open={createInvoiceDialogOpen} onOpenChange={setCreateInvoiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Invoice</DialogTitle>
                      <DialogDescription>
                        Generate a new invoice for a client
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateInvoice} className="space-y-4">
                      <div>
                        <Label htmlFor="client_name">Client Name *</Label>
                        <Input
                          id="client_name"
                          value={invoiceForm.client_name}
                          onChange={(e) => setInvoiceForm({...invoiceForm, client_name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoice_number">Invoice Number *</Label>
                        <Input
                          id="invoice_number"
                          value={invoiceForm.invoice_number}
                          onChange={(e) => setInvoiceForm({...invoiceForm, invoice_number: e.target.value})}
                          required
                          placeholder="INV-2024-001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount">Amount (AED) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={invoiceForm.amount}
                          onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={invoiceForm.description}
                          onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})}
                          placeholder="Training services..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={invoiceForm.due_date}
                          onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})}
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setCreateInvoiceDialogOpen(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1">Create Invoice</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-slate-600">Loading...</p>
                ) : invoices.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No invoices found</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-slate-900">{invoice.invoice_number}</h3>
                              {getStatusBadge(invoice.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">Client:</span> {invoice.client_name}
                              </div>
                              <div>
                                <span className="font-medium">Amount:</span> AED {invoice.amount?.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Due Date:</span> {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Created:</span> {new Date(invoice.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            {invoice.description && (
                              <p className="text-sm text-slate-600 mt-2">{invoice.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Payment Records</CardTitle>
                <Dialog open={recordPaymentDialogOpen} onOpenChange={setRecordPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Record Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Record Payment</DialogTitle>
                      <DialogDescription>
                        Record a payment received from a client
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRecordPayment} className="space-y-4">
                      <div>
                        <Label htmlFor="invoice_id">Invoice *</Label>
                        <select
                          id="invoice_id"
                          value={paymentForm.invoice_id}
                          onChange={(e) => setPaymentForm({...paymentForm, invoice_id: e.target.value})}
                          required
                          className="w-full border border-slate-300 rounded-md p-2"
                        >
                          <option value="">Select Invoice</option>
                          {invoices.filter(inv => inv.status !== 'Paid').map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.invoice_number} - {inv.client_name} (AED {inv.amount})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="payment_amount">Amount (AED) *</Label>
                        <Input
                          id="payment_amount"
                          type="number"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <select
                          id="payment_method"
                          value={paymentForm.payment_method}
                          onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                          className="w-full border border-slate-300 rounded-md p-2"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Credit Card">Credit Card</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="reference_number">Reference Number</Label>
                        <Input
                          id="reference_number"
                          value={paymentForm.reference_number}
                          onChange={(e) => setPaymentForm({...paymentForm, reference_number: e.target.value})}
                          placeholder="TXN123456"
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment_notes">Notes</Label>
                        <Input
                          id="payment_notes"
                          value={paymentForm.notes}
                          onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setRecordPaymentDialogOpen(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1">Record Payment</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-slate-600">Loading...</p>
                ) : payments.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No payments recorded</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-slate-900">Payment #{payment.id.slice(0, 8)}</h3>
                              <Badge className="bg-green-500/20 text-green-600 border-green-400/50">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Received
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">Amount:</span> AED {payment.amount?.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Method:</span> {payment.payment_method}
                              </div>
                              <div>
                                <span className="font-medium">Reference:</span> {payment.reference_number || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Date:</span> {new Date(payment.payment_date).toLocaleDateString()}
                              </div>
                            </div>
                            {payment.notes && (
                              <p className="text-sm text-slate-600 mt-2">{payment.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AccountsDashboard;
