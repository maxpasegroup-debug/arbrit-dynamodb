import { useEffect, useState } from 'react';
import { UserPlus, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadAllocation = () => {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filter, setFilter] = useState('unassigned'); // unassigned, assigned, all

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [leadsRes, employeesRes] = await Promise.all([
        axios.get(`${API}/sales/leads`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/hrm/employees`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setLeads(leadsRes.data || []);
      const salesEmployees = (employeesRes.data || []).filter(e => 
        e.role === 'Tele Sales' || e.role === 'Field Sales'
      );
      setEmployees(salesEmployees);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    }
  };

  const handleAllocate = (lead) => {
    setSelectedLead(lead);
    setSelectedEmployee(lead.assigned_to || '');
    setShowDialog(true);
  };

  const submitAllocation = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/sales/leads/${selectedLead.id}/assign`,
        { employee_id: selectedEmployee },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Lead allocated successfully');
      setShowDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error allocating lead:', error);
      toast.error('Failed to allocate lead');
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'unassigned') return !lead.assigned_to;
    if (filter === 'assigned') return lead.assigned_to;
    return true;
  });

  const getAssignedEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? emp.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          Lead Allocation & Management
        </h3>
        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="all">All Leads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-300">Client Name</TableHead>
              <TableHead className="text-gray-300">Contact</TableHead>
              <TableHead className="text-gray-300">Type</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Assigned To</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="border-white/10">
                  <TableCell className="text-white font-medium">{lead.client_name}</TableCell>
                  <TableCell className="text-gray-300 text-sm">
                    {lead.mobile && <div>{lead.mobile}</div>}
                    {lead.email && <div className="text-xs text-gray-400">{lead.email}</div>}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {lead.lead_type || 'Individual'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={lead.status === 'Closed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {lead.assigned_to ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        {getAssignedEmployeeName(lead.assigned_to)}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleAllocate(lead)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:bg-blue-500/10"
                    >
                      {lead.assigned_to ? <RefreshCw className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      <span className="ml-2">{lead.assigned_to ? 'Reassign' : 'Assign'}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>{selectedLead?.assigned_to ? 'Reassign Lead' : 'Assign Lead'}</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-gray-400">Client</p>
                <p className="font-semibold">{selectedLead.client_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Select Sales Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Choose employee..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-white/20 text-white">
              Cancel
            </Button>
            <Button onClick={submitAllocation} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">
              {selectedLead?.assigned_to ? 'Reassign' : 'Assign'} Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadAllocation;