import { useEffect, useState } from 'react';
import { Phone, Mail, MessageSquare, Edit, TrendingUp, Users, Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import UnifiedLeadForm from './UnifiedLeadForm';
import QuotationDialog from './QuotationDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', remarks: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [quotationLead, setQuotationLead] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Sales Head endpoint to get ALL leads
      const response = await axios.get(`${API}/sales-head/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (lead) => {
    setSelectedLead(lead);
    setUpdateData({ status: lead.status, remarks: lead.remarks || '' });
    setShowUpdateDialog(true);
  };

  const submitUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      // Sales Head endpoint for updates
      await axios.put(`${API}/sales-head/leads/${selectedLead.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Lead updated successfully');
      setShowUpdateDialog(false);
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const handleCreateQuotation = (lead) => {
    setQuotationLead(lead);
    setQuotationOpen(true);
  };

  const handleQuotationSubmit = async (quotationData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/quotations`, quotationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quotation created successfully');
      setQuotationOpen(false);
      fetchLeads();
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error('Failed to create quotation');
    }
  };

  const handleAssignLead = async (leadId, assignTo) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/sales-head/leads/${leadId}`, {
        assigned_to: assignTo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Lead assigned successfully');
      fetchLeads();
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('Failed to assign lead');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'In Progress': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Proposal Sent': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Contacted': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      'Quoted': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      'Negotiation': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'Won': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Closed': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Dropped': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Lost': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors['New'];
  };

  // Filter leads based on search and status
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      (lead.client_name && lead.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.company_name && lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.mobile && lead.mobile.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group leads by assigned person
  const leadsByAssignee = filteredLeads.reduce((acc, lead) => {
    const assignee = lead.assigned_to || 'Unassigned';
    if (!acc[assignee]) {
      acc[assignee] = [];
    }
    acc[assignee].push(lead);
    return acc;
  }, {});

  // Calculate statistics
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    inProgress: leads.filter(l => l.status === 'In Progress' || l.status === 'Contacted').length,
    won: leads.filter(l => l.status === 'Won' || l.status === 'Closed').length,
    lost: leads.filter(l => l.status === 'Lost' || l.status === 'Dropped').length
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Total Leads</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">New & In Progress</p>
              <p className="text-3xl font-bold text-white">{stats.new + stats.inProgress}</p>
            </div>
            <Target className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Won</p>
              <p className="text-3xl font-bold text-white">{stats.won}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Lost</p>
              <p className="text-3xl font-bold text-white">{stats.lost}</p>
            </div>
            <Target className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 items-center bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 p-4">
        <div className="flex-1">
          <Input
            placeholder="Search by client name, company, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border-white/20 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-slate-900 border-white/20 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Quoted">Quoted</SelectItem>
            <SelectItem value="Negotiation">Negotiation</SelectItem>
            <SelectItem value="Won">Won</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => setFormOpen(true)}
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
          className="text-[#0a1e3d]"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Lead
        </Button>
      </div>

      {/* All Leads Table */}
      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white">All Team Leads ({filteredLeads.length})</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead className="text-gray-300">Client</TableHead>
              <TableHead className="text-gray-300">Contact</TableHead>
              <TableHead className="text-gray-300">Requirement</TableHead>
              <TableHead className="text-gray-300">Assigned To</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  Loading leads...
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="border-white/20 hover:bg-white">
                  <TableCell className="text-white font-medium">
                    {lead.company_name || lead.client_name}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {lead.mobile && <div className="text-sm">{lead.mobile}</div>}
                    {lead.email && <div className="text-xs text-gray-400">{lead.email}</div>}
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm">
                    {lead.requirement || lead.course_name || '-'}
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm">
                    {lead.assigned_to_name || lead.created_by_name || 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {lead.mobile && (
                        <>
                          <a href={`tel:${lead.mobile}`}>
                            <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/10">
                              <Phone className="w-4 h-4" />
                            </Button>
                          </a>
                          <a href={`https://wa.me/${lead.mobile.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/10">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </a>
                        </>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`}>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        onClick={() => handleUpdate(lead)}
                        variant="ghost"
                        size="sm"
                        className="text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Update Lead Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-sm text-gray-400">Client</p>
                <p className="font-semibold">{selectedLead.company_name || selectedLead.client_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Status</label>
                <Select value={updateData.status} onValueChange={(v) => setUpdateData({...updateData, status: v})}>
                  <SelectTrigger className="bg-slate-900 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Quoted">Quoted</SelectItem>
                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Remarks</label>
                <Textarea
                  value={updateData.remarks}
                  onChange={(e) => setUpdateData({...updateData, remarks: e.target.value})}
                  rows={3}
                  className="bg-slate-900 border-white/20 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)} className="border-white/20 text-white">
              Cancel
            </Button>
            <Button onClick={submitUpdate} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
          </DialogHeader>
          <UnifiedLeadForm onSuccess={() => { setFormOpen(false); fetchLeads(); }} />
        </DialogContent>
      </Dialog>

      {/* Quotation Dialog */}
      {quotationLead && (
        <QuotationDialog
          open={quotationOpen}
          onOpenChange={setQuotationOpen}
          lead={quotationLead}
          onSubmit={handleQuotationSubmit}
        />
      )}
    </div>
  );
};

export default LeadManagement;