import { useEffect, useState } from 'react';
import { FileX, Plus } from 'lucide-react';
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

const CreditNoteManager = () => {
  const [creditNotes, setCreditNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    credit_note_number: '',
    invoice_id: '',
    client_name: '',
    amount: '',
    reason: 'Refund',
    description: '',
    issued_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchCreditNotes();
    fetchInvoices();
  }, []);

  const fetchCreditNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/credit-notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCreditNotes(response.data);
    } catch (error) {
      console.error('Error fetching credit notes:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleAdd = () => {
    const nextNumber = `CN-${new Date().getFullYear()}-${String(creditNotes.length + 1).padStart(4, '0')}`;
    setFormData({
      credit_note_number: nextNumber,
      invoice_id: '',
      client_name: '',
      amount: '',
      reason: 'Refund',
      description: '',
      issued_date: new Date().toISOString().split('T')[0]
    });
    setShowDialog(true);
  };

  const handleInvoiceSelect = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        invoice_id: invoiceId,
        client_name: invoice.client_name,
        amount: (invoice.total_amount || invoice.amount).toString()
      }));
    }
  };

  const submitCreditNote = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/accounts/credit-notes`,
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Credit note created successfully');
      setShowDialog(false);
      fetchCreditNotes();
    } catch (error) {
      console.error('Error creating credit note:', error);
      toast.error('Failed to create credit note');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Issued': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Applied': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Void': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors['Issued'];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Credit Note Manager</h2>
          <p className="text-gray-400">Issue credit notes for refunds, cancellations, and adjustments</p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Issue Credit Note
        </Button>
      </div>

      {/* Credit Notes Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-300">Credit Note #</TableHead>
              <TableHead className="text-gray-300">Invoice #</TableHead>
              <TableHead className="text-gray-300">Client</TableHead>
              <TableHead className="text-gray-300">Amount</TableHead>
              <TableHead className="text-gray-300">Reason</TableHead>
              <TableHead className="text-gray-300">Date</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Issued By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creditNotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  No credit notes issued yet
                </TableCell>
              </TableRow>
            ) : (
              creditNotes.map((note) => (
                <TableRow key={note.id} className="border-white/10">
                  <TableCell className="text-white font-medium">{note.credit_note_number}</TableCell>
                  <TableCell className="text-white">{note.invoice_number || '-'}</TableCell>
                  <TableCell className="text-white">{note.client_name}</TableCell>
                  <TableCell className="text-red-400 font-semibold">AED {note.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-300">{note.reason}</TableCell>
                  <TableCell className="text-gray-300">
                    {new Date(note.issued_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(note.status)}>{note.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{note.issued_by_name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Credit Note Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileX className="w-6 h-6 text-red-400" />
              Issue Credit Note
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credit Note Number *</Label>
                <Input
                  value={formData.credit_note_number}
                  onChange={(e) => setFormData({...formData, credit_note_number: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.issued_date}
                  onChange={(e) => setFormData({...formData, issued_date: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link to Invoice (Optional)</Label>
              <Select value={formData.invoice_id || 'none'} onValueChange={handleInvoiceSelect}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select invoice (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="none">None</SelectItem>
                  {invoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (AED) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Select value={formData.reason} onValueChange={(val) => setFormData({...formData, reason: val})}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    <SelectItem value="Refund">Refund</SelectItem>
                    <SelectItem value="Cancellation">Cancellation</SelectItem>
                    <SelectItem value="Discount">Discount</SelectItem>
                    <SelectItem value="Error Correction">Error Correction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                placeholder="Explain the reason for this credit note..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-slate-600 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button 
              onClick={submitCreditNote} 
              disabled={loading || !formData.credit_note_number || !formData.client_name || !formData.amount || !formData.description}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? 'Issuing...' : 'Issue Credit Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditNoteManager;