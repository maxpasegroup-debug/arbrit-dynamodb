import { useEffect, useState } from 'react';
import { GraduationCap, Check, X, Calendar, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState(''); // approve, reject, alternative, assign
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    remarks: '',
    confirmed_slots: '',
    alternative_dates: '',
    trainer_id: undefined,
    trainer_name: undefined
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [requestsRes, trainersRes] = await Promise.all([
        axios.get(`${API}/academic/trainer-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/academic/trainers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRequests(requestsRes.data || []);
      setTrainers(trainersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Silent fail - no toast on empty data
    }
  };

  const handleAction = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setFormData({ remarks: '', confirmed_slots: '', alternative_dates: '', trainer_id: undefined, trainer_name: undefined });
    setShowDialog(true);
  };

  const submitAction = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let payload = {};

      switch(actionType) {
        case 'approve':
          endpoint = `${API}/academic/trainer-requests/${selectedRequest.id}/approve`;
          payload = { remarks: formData.remarks, confirmed_slots: formData.confirmed_slots };
          break;
        case 'reject':
          endpoint = `${API}/academic/trainer-requests/${selectedRequest.id}/reject`;
          payload = { remarks: formData.remarks };
          break;
        case 'alternative':
          endpoint = `${API}/academic/trainer-requests/${selectedRequest.id}/suggest-alternative`;
          payload = { alternative_dates: formData.alternative_dates, remarks: formData.remarks };
          break;
        case 'assign':
          endpoint = `${API}/academic/trainer-requests/${selectedRequest.id}/assign-trainer`;
          payload = { 
            trainer_id: formData.trainer_id, 
            trainer_name: formData.trainer_name,
            confirmed_slots: formData.confirmed_slots 
          };
          break;
      }

      await axios.put(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Action completed successfully');
      setShowDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Action failed');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Approved': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Rejected': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Alternative Suggested': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Trainer Assigned': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    };
    return colors[status] || colors['Pending'];
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const processedRequests = requests.filter(r => r.status !== 'Pending');

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
        <GraduationCap className="w-6 h-6 text-yellow-400" />
        Training Requirements from Sales Team
      </h3>

      {/* Pending Requests */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Pending Requests ({pendingRequests.length})</h4>
        <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Course</TableHead>
                <TableHead className="text-gray-300">Preferred Dates</TableHead>
                <TableHead className="text-gray-300">Location</TableHead>
                <TableHead className="text-gray-300">Requested By</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">No pending requests</TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((req) => (
                  <TableRow key={req.id} className="border-gray-200">
                    <TableCell className="text-white font-medium">{req.client_name}</TableCell>
                    <TableCell className="text-gray-300">{req.course_type || req.course}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{req.preferred_date || req.preferred_dates}</TableCell>
                    <TableCell className="text-gray-300">{req.location || req.branch}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{req.requested_by_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button onClick={() => handleAction(req, 'approve')} variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/10" title="Approve">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleAction(req, 'reject')} variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10" title="Reject">
                          <X className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleAction(req, 'alternative')} variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10" title="Suggest Alternative">
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleAction(req, 'assign')} variant="ghost" size="sm" className="text-purple-400 hover:bg-purple-500/10" title="Assign Trainer">
                          <UserCheck className="w-4 h-4" />
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

      {/* Processed Requests */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Processed Requests ({processedRequests.length})</h4>
        <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Course</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Trainer</TableHead>
                <TableHead className="text-gray-300">Confirmed Slots</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">No processed requests</TableCell>
                </TableRow>
              ) : (
                processedRequests.map((req) => (
                  <TableRow key={req.id} className="border-gray-200">
                    <TableCell className="text-white font-medium">{req.client_name}</TableCell>
                    <TableCell className="text-gray-300">{req.course_type || req.course}</TableCell>
                    <TableCell><Badge className={getStatusColor(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell className="text-gray-300">{req.trainer_name || '-'}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{req.confirmed_slots || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Training Request'}
              {actionType === 'reject' && 'Reject Training Request'}
              {actionType === 'alternative' && 'Suggest Alternative Dates'}
              {actionType === 'assign' && 'Assign Trainer'}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <p><span className="text-gray-400">Client:</span> <span className="font-semibold">{selectedRequest.client_name}</span></p>
                <p><span className="text-gray-400">Course:</span> {selectedRequest.course_type || selectedRequest.course}</p>
                <p><span className="text-gray-400">Preferred:</span> {selectedRequest.preferred_date || selectedRequest.preferred_dates}</p>
              </div>

              {actionType === 'assign' && (
                <div>
                  <Label className="text-gray-300">Select Trainer</Label>
                  <select 
                    className="w-full mt-1 bg-white border border-gray-300 rounded-md p-2 text-white"
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
              )}

              {(actionType === 'approve' || actionType === 'assign') && (
                <div>
                  <Label className="text-gray-300">Confirmed Slots</Label>
                  <Input value={formData.confirmed_slots} onChange={(e) => setFormData({...formData, confirmed_slots: e.target.value})} className="bg-white border-gray-300 text-white mt-1" />
                </div>
              )}

              {actionType === 'alternative' && (
                <div>
                  <Label className="text-gray-300">Alternative Dates</Label>
                  <Input value={formData.alternative_dates} onChange={(e) => setFormData({...formData, alternative_dates: e.target.value})} className="bg-white border-gray-300 text-white mt-1" />
                </div>
              )}

              <div>
                <Label className="text-gray-300">Remarks</Label>
                <Textarea value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} rows={3} className="bg-white border-gray-300 text-white mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-gray-300 text-white">Cancel</Button>
            <Button onClick={submitAction} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingRequests;