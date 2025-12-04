import { useEffect, useState } from 'react';
import { TrendingUp, Edit, Trash2, RefreshCw, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadManagementEnhanced = () => {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddOnlineDialog, setShowAddOnlineDialog] = useState(false);
  const [showAddSelfDialog, setShowAddSelfDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    client_name: '',
    requirement: '',
    industry: '',
    status: 'New',
    remarks: '',
    assigned_to: '',
    source: 'Online'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('Fetching leads and employees...');
      
      const [leadsRes, employeesRes] = await Promise.all([
        axios.get(`${API}/sales/leads`, { headers: { Authorization: `Bearer ${token}` } })
          .catch(err => { console.error('Leads API error:', err); return { data: [] }; }),
        axios.get(`${API}/hrm/employees`, { headers: { Authorization: `Bearer ${token}` } })
          .catch(err => { console.error('Employees API error:', err); return { data: [] }; })
      ]);
      
      console.log('Leads received:', leadsRes.data?.length || 0);
      console.log('Employees received:', employeesRes.data?.length || 0);
      
      setLeads(leadsRes.data || []);
      const salesEmployees = (employeesRes.data || []).filter(e => 
        e.designation === 'TELE_SALES' || e.designation === 'FIELD_SALES' || e.department === 'Sales'
      );
      console.log('Sales employees filtered:', salesEmployees.length);
      setEmployees(salesEmployees);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLeads([]);
      setEmployees([]);
    }
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      client_name: lead.client_name || '',
      requirement: lead.requirement || '',
      industry: lead.industry || '',
      status: lead.status || 'New',
      remarks: lead.remarks || '',
      assigned_to: lead.assigned_to || '',
      source: lead.source || 'Self'
    });
    setShowEditDialog(true);
  };

  const handleDelete = (lead) => {
    setSelectedLead(lead);
    setShowDeleteDialog(true);
  };

  const submitEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/sales-head/leads/${selectedLead.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Lead updated successfully');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API}/sales-head/leads/${selectedLead.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Lead deleted successfully');
      setShowDeleteDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleAddOnlineLead = () => {
    setFormData({
      client_name: '',
      requirement: '',
      industry: '',
      status: 'New',
      remarks: '',
      assigned_to: '',
      source: 'Online'
    });
    setShowAddOnlineDialog(true);
  };

  const submitOnlineLead = async () => {
    if (!formData.client_name || !formData.requirement) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const leadData = {
        ...formData,
        assigned_by: user.id,
        assigned_by_name: user.name,
        created_by: user.id,
        created_by_name: user.name
      };

      if (formData.assigned_to) {
        const emp = employees.find(e => e.id === formData.assigned_to);
        leadData.assigned_to_name = emp?.name || '';
      }

      await axios.post(
        `${API}/sales-head/leads`,
        leadData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Online lead added successfully');
      setShowAddOnlineDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead');
    }
  };

  const handleAddSelfLead = () => {
    setFormData({
      client_name: '',
      requirement: '',
      industry: '',
      status: 'New',
      remarks: '',
      assigned_to: '',
      source: 'Self'
    });
    setShowAddSelfDialog(true);
  };

  const submitSelfLead = async () => {
    if (!formData.client_name || !formData.requirement) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const leadData = {
        ...formData,
        assigned_by: user.id,
        assigned_by_name: user.name,
        created_by: user.id,
        created_by_name: user.name
      };

      if (formData.assigned_to) {
        const emp = employees.find(e => e.id === formData.assigned_to);
        leadData.assigned_to_name = emp?.name || '';
      }

      await axios.post(
        `${API}/sales-head/leads`,
        leadData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Self lead added successfully');
      setShowAddSelfDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead');
    }
  };

  const filteredLeads = leads.filter(lead => {
    // Status filter
    if (filter === 'unassigned' && lead.assigned_to) return false;
    if (filter === 'assigned' && !lead.assigned_to) return false;
    
    // Source filter
    if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;
    
    return true;
  });

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-500',
      'In Progress': 'bg-yellow-500',
      'Proposal Sent': 'bg-purple-500',
      'Closed': 'bg-green-500',
      'Dropped': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getSourceIcon = (source) => {
    return source === 'Self' ? '👤' : '🌐';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          Lead Management
        </h3>
        
        <div className="flex gap-3 flex-wrap">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 bg-white border-gray-300 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2f4d] border-gray-300 text-white">
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-40 bg-white border-gray-300 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2f4d] border-gray-300 text-white">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Self">Self</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleAddOnlineLead} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Online Lead
          </Button>

          <Button onClick={handleAddSelfLead} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Self Lead
          </Button>

          <Button onClick={fetchData} variant="outline" className="border-gray-300 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white backdrop-blur-lg rounded-lg border border-gray-300 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-300 hover:bg-white">
              <TableHead className="text-gray-300">Source</TableHead>
              <TableHead className="text-gray-300">Client Name</TableHead>
              <TableHead className="text-gray-300">Requirement</TableHead>
              <TableHead className="text-gray-300">Industry</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Assigned To</TableHead>
              <TableHead className="text-gray-300">Created By</TableHead>
              <TableHead className="text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="border-gray-300 hover:bg-white">
                  <TableCell className="text-white">
                    <span className="text-xl mr-2">{getSourceIcon(lead.source)}</span>
                    <span className="text-sm">{lead.source}</span>
                  </TableCell>
                  <TableCell className="text-white font-medium">{lead.client_name}</TableCell>
                  <TableCell className="text-gray-300 max-w-xs truncate">{lead.requirement}</TableCell>
                  <TableCell className="text-gray-300">{lead.industry || '-'}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(lead.status)} text-white`}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {lead.assigned_to_name || 'Unassigned'}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {lead.created_by_name || lead.assigned_by_name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => handleEdit(lead)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDelete(lead)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#0f172a] border-gray-300 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client Name *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                className="bg-white border-gray-300 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label>Requirement *</Label>
              <Textarea
                value={formData.requirement}
                onChange={(e) => setFormData({...formData, requirement: e.target.value})}
                className="bg-white border-gray-300 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Industry</Label>
                <Input
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="bg-white border-gray-300 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="bg-white border-gray-300 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-gray-300 text-white">
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Assign To</Label>
              <Select value={formData.assigned_to} onValueChange={(val) => setFormData({...formData, assigned_to: val})}>
                <SelectTrigger className="bg-white border-gray-300 text-white">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-gray-300 text-white">
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation || emp.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="bg-white border-gray-300 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={submitEdit} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#0f172a] border-gray-300 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-400">Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300">
            Are you sure you want to delete the lead for <strong>{selectedLead?.client_name}</strong>? 
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Online Lead Dialog */}
      <Dialog open={showAddOnlineDialog} onOpenChange={setShowAddOnlineDialog}>
        <DialogContent className="bg-[#0f172a] border-gray-300 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Online Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Source (e.g., Facebook, Instagram, Website) *</Label>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                placeholder="Facebook, Instagram, Website, etc."
                className="bg-white border-gray-300 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label>Client Name *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                className="bg-white border-gray-300 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label>Requirement *</Label>
              <Textarea
                value={formData.requirement}
                onChange={(e) => setFormData({...formData, requirement: e.target.value})}
                className="bg-white border-gray-300 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label>Assign To (Optional)</Label>
              <Select value={formData.assigned_to} onValueChange={(val) => setFormData({...formData, assigned_to: val})}>
                <SelectTrigger className="bg-white border-gray-300 text-white">
                  <SelectValue placeholder="Leave unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-gray-300 text-white">
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation || emp.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="bg-white border-gray-300 text-white"
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddOnlineDialog(false)}>Cancel</Button>
            <Button onClick={submitOnlineLead} className="bg-green-600 hover:bg-green-700">Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Self Lead Dialog */}
      <Dialog open={showAddSelfDialog} onOpenChange={setShowAddSelfDialog}>
        <DialogContent className="bg-[#0f172a] border-gray-300 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Self Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client Name *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                className="bg-white border-gray-300 text-white"
                placeholder="Enter client name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Requirement *</Label>
              <Textarea
                value={formData.requirement}
                onChange={(e) => setFormData({...formData, requirement: e.target.value})}
                className="bg-white border-gray-300 text-white"
                placeholder="Describe the requirement"
              />
            </div>
            <div className="grid gap-2">
              <Label>Industry (Optional)</Label>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                placeholder="e.g., Construction, Healthcare"
                className="bg-white border-gray-300 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label>Assign To (Optional)</Label>
              <Select value={formData.assigned_to} onValueChange={(val) => setFormData({...formData, assigned_to: val})}>
                <SelectTrigger className="bg-white border-gray-300 text-white">
                  <SelectValue placeholder="Leave unassigned or select team member" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-gray-300 text-white">
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation || emp.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="bg-white border-gray-300 text-white"
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSelfDialog(false)}>Cancel</Button>
            <Button onClick={submitSelfLead} className="bg-blue-600 hover:bg-blue-700">Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadManagementEnhanced;
