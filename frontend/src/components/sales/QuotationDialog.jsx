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

const QuotationDialog = ({ open, onOpenChange, lead, existingQuotation, isRevision, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0, amount: 0, additional_info: '' }
  ]);
  const [formData, setFormData] = useState({
    client_name: '',
    lead_id: '',
    remarks: '',
    total_amount: 0,
    location: 'dubai',
    contact_person: '',
    city: '',
    country: 'United Arab Emirates',
    valid_till: '',
    payment_mode: '',
    payment_terms: ''
  });

  // UPDATE 4: Enhanced pre-filling with lead data OR existing quotation for revision
  useEffect(() => {
    // If this is a revision, pre-fill with existing quotation data
    if (isRevision && existingQuotation) {
      setFormData({
        client_name: existingQuotation.client_name || '',
        lead_id: existingQuotation.lead_id || '',
        remarks: existingQuotation.remarks || '',
        total_amount: existingQuotation.total_amount || 0,
        location: existingQuotation.location || 'dubai',
        contact_person: existingQuotation.contact_person || '',
        city: existingQuotation.city || '',
        country: existingQuotation.country || 'United Arab Emirates',
        valid_till: existingQuotation.valid_till || '',
        payment_mode: existingQuotation.payment_mode || '',
        payment_terms: existingQuotation.payment_terms || ''
      });
      
      // Parse existing items
      if (existingQuotation.items) {
        try {
          const parsedItems = JSON.parse(existingQuotation.items);
          setItems(parsedItems.map(item => ({
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            amount: item.amount || 0,
            additional_info: item.additional_info || ''
          })));
        } catch (e) {
          console.error('Error parsing items:', e);
        }
      }
    }
    // Otherwise, pre-fill with lead data
    else if (lead) {
      setFormData(prev => ({
        ...prev,
        client_name: lead.client_name || lead.company_name || '',
        lead_id: lead.id || '',
        contact_person: lead.contact_person || lead.client_name || '',
        city: lead.training_location || lead.city || '',
        country: lead.country || 'United Arab Emirates',
        payment_mode: lead.payment_mode || '',
        payment_terms: lead.payment_terms || ''
      }));
      
      // Pre-fill with lead data if available
      if (lead.course_name && lead.num_trainees && lead.lead_value) {
        setItems([{
          description: `${lead.course_name} - ${lead.num_trainees} participants`,
          quantity: lead.num_trainees || 1,
          unit_price: parseFloat(lead.lead_value || 0) / (lead.num_trainees || 1),
          amount: parseFloat(lead.lead_value || 0),
          additional_info: lead.training_service_details || ''
        }]);
      }
    }
  }, [lead, existingQuotation, isRevision]);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setFormData(prev => ({ ...prev, total_amount: total }));
  }, [items]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0, additional_info: '' }]);
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
      setItems([{ description: '', quantity: 1, unit_price: 0, amount: 0, additional_info: '' }]);
      setFormData({ 
        client_name: '', 
        lead_id: '', 
        remarks: '', 
        total_amount: 0,
        location: 'dubai',
        contact_person: '',
        city: '',
        country: 'United Arab Emirates',
        valid_till: '',
        payment_mode: '',
        payment_terms: ''
      });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/20">
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
                <Label className="text-slate-300">Client Name *</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  placeholder="Client name"
                  className="bg-slate-800 border-white/20 text-slate-100"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-300">Lead ID</Label>
                <Input
                  value={formData.lead_id}
                  onChange={(e) => setFormData({...formData, lead_id: e.target.value})}
                  placeholder="Associated lead ID"
                  className="bg-slate-800 border-white/20 text-slate-100"
                  readOnly
                />
              </div>
            </div>
            
            {/* Location and Additional Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Location *</Label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-slate-800 border border-white/20 text-slate-100 rounded-md p-2"
                  required
                >
                  <option value="dubai">Dubai - ARBRIT SAFETY TRAINING AND CONSULTANCY LLC</option>
                  <option value="abu_dhabi">Abu Dhabi - ARBRIT CONSULTANCY AND SAFETY TRAINING LLC</option>
                  <option value="saudi">Saudi Arabia - ARBRIT SAFETY TRAINING COMPANY</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-300">Contact Person</Label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  placeholder="Contact person name"
                  className="bg-slate-800 border-white/20 text-slate-100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="City"
                  className="bg-slate-800 border-white/20 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="Country"
                  className="bg-slate-800 border-white/20 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Valid Till</Label>
                <Input
                  type="date"
                  value={formData.valid_till}
                  onChange={(e) => setFormData({...formData, valid_till: e.target.value})}
                  className="bg-slate-800 border-white/20 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Quotation Items with Additional Info */}
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
                <div key={index} className="p-3 bg-slate-800/50 rounded-lg space-y-3">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <Label className="text-slate-400 text-xs">Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="bg-slate-700 border-white/20 text-slate-100 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-slate-400 text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="bg-slate-700 border-white/20 text-slate-100 text-sm"
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
                        className="bg-slate-700 border-white/20 text-slate-100 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-slate-400 text-xs">Amount (AED)</Label>
                      <Input
                        type="number"
                        value={item.amount.toFixed(2)}
                        readOnly
                        className="bg-slate-700/50 border-white/20 text-slate-100 text-sm"
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
                  
                  {/* UPDATE 5: Additional Info field for each service */}
                  <div className="w-full">
                    <Label className="text-slate-400 text-xs">Additional Info</Label>
                    <Input
                      value={item.additional_info}
                      onChange={(e) => updateItem(index, 'additional_info', e.target.value)}
                      placeholder="Any additional details for this item..."
                      className="bg-slate-700 border-white/20 text-slate-100 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div className="border-t border-white/20 pt-4">
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

          {/* UPDATE 1: Payment Details Section */}
          <div className="space-y-4 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200">Payment Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Payment Mode</Label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}
                  className="w-full bg-slate-800 border border-white/20 text-slate-100 rounded-md p-2"
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online Payment">Online Payment</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-300">Payment Terms</Label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                  className="w-full bg-slate-800 border border-white/20 text-slate-100 rounded-md p-2"
                >
                  <option value="">Select Payment Terms</option>
                  <option value="Advance">100% Advance</option>
                  <option value="50-50">50% Advance, 50% Post-Training</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="Custom">Custom Terms</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 p-4 bg-slate-800/50 border border-white/20 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200">Additional Information</h4>
            <div>
              <Label className="text-slate-300">Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder="Any additional notes or terms..."
                className="bg-slate-800 border-white/20 text-slate-100 min-h-[80px]"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/20"
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
