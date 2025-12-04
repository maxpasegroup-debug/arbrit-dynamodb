import { useState } from 'react';
import { DollarSign, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExpenseSubmissionModal = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Travel',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    attachment_url: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/expenses/my-claims`,
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Expense claim submitted successfully!');
      
      // Reset form
      setFormData({
        amount: '',
        category: 'Travel',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        attachment_url: ''
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit expense claim');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-700 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Submit Expense Claim</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (AED) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              required
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Accommodation">Accommodation</SelectItem>
                <SelectItem value="Meals">Meals</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Communication">Communication</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense_date">Expense Date *</Label>
            <Input
              id="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={(e) => handleChange('expense_date', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
              placeholder="Describe your expense..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment_url">Attachment URL (Optional)</Label>
            <Input
              id="attachment_url"
              type="url"
              value={formData.attachment_url}
              onChange={(e) => handleChange('attachment_url', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              placeholder="https://..."
            />
            <p className="text-xs text-slate-400">Upload receipt to your preferred storage and paste the link here</p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {loading ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseSubmissionModal;
