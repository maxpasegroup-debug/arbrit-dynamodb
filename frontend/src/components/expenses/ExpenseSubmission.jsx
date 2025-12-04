import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const ExpenseSubmission = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Travel',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    attachment_url: ''
  });

  useEffect(() => {
    fetchMyClaims();
  }, []);

  const fetchMyClaims = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expenses/my-claims`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaims(response.data);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/expenses/my-claims`, {
        ...formData,
        amount: parseFloat(formData.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Expense claim submitted successfully!');
      setDialogOpen(false);
      setFormData({
        amount: '',
        category: 'Travel',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        attachment_url: ''
      });
      fetchMyClaims();
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit expense claim');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING_DEPT_HEAD': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50', label: 'Pending Dept Head' },
      'PENDING_HR': { color: 'bg-blue-500/20 text-blue-300 border-blue-400/50', label: 'Pending HR' },
      'PENDING_ACCOUNTS': { color: 'bg-purple-500/20 text-purple-300 border-purple-400/50', label: 'Pending Accounts' },
      'PAID': { color: 'bg-green-500/20 text-green-300 border-green-400/50', label: 'Paid' },
      'REJECTED': { color: 'bg-red-500/20 text-red-300 border-red-400/50', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig['PENDING_DEPT_HEAD'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">My Expense Claims</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Submit Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Submit Expense Claim</DialogTitle>
              <DialogDescription className="text-gray-500">
                Submit your expense for reimbursement
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="expense_date" className="text-gray-700">Expense Date *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-slate-100"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="text-gray-700">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-100 rounded-md p-2"
                  required
                >
                  <option value="Travel">Travel</option>
                  <option value="Food">Food</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <Label htmlFor="amount" className="text-gray-700">Amount (AED) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="bg-gray-50 border-gray-200 text-slate-100"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-700">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-100 rounded-md p-2 min-h-[80px]"
                  placeholder="Describe the expense..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="attachment" className="text-gray-700">Attachment (Optional)</Label>
                <Input
                  id="attachment"
                  type="text"
                  value={formData.attachment_url}
                  onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                  placeholder="Upload URL or file reference"
                  className="bg-gray-50 border-gray-200 text-slate-100"
                />
                <p className="text-xs text-slate-400 mt-1">Upload bill/receipt and paste the URL here</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-gray-300 hover:bg-white">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Submit Claim</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Claims List */}
      <div className="bg-white0 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">My Submitted Claims</h3>
        {loading ? (
          <p className="text-center py-8 text-slate-400">Loading...</p>
        ) : claims.length === 0 ? (
          <p className="text-center py-8 text-slate-400">No expense claims yet</p>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-white transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-100">{claim.category}</h3>
                      {getStatusBadge(claim.status)}
                    </div>
                    <p className="text-sm text-slate-300">{claim.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-100">AED {claim.amount?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-slate-400">{new Date(claim.expense_date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-slate-400">
                  <p>Submitted: {new Date(claim.created_at).toLocaleString()}</p>
                  {claim.dept_head_remarks && (
                    <p className="mt-1 text-slate-300"><strong>Dept Head:</strong> {claim.dept_head_remarks}</p>
                  )}
                  {claim.hr_remarks && (
                    <p className="mt-1 text-slate-300"><strong>HR:</strong> {claim.hr_remarks}</p>
                  )}
                  {claim.payment_reference && (
                    <p className="mt-1 text-slate-300"><strong>Payment Ref:</strong> {claim.payment_reference}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseSubmission;