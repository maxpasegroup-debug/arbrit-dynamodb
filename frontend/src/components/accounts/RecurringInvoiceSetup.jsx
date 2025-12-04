import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Pause, Play } from 'lucide-react';
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

const RecurringInvoiceSetup = () => {
  const [recurringInvoices, setRecurringInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    amount: '',
    description: '',
    frequency: 'Monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    fetchRecurringInvoices();
    fetchClients();
  }, []);

  const fetchRecurringInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/recurring-invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecurringInvoices(response.data);
    } catch (error) {
      console.error('Error fetching recurring invoices:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      client_id: '',
      client_name: '',
      amount: '',
      description: '',
      frequency: 'Monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
    setShowDialog(true);
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        client_name: client.client_name
      }));
    }
  };

  const submitRecurringInvoice = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/accounts/recurring-invoices`,
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Recurring invoice setup created');
      setShowDialog(false);
      fetchRecurringInvoices();
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
      toast.error('Failed to create recurring invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Paused': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Completed': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
    return colors[status] || colors['Active'];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Recurring Invoice Setup</h2>
          <p className="text-gray-400">Setup auto-recurring invoices for regular clients</p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Recurring Invoice
        </Button>
      </div>

      {/* Recurring Invoices Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-300">Client</TableHead>
              <TableHead className="text-gray-300">Amount</TableHead>
              <TableHead className="text-gray-300">Frequency</TableHead>
              <TableHead className="text-gray-300">Start Date</TableHead>
              <TableHead className="text-gray-300">Next Invoice</TableHead>
              <TableHead className="text-gray-300">End Date</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recurringInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  No recurring invoices setup yet
                </TableCell>
              </TableRow>
            ) : (
              recurringInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-white/10">
                  <TableCell className="text-white font-medium">{invoice.client_name}</TableCell>
                  <TableCell className="text-white">AED {invoice.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-white">{invoice.frequency}</TableCell>
                  <TableCell className="text-gray-300">
                    {new Date(invoice.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-blue-400">
                    {new Date(invoice.next_invoice_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {invoice.end_date ? new Date(invoice.end_date).toLocaleDateString() : 'No end date'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{invoice.created_by_name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-blue-400" />
              Setup Recurring Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label>Select Client *</Label>
              <Select value={formData.client_id} onValueChange={handleClientSelect}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.client_name} {client.company ? `(${client.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Label>Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(val) => setFormData({...formData, frequency: val})}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                placeholder="What is this recurring invoice for?"
              />
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Invoices will be automatically generated based on the frequency you select.
                You'll be notified when new invoices are created.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-slate-600 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button 
              onClick={submitRecurringInvoice} 
              disabled={loading || !formData.client_name || !formData.amount || !formData.description}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Creating...' : 'Create Recurring Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringInvoiceSetup;