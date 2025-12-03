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
    <Dialog open={open} onOpenChange={onOpenChange