import { useEffect, useState } from 'react';
import { CalendarCheck, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaveApprovals = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/leave-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter for sales team members only
      setLeaveRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      // Silent fail - no toast on empty data
    }
  };

  const handleAction = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setRemarks('');
    setShowDialog(true);
  };

  const submitAction = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/hrm/leave-requests/${selectedRequest.id}/${actionType}`,
        { remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Leave request ${actionType}d successfully`);
      setShowDialog(false);
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error processing leave request:', error);
      toast.error('Failed to process leave request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Approved': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Rejected': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors['Pending'];
  };

  const pendingRequests = leaveRequests.filter(r => r.status === 'Pending');
  const processedRequests = leaveRequests.filter(r => r.status !== 'Pending');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-blue-400" />
          Pending Leave Requests ({pendingRequests.length})
        </h3>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">Employee</TableHead>
                <TableHead className="text-gray-300">Leave Type</TableHead>
                <TableHead className="text-gray-300">From</TableHead>
                <TableHead className="text-gray-300">To</TableHead>
                <TableHead className="text-gray-300">Days</TableHead>
                <TableHead className="text-gray-300">Reason</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    No pending leave requests
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((request) => (
                  <TableRow key={request.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{request.employee_name || 'Unknown'}</TableCell>
                    <TableCell className="text-gray-300">{request.leave_type || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300 text-sm">
                      {request.start_date ? new Date(request.start_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">
                      {request.end_date ? new Date(request.end_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300">{request.days || '-'}</TableCell>
                    <TableCell className="text-gray-300 text-sm max-w-xs truncate">
                      {request.reason || 'No reason provided'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(request, 'approve')}
                          variant="ghost"
                          size="sm"
                          className="text-green-400 hover:bg-green-500/10"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleAction(request, 'reject')}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/10"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
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
        <h3 className="text-xl font-semibold text-white mb-4">Processed Requests ({processedRequests.length})</h3>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">Employee</TableHead>
                <TableHead className="text-gray-300">Leave Type</TableHead>
                <TableHead className="text-gray-300">From - To</TableHead>
                <TableHead className="text-gray-300">Days</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    No processed requests
                  </TableCell>
                </TableRow>
              ) : (
                processedRequests.map((request) => (
                  <TableRow key={request.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{request.employee_name || 'Unknown'}</TableCell>
                    <TableCell className="text-gray-300">{request.leave_type || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300 text-sm">
                      {request.start_date && new Date(request.start_date).toLocaleDateString()} - 
                      {request.end_date && new Date(request.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-300">{request.days || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Employee:</span>
                  <span className="font-semibold">{selectedRequest.employee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Leave Type:</span>
                  <span className="font-semibold">{selectedRequest.leave_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-semibold">{selectedRequest.days} days</span>
                </div>
                {selectedRequest.reason && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className="text-gray-400 text-sm">Reason:</span>
                    <p className="text-sm mt-1">{selectedRequest.reason}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Remarks (optional)</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Add any comments..."
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-white/20 text-white">
              Cancel
            </Button>
            <Button
              onClick={submitAction}
              style={{ 
                background: actionType === 'approve' 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              }}
              className="text-white"
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveApprovals;