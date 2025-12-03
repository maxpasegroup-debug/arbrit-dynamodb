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
      await axios.put(`${API}/sales/leads/${selectedLead.id}`, updateData, {
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

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'In Progress': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Proposal Sent': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Closed': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Dropped': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors['New'];
  };

  const selfLeads = leads.filter(l => l.source === 'Self');
  const assignedLeads = leads.filter(l => l.source !== 'Self');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Assigned Leads ({assignedLeads.length})</h3>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Contact</TableHead>
                <TableHead className="text-gray-300">Requirement</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    No assigned leads
                  </TableCell>
                </TableRow>
              ) : (
                assignedLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{lead.client_name}</TableCell>
                    <TableCell className="text-gray-300">
                      {lead.mobile && (
                        <div className="text-sm">{lead.mobile}</div>
                      )}
                      {lead.email && (
                        <div className="text-xs text-gray-400">{lead.email}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">{lead.requirement}</TableCell>
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
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Self Generated Leads ({selfLeads.length})</h3>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Contact</TableHead>
                <TableHead className="text-gray-300">Requirement</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selfLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    No self-generated leads
                  </TableCell>
                </TableRow>
              ) : (
                selfLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{lead.client_name}</TableCell>
                    <TableCell className="text-gray-300">
                      {lead.mobile && (
                        <div className="text-sm">{lead.mobile}</div>
                      )}
                      {lead.email && (
                        <div className="text-xs text-gray-400">{lead.email}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">{lead.requirement}</TableCell>
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
      </div>

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-gray-400">Client</p>
                <p className="font-semibold">{selectedLead.client_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Status</label>
                <Select value={updateData.status} onValueChange={(v) => setUpdateData({...updateData, status: v})}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Remarks</label>
                <Textarea
                  value={updateData.remarks}
                  onChange={(e) => setUpdateData({...updateData, remarks: e.target.value})}
                  rows={3}
                  className="bg-white/5 border-white/20 text-white"
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
    </div>
  );
};

export default LeadManagement;