import { useState, useEffect } from 'react';
import { Plus, DollarSign, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoiceManager = () => {
  const [requests, setRequests] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [paymentConfirmation, setPaymentConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    payment_terms: 'Full Before',
    initial_amount: '',
    notes: ''
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
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales/invoice-request`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice request submitted');
      setShowDialog(false);
      setFormData({ payment_terms: 'Full Before', initial_amount: '', notes: '' });
      fetchRequests();
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/sales/invoice-requests/${selectedRequest.id}/payment`, {
        confirmation_details: paymentConfirmation
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment confirmation updated');
      setShowPaymentDialog(false);
      setPaymentConfirmation('');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500/20 text-yellow-300',
      'Generated': 'bg-blue-500/20 text-blue-300',
      'Paid': 'bg-green-500/20 text-green-300',
      'Partially Paid': 'bg-orange-500/20 text-orange-300'
    };
    return colors[status] || colors['Pending'];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Invoice Requests</h3>
        <Button onClick={() => setShowDialog(true)} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">
          <Plus className="w-4 h-4 mr-2" />
          Request Invoice
        </Button>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card className="bg-white border-gray-300 p-8 text-center">
            <p className="text-gray-400">No invoice requests yet</p>
          </Card>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="bg-white border-gray-300 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <h4 className="font-semibold text-white">{req.payment_terms}</h4>
                    <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                  </div>
                  {req.initial_amount && (
                    <p className="text-sm text-gray-300">Initial Amount: ${req.initial_amount}</p>
                  )}
                  {req.notes && (
                    <p className="text-sm text-gray-400">{req.notes}</p>
                  )}
                  {req.payment_confirmations && (
                    <p className="text-xs text-green-400 mt-2">Payment: {req.payment_confirmations}</p>
                  )}
                </div>
                <Button
                  onClick={() => {
                    setSelectedRequest(req);
                    setShowPaymentDialog(true);
                  }}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-white"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Add Payment
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-white">
          <DialogHeader>
            <DialogTitle>Request Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-300">Payment Terms *</Label>
              <Select value={formData.payment_terms} onValueChange={(v) => setFormData({...formData, payment_terms: v})}>
                <SelectTrigger className="bg-white border-gray-300 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-gray-300 text-white">
                  <SelectItem value="Full Before">Full Payment Before Training</SelectItem>
                  <SelectItem value="Partial">Partial Payment</SelectItem>
                  <SelectItem value="After Training">Payment After Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.payment_terms === 'Partial' && (
              <div>
                <Label className="text-gray-300">Initial Amount</Label>
                <Input type="number" value={formData.initial_amount} onChange={(e) => setFormData({...formData, initial_amount: e.target.value})} className="bg-white border-gray-300 text-white mt-1" />
              </div>
            )}
            <div>
              <Label className="text-gray-300">Notes for Accounts</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} className="bg-white border-gray-300 text-white mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="border-gray-300 text-white">Cancel</Button>
              <Button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-white">
          <DialogHeader>
            <DialogTitle>Add Payment Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Transaction ID / Screenshot / Details</Label>
              <Textarea
                value={paymentConfirmation}
                onChange={(e) => setPaymentConfirmation(e.target.value)}
                rows={4}
                placeholder="Enter transaction ID, reference number, or payment details..."
                className="bg-white border-gray-300 text-white mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="border-gray-300 text-white">Cancel</Button>
            <Button onClick={handlePaymentUpdate} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceManager;