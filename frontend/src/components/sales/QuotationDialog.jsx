import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationDialog = ({ open, onOpenChange, lead, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);
  const [formData, setFormData] = useState({
    client_name: '',
    lead_id: '',
    remarks: '',
    total_amount: 0
  });

  useEffect(() => {
    if (lead) {
      setFormData(prev => ({
        ...prev,
        client_name: lead.client_name || lead.company_name || '',
        lead_id: lead.id || ''
      }));
      
      // Pre-fill with lead data if available
      if (lead.course_name && lead.num_trainees && lead.lead_value) {
        setItems([{
          description: `${lead.course_name} - ${lead.num_trainees} participants`,
          quantity: lead.num_trainees || 1,
          unit_price: parseFloat(lead.lead_value || 0) / (lead.num_trainees || 1),
          amount: parseFloat(lead.lead_value || 0)
        }]);
      }
    }
  }, [lead]);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setFormData(prev => ({ ...prev, total_amount: total }));
  }, [items]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-calculate amount
    if (field === 'quantity' || field === 'unit_price') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].unit_price) || 0;
      newItems[index].amount = qty * price;
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_name) {
      toast.error('Client name is required');
      return;
    }

    if (items.length === 0 || !items[0].description) {
      toast.error('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare items as JSON string
      const itemsJson = JSON.stringify(items);
      
      const quotationData = {
        ...formData,
        items: itemsJson,
        total_amount: parseFloat(formData.total_amount)
      };

      await axios.post(`${API}/sales/quotations`, quotationData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Quotation created successfully!');
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Reset form
      setItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
      setFormData({ client_name: '', lead_id: '', remarks: '', total_amount: 0 });
    } catch (error) {
      console.error('Error creating quotation:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to create quotation';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-300">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Quotation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200">Client Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Client Name *</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  placeholder="Client name"
                  className="bg-gray-50 border-gray-300 text-gray-900"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-700">Lead ID</Label>
                <Input
                  value={formData.lead_id}
                  onChange={(e) => setFormData({...formData, lead_id: e.target.value})}
                  placeholder="Associated lead ID"
                  className="bg-gray-50 border-gray-300 text-gray-900"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Quotation Items */}
          <div className="space-y-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-slate-200">Quotation Items</h4>
              <Button
                type="button"
                onClick={addItem}
                size="sm"
                variant="outline"
                className="border-green-400/50 text-green-300 hover:bg-green-500/20"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50/50 rounded-lg">
                  <div className="col-span-4">
                    <Label className="text-slate-400 text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      className="bg-gray-100 border-gray-300 text-gray-900 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-400 text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="bg-gray-100 border-gray-300 text-gray-900 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-400 text-xs">Unit Price (AED)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      className="bg-gray-100 border-gray-300 text-gray-900 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-400 text-xs">Amount (AED)</Label>
                    <Input
                      type="number"
                      value={item.amount.toFixed(2)}
                      readOnly
                      className="bg-gray-100/50 border-gray-300 text-gray-900 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        size="sm"
                        variant="destructive"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <Label className="text-slate-400">Total Amount</Label>
                  <div className="text-2xl font-bold text-green-400">
                    {formData.total_amount.toFixed(2)} AED
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 p-4 bg-gray-50/50 border border-gray-300 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200">Additional Information</h4>
            <div>
              <Label className="text-gray-700">Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder="Any additional notes or terms..."
                className="bg-gray-50 border-gray-300 text-gray-900 min-h-[80px]"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationDialog;