import { useState, useEffect } from 'react';
import { Plus, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoiceRequest = () => {
  const [requests, setRequests] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    quotation_ref: '',
    amount: '',
    description: '',
    remarks: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/invoice-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching invoice requests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name || !formData.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales/invoice-requests`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice request submitted successfully');
      setShowDialog(false);
      setFormData({
        client_name: '',
        quotation_ref: '',
        amount: '',
        description: '',
        remarks: ''
      });
      fetchRequests();
    } catch (error) {
      console.error('Error submitting invoice request:', error);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Processed': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Rejected': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors['Pending'];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-400" />
          Invoice Requests
        </h3>
        <Button
          data-testid="request-invoice-button"
          onClick={() => setShowDialog(true)}
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
          className="text-[#0a1e3d] font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Invoice
        </Button>
      </div>

      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead className="text-gray-300">Client Name</TableHead>
              <TableHead className="text-gray-300">Quotation Ref</TableHead>
              <TableHead className="text-gray-300">Amount</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No invoice requests submitted yet
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className="border-white/20">
                  <TableCell className="text-white font-medium">{req.client_name}</TableCell>
                  <TableCell className="text-gray-300">{req.quotation_ref || '-'}</TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      {parseFloat(req.amount).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm">
                    {new Date(req.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-400" />
              Request Invoice from Accounts
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Client Name *</Label>
                <Input
                  data-testid="invoice-client-name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  className="bg-slate-900 border-white/20 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Quotation Reference</Label>
                <Input
                  data-testid="invoice-quotation-ref"
                  value={formData.quotation_ref}
                  onChange={(e) => setFormData({ ...formData, quotation_ref: e.target.value })}
                  placeholder="QT-2025-001"
                  className="bg-slate-900 border-white/20 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Amount *</Label>
              <Input
                data-testid="invoice-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
                className="bg-slate-900 border-white/20 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea
                data-testid="invoice-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Items/Services covered in this invoice..."
                className="bg-slate-900 border-white/20 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300">Remarks</Label>
              <Textarea
                data-testid="invoice-remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                placeholder="Additional notes for accounts team..."
                className="bg-slate-900 border-white/20 text-white mt-1"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-white/20 text-white hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-invoice-request"
                type="submit"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
                className="text-[#0a1e3d] font-semibold"
              >
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceRequest;