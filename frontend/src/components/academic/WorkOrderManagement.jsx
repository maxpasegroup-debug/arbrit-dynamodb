import { useEffect, useState } from 'react';
import { FileText, Check, UserPlus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WorkOrderManagement = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [formData, setFormData] = useState({
    trainer_id: '',
    trainer_name: '',
    coordinator_id: '',
    coordinator_name: '',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [workOrdersRes, trainersRes, employeesRes] = await Promise.all([
        axios.get(`${API}/academic/work-orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/academic/trainers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/hrm/employees`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setWorkOrders(workOrdersRes.data || []);
      setTrainers(trainersRes.data || []);
      
      // Filter coordinators from academic department
      const coords = (employeesRes.data || []).filter(e => 
        e.department === 'Academic' && 
        e.designation?.toLowerCase().includes('coordinator')
      );
      setCoordinators(coords);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch work orders');
    }
  };

  const handleApprove = (workOrder) => {
    setSelectedWorkOrder(workOrder);
    setFormData({ trainer_id: '', trainer_name: '', coordinator_id: '', coordinator_name: '', remarks: '' });
    setShowDialog(true);
  };

  const submitApproval = async () => {
    if (!formData.trainer_id) {
      toast.error('Please select a trainer');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/academic/work-orders/${selectedWorkOrder.id}/approve`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Work order approved successfully');
      setShowDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error approving work order:', error);
      toast.error('Failed to approve work order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Approved': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Trainer Assigned': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Scheduled': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Completed': 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[status] || colors['Pending'];
  };

  const pendingOrders = workOrders.filter(wo => wo.status === 'Pending');
  const approvedOrders = workOrders.filter(wo => wo.status !== 'Pending');

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
        <FileText className="w-6 h-6 text-green-400" />
        Work Order Management
      </h3>

      {/* Pending Work Orders */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Pending Approvals ({pendingOrders.length})</h4>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">WO Reference</TableHead>
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Course</TableHead>
                <TableHead className="text-gray-300">Location</TableHead>
                <TableHead className="text-gray-300">Dates</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">No pending work orders</TableCell>
                </TableRow>
              ) : (
                pendingOrders.map((wo) => (
                  <TableRow key={wo.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{wo.reference_number}</TableCell>
                    <TableCell className="text-gray-300">{wo.client_name}</TableCell>
                    <TableCell className="text-gray-300">{wo.course}</TableCell>
                    <TableCell className="text-gray-300">{wo.training_location}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{wo.preferred_dates}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleApprove(wo)}
                        variant="ghost"
                        size="sm"
                        className="text-green-400 hover:bg-green-500/10"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Approved Work Orders */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Approved Work Orders ({approvedOrders.length})</h4>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">WO Reference</TableHead>
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Course</TableHead>
                <TableHead className="text-gray-300">Trainer</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">No approved work orders</TableCell>
                </TableRow>
              ) : (
                approvedOrders.map((wo) => (
                  <TableRow key={wo.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{wo.reference_number}</TableCell>
                    <TableCell className="text-gray-300">{wo.client_name}</TableCell>
                    <TableCell className="text-gray-300">{wo.course}</TableCell>
                    <TableCell className="text-gray-300">{wo.assigned_trainer_name || 'Not assigned'}</TableCell>
                    <TableCell><Badge className={getStatusColor(wo.status)}>{wo.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Work Order</DialogTitle>
          </DialogHeader>
          {selectedWorkOrder && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p><span className="text-gray-400">WO Reference:</span> <span className="font-semibold">{selectedWorkOrder.reference_number}</span></p>
                <p><span className="text-gray-400">Client:</span> {selectedWorkOrder.client_name}</p>
                <p><span className="text-gray-400">Course:</span> {selectedWorkOrder.course}</p>
              </div>

              <div>
                <Label className="text-gray-300">Assign Trainer *</Label>
                <select 
                  className="w-full mt-1 bg-white/5 border border-white/20 rounded-md p-2 text-white"
                  value={formData.trainer_id}
                  onChange={(e) => {
                    const trainer = trainers.find(t => t.id === e.target.value);
                    setFormData({...formData, trainer_id: e.target.value, trainer_name: trainer?.name || ''});
                  }}
                >
                  <option value="">Select trainer...</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} - {t.branch}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-gray-300">Assign Coordinator (Optional)</Label>
                <select 
                  className="w-full mt-1 bg-white/5 border border-white/20 rounded-md p-2 text-white"
                  value={formData.coordinator_id}
                  onChange={(e) => {
                    const coord = coordinators.find(c => c.id === e.target.value);
                    setFormData({...formData, coordinator_id: e.target.value, coordinator_name: coord?.name || ''});
                  }}
                >
                  <option value="">Select coordinator...</option>
                  {coordinators.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-gray-300">Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  rows={3}
                  className="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-white/20 text-white">Cancel</Button>
            <Button onClick={submitApproval} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">Approve & Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrderManagement;