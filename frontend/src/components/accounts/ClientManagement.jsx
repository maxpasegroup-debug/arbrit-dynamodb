import { useEffect, useState } from 'react';
import { Users, Plus, Edit, Building2 } from 'lucide-react';
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

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    phone: '',
    company: '',
    credit_limit: '0',
    payment_terms: '30',
    currency: 'AED',
    notes: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

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

  const resetForm = () => {
    setFormData({
      client_name: '',
      email: '',
      phone: '',
      company: '',
      credit_limit: '0',
      payment_terms: '30',
      currency: 'AED',
      notes: ''
    });
  };

  const handleCreate = () => {
    resetForm();
    setEditMode(false);
    setShowDialog(true);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setFormData({
      client_name: client.client_name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      credit_limit: client.credit_limit?.toString() || '0',
      payment_terms: client.payment_terms?.toString() || '30',
      currency: client.currency || 'AED',
      notes: client.notes || ''
    });
    setEditMode(true);
    setShowDialog(true);
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        credit_limit: parseFloat(formData.credit_limit),
        payment_terms: parseInt(formData.payment_terms)
      };

      if (editMode) {
        await axios.put(
          `${API}/accounts/clients/${selectedClient.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Client updated successfully');
      } else {
        await axios.post(
          `${API}/accounts/clients`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Client created successfully');
      }
      
      setShowDialog(false);
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(error.response?.data?.detail || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Client Management</h2>
          <p className="text-gray-400">Manage client accounts, credit limits, and payment terms</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Clients Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-300">Client Name</TableHead>
              <TableHead className="text-gray-300">Company</TableHead>
              <TableHead className="text-gray-300">Contact</TableHead>
              <TableHead className="text-gray-300">Credit Limit</TableHead>
              <TableHead className="text-gray-300">Payment Terms</TableHead>
              <TableHead className="text-gray-300">Outstanding</TableHead>
              <TableHead className="text-gray-300">Revenue</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                  No clients found. Add your first client!
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="border-white/10">
                  <TableCell className="text-white font-medium">{client.client_name}</TableCell>
                  <TableCell className="text-white">{client.company || '-'}</TableCell>
                  <TableCell className="text-gray-300">
                    {client.email || client.phone || '-'}
                  </TableCell>
                  <TableCell className="text-white">
                    {client.currency} {client.credit_limit?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-300">{client.payment_terms} days</TableCell>
                  <TableCell className="text-yellow-400">
                    {client.currency} {(client.outstanding_balance || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-green-400">
                    {client.currency} {(client.total_revenue || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={client.status === 'Active' 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleEdit(client)}
                      size="sm"
                      variant="outline"
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              {editMode ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="ABC Corp"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="+971 50 123 4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Credit Limit</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({...formData, credit_limit: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(val) => setFormData({...formData, currency: val})}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Additional client information..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={submitForm}
              disabled={loading || !formData.client_name}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Saving...' : editMode ? 'Update Client' : 'Create Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientManagement;