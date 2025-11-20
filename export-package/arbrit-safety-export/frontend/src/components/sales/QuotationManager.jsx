import { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationManager = () => {
  const [quotations, setQuotations] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    items: '',
    total_amount: '',
    remarks: ''
  });

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/quotations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotations(response.data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name || !formData.total_amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales/quotations`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quotation created successfully');
      setShowDialog(false);
      setFormData({ client_name: '', items: '', total_amount: '', remarks: '' });
      fetchQuotations();
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error('Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">My Quotations</h3>
        <Button
          onClick={() => setShowDialog(true)}
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
          className="text-[#0a1e3d] font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Quotation
        </Button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-300">Client Name</TableHead>
              <TableHead className="text-gray-300">Amount</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                  No quotations created yet
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((quot) => (
                <TableRow key={quot.id} className="border-white/10">
                  <TableCell className="text-white font-medium">{quot.client_name}</TableCell>
                  <TableCell className="text-gray-300">${quot.total_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                      {quot.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm">
                    {new Date(quot.created_at).toLocaleDateString()}
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
              <FileText className="w-5 h-5 text-yellow-400" />
              Create Quotation
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-300">Client Name *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Items / Services</Label>
              <Textarea
                value={formData.items}
                onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                rows={4}
                placeholder="List items, courses, or services..."
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Total Amount *</Label>
              <Input
                type="number"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                required
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Remarks / Terms</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
                className="text-[#0a1e3d] font-semibold"
              >
                Create Quotation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationManager;