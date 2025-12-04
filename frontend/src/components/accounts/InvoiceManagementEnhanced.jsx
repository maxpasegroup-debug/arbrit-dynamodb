import { useEffect, useState } from 'react';
import { FileText, Edit, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoiceManagementEnhanced = () => {
  const [invoices, setInvoices] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: '',
    invoice_number: '',
    amount: '',
    vat_enabled: true,
    vat_rate: '5.0',
    currency: 'AED',
    description: '',
    due_date: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchInvoices();
    fetchPendingInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchPendingInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/approved-invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching pending invoices:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      invoice_number: '',
      amount: '',
      vat_enabled: true,
      vat_rate: '5.0',
      currency: 'AED',
      description: '',
      due_date: ''
    });
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const submitCreate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/accounts/invoices`,
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Invoice created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      client_name: invoice.client_name || '',
      invoice_number: invoice.invoice_number || '',
      amount: invoice.amount || '',
      vat_enabled: invoice.vat_enabled !== undefined ? invoice.vat_enabled : true,
      vat_rate: invoice.vat_rate || '5.0',
      currency: invoice.currency || 'AED',
      description: invoice.description || '',
      due_date: invoice.due_date || ''
    });
    setShowEditDialog(true);
  };

  const submitEdit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/accounts/invoices/${selectedInvoice.id}`,
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Invoice updated successfully');
      setShowEditDialog(false);
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API}/accounts/invoices/${selectedInvoice.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.immediate) {
        toast.success('Invoice deleted successfully');
      } else {
        toast.success('Deletion request submitted to COO/MD for approval');
      }
      
      setShowDeleteDialog(false);
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Paid': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Partially Paid': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Overdue': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Pending Deletion': 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    };
    return colors[status] || colors['Pending'];
  };

  const canEdit = () => {
    return ['Accounts Head', 'Accountant', 'COO', 'MD', 'CEO'].includes(user?.role);
  };

  const canDelete = (invoice) => {
    return ['Accounts Head', 'Accountant', 'COO', 'MD', 'CEO'].includes(user?.role) && invoice.status !== 'Pending Deletion';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Invoice Management
          </h3>
          <p className="text-sm text-gray-400 mt-1">Create, edit, and manage all invoices</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Pending Invoices from Sales */}
      {pendingInvoices.length > 0 && (
        <div className="bg-orange-500/10 backdrop-blur-sm rounded-xl border border-orange-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Pending Invoice Requests from Sales
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''} approved by Sales Head waiting for processing
              </p>
            </div>
          </div>

          <div className="bg-white backdrop-blur-sm rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-300">Client Name</TableHead>
                  <TableHead className="text-gray-300">Lead ID</TableHead>
                  <TableHead className="text-gray-300">Description</TableHead>
                  <TableHead className="text-gray-300">Requested By</TableHead>
                  <TableHead className="text-gray-300">Approved By</TableHead>
                  <TableHead className="text-gray-300">Approved At</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-gray-200">
                    <TableCell className="text-white font-medium">{invoice.client_name}</TableCell>
                    <TableCell className="text-gray-300 font-mono text-sm">{invoice.lead_id?.substring(0, 8)}...</TableCell>
                    <TableCell className="text-gray-300 max-w-xs truncate">{invoice.description}</TableCell>
                    <TableCell className="text-gray-300">{invoice.requested_by_name}</TableCell>
                    <TableCell className="text-gray-300">{invoice.sales_head_approved_by_name}</TableCell>
                    <TableCell className="text-gray-300">{formatDate(invoice.sales_head_approved_at)}</TableCell>
                    <TableCell>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-300">Invoice #</TableHead>
              <TableHead className="text-gray-300">Client Name</TableHead>
              <TableHead className="text-gray-300">Amount</TableHead>
              <TableHead className="text-gray-300">Due Date</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  No invoices found. Create your first invoice!
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-gray-200">
                  <TableCell className="text-white font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell className="text-white">{invoice.client_name}</TableCell>
                  <TableCell className="text-white">{invoice.currency || 'AED'} {parseFloat(invoice.amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-gray-300">{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {canEdit() && (
                        <Button
                          onClick={() => handleEdit(invoice)}
                          size="sm"
                          variant="outline"
                          className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete(invoice) && (
                        <Button
                          onClick={() => handleDelete(invoice)}
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
        }
      }}>
        <DialogContent className="bg-white border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {showCreateDialog ? 'Create New Invoice' : 'Edit Invoice'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                className="bg-gray-50 border-slate-600 text-white"
                placeholder="INV-2025-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                className="bg-gray-50 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Subtotal (Excl. VAT) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="bg-gray-50 border-slate-600 text-white"
                  placeholder="Amount before VAT"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency || 'AED'} onValueChange={(val) => setFormData({...formData, currency: val})}>
                  <SelectTrigger className="bg-gray-50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-50 border-slate-600 text-white">
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                <Input
                  id="vat_rate"
                  type="number"
                  step="0.01"
                  value={formData.vat_rate}
                  onChange={(e) => setFormData({...formData, vat_rate: e.target.value})}
                  className="bg-gray-50 border-slate-600 text-white"
                  placeholder="5% UAE VAT"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="bg-gray-50 border-slate-600 text-white"
                />
              </div>
            </div>

            {formData.amount && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Subtotal:</span>
                  <span className="text-white font-medium">{formData.currency} {parseFloat(formData.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-300">VAT ({formData.vat_rate}%):</span>
                  <span className="text-white font-medium">{formData.currency} {(parseFloat(formData.amount || 0) * parseFloat(formData.vat_rate || 0) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg mt-2 pt-2 border-t border-blue-500/30">
                  <span className="text-white font-semibold">Total:</span>
                  <span className="text-blue-300 font-bold">
                    {formData.currency} {(parseFloat(formData.amount || 0) * (1 + parseFloat(formData.vat_rate || 0) / 100)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-gray-50 border-slate-600 text-white min-h-[100px]"
                placeholder="Invoice details..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
              }}
              className="border-slate-600 text-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={showCreateDialog ? submitCreate : submitEdit}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Saving...' : showCreateDialog ? 'Create Invoice' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {user?.role in ['COO', 'MD', 'CEO']
                ? 'Are you sure you want to permanently delete this invoice? This action cannot be undone.'
                : 'This will send a deletion request to COO/MD for approval.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-white rounded-lg border border-gray-200 my-4">
            <p className="text-sm text-gray-400">
              Invoice: <span className="text-white font-medium">{selectedInvoice?.invoice_number}</span>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Client: <span className="text-white font-medium">{selectedInvoice?.client_name}</span>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Amount: <span className="text-white font-medium">{selectedInvoice?.currency || 'AED'} {parseFloat(selectedInvoice?.amount || 0).toLocaleString()}</span>
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-slate-600 text-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceManagementEnhanced;
