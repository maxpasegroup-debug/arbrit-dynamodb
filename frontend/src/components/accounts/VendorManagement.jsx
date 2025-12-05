import { useEffect, useState } from 'react';
import { Truck, Plus, Edit, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [vendorForm, setVendorForm] = useState({
    vendor_name: '',
    vendor_type: 'Trainer',
    email: '',
    phone: '',
    bank_details: '',
    payment_terms: '30',
    currency: 'AED',
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'Bank Transfer',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    purpose: 'Training Fee',
    notes: ''
  });

  useEffect(() => {
    fetchVendors();
    fetchPayments();
  }, []);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/vendor-payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleAddVendor = () => {
    setVendorForm({
      vendor_name: '',
      vendor_type: 'Trainer',
      email: '',
      phone: '',
      bank_details: '',
      payment_terms: '30',
      currency: 'AED',
      notes: ''
    });
    setShowVendorDialog(true);
  };

  const submitVendor = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/accounts/vendors`,
        {
          ...vendorForm,
          payment_terms: parseInt(vendorForm.payment_terms)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Vendor added successfully');
      setShowVendorDialog(false);
      fetchVendors();
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error('Failed to add vendor');
    } finally {
      setLoading(false);
    }
  };

  const handlePayVendor = (vendor) => {
    setSelectedVendor(vendor);
    setPaymentForm({
      amount: '',
      payment_method: 'Bank Transfer',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      purpose: vendor.vendor_type === 'Trainer' ? 'Training Fee' : 'Services',
      notes: ''
    });
    setShowPaymentDialog(true);
  };

  const submitPayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/accounts/vendor-payments`,
        {
          vendor_id: selectedVendor.id,
          ...paymentForm,
          amount: parseFloat(paymentForm.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Payment recorded successfully');
      setShowPaymentDialog(false);
      fetchVendors();
      fetchPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Vendor Management</h2>
          <p className="text-gray-400">Manage suppliers, trainers, and record payments</p>
        </div>
        <Button onClick={handleAddVendor} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <Tabs defaultValue="vendors" className="space-y-4">
        <TabsList className="bg-slate-900 border border-white/20">
          <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments History</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300">Vendor Name</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Contact</TableHead>
                  <TableHead className="text-gray-300">Payment Terms</TableHead>
                  <TableHead className="text-gray-300">Total Paid</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      No vendors found. Add your first vendor!
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((vendor) => (
                    <TableRow key={vendor.id} className="border-white/10">
                      <TableCell className="text-white font-medium">{vendor.vendor_name}</TableCell>
                      <TableCell className="text-white">{vendor.vendor_type}</TableCell>
                      <TableCell className="text-gray-300">{vendor.email || vendor.phone || '-'}</TableCell>
                      <TableCell className="text-gray-300">{vendor.payment_terms} days</TableCell>
                      <TableCell className="text-green-400">
                        {vendor.currency} {(vendor.total_paid || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={vendor.status === 'Active' 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }>
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handlePayVendor(vendor)}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Pay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">Vendor</TableHead>
                  <TableHead className="text-gray-300">Purpose</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Method</TableHead>
                  <TableHead className="text-gray-300">Reference</TableHead>
                  <TableHead className="text-gray-300">Paid By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      No payments recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id} className="border-white/10">
                      <TableCell className="text-white">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-white">{payment.vendor_name}</TableCell>
                      <TableCell className="text-gray-300">{payment.purpose}</TableCell>
                      <TableCell className="text-red-400 font-semibold">AED {payment.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-300">{payment.payment_method}</TableCell>
                      <TableCell className="text-gray-300">{payment.reference_number || '-'}</TableCell>
                      <TableCell className="text-gray-300">{payment.paid_by_name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Vendor Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-400" />
              Add New Vendor
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor Name *</Label>
                <Input
                  value={vendorForm.vendor_name}
                  onChange={(e) => setVendorForm({...vendorForm, vendor_name: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Vendor Type *</Label>
                <Select value={vendorForm.vendor_type} onValueChange={(val) => setVendorForm({...vendorForm, vendor_type: val})}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    <SelectItem value="Trainer">Trainer</SelectItem>
                    <SelectItem value="Supplier">Supplier</SelectItem>
                    <SelectItem value="Service Provider">Service Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({...vendorForm, phone: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bank Details</Label>
              <Textarea
                value={vendorForm.bank_details}
                onChange={(e) => setVendorForm({...vendorForm, bank_details: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Bank name, account number, IBAN..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms (Days)</Label>
                <Input
                  type="number"
                  value={vendorForm.payment_terms}
                  onChange={(e) => setVendorForm({...vendorForm, payment_terms: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={vendorForm.currency} onValueChange={(val) => setVendorForm({...vendorForm, currency: val})}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={vendorForm.notes}
                onChange={(e) => setVendorForm({...vendorForm, notes: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVendorDialog(false)} className="border-slate-600 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={submitVendor} disabled={loading || !vendorForm.vendor_name} className="bg-blue-500 hover:bg-blue-600">
              {loading ? 'Adding...' : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              Record Vendor Payment
            </DialogTitle>
          </DialogHeader>

          {selectedVendor && (
            <div className="space-y-4 my-4">
              <div className="p-4 bg-slate-900 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400">Vendor: <span className="text-white font-medium">{selectedVendor.vendor_name}</span></p>
                <p className="text-sm text-gray-400 mt-1">Type: <span className="text-white">{selectedVendor.vendor_type}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (AED) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select value={paymentForm.payment_method} onValueChange={(val) => setPaymentForm({...paymentForm, payment_method: val})}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 text-white">
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Purpose *</Label>
                  <Select value={paymentForm.purpose} onValueChange={(val) => setPaymentForm({...paymentForm, purpose: val})}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 text-white">
                      <SelectItem value="Training Fee">Training Fee</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm({...paymentForm, reference_number: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Transaction ID, Cheque number..."
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="border-slate-600 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={submitPayment} disabled={loading || !paymentForm.amount} className="bg-green-500 hover:bg-green-600">
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorManagement;