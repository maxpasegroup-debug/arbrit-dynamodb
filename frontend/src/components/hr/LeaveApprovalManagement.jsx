import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Eye, Clock, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaveApprovalManagement = ({ role = 'Sales Head' }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = role === 'Sales Head' 
        ? `${API}/sales-head/leave-requests`
        : `${API}/academic/leave-requests`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleOpenActionDialog = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setRemarks('');
    setActionDialogOpen(true);
  };

  const handleApproveReject = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = role === 'Sales Head'
        ? `${API}/sales-head/leave-requests/${selectedRequest.id}/approve`
        : `${API}/academic/leave-requests/${selectedRequest.id}/approve`;

      await axios.put(
        endpoint,
        { 
          action: actionType === 'approve' ? 'Approve' : 'Reject',
          remarks 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Leave request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      setActionDialogOpen(false);
      fetchLeaveRequests();
    } catch (error) {
      console.error(`Error ${actionType}ing leave:`, error);
      toast.error(`Failed to ${actionType} leave request`);
    } finally {
      setProcessing(false);
    }
  };

  const calculateDays = (from, to) => {
    try {
      const start = new Date(from);
      const end = new Date(to);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch {
      return 0;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      'Approved': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      'Approved by Sales Head': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      'Approved by HR': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      'Rejected': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading leave requests...</div>
      </div>
    );
  }

  const pendingRequests = leaveRequests.filter(r => r.status === 'Pending');
  const processedRequests = leaveRequests.filter(r => r.status !== 'Pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Leave Approval Management</h2>
        <p className="text-gray-300">Review and approve leave requests from your team</p>
      </div>

      {/* Pending Leave Requests */}
      <div className="bg-slate-900 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending Approvals ({pendingRequests.length})
        </h3>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pending leave requests to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div 
                key={request.id}
                className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{request.employee_name}</h4>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>From: {request.leave_from}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>To: {request.leave_to}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="w-4 h-4" />
                        <span>Days: {calculateDays(request.leave_from, request.leave_to)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2">
                      {request.reason || 'No reason provided'}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(request)}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenActionDialog(request, 'approve')}
                      className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenActionDialog(request, 'reject')}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Leave Requests */}
      {processedRequests.length > 0 && (
        <div className="bg-slate-900 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recently Processed</h3>
          <div className="space-y-3">
            {processedRequests.slice(0, 5).map((request) => (
              <div 
                key={request.id}
                className="bg-slate-900 border border-white/10 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium">{request.employee_name}</p>
                  <p className="text-sm text-gray-400">
                    {request.leave_from} to {request.leave_to}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(request.status)}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(request)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Employee</p>
                  <p className="text-white font-medium">{selectedRequest.employee_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Mobile</p>
                  <p className="text-white font-medium">{selectedRequest.employee_mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">From Date</p>
                  <p className="text-white font-medium">{selectedRequest.leave_from}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">To Date</p>
                  <p className="text-white font-medium">{selectedRequest.leave_to}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Number of Days</p>
                  <p className="text-white font-medium">
                    {calculateDays(selectedRequest.leave_from, selectedRequest.leave_to)} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Reason</p>
                <div className="bg-slate-900 border border-white/10 rounded-lg p-3">
                  <p className="text-white whitespace-pre-wrap">{selectedRequest.reason}</p>
                </div>
              </div>

              {selectedRequest.sales_head_remarks && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Manager Remarks</p>
                  <div className="bg-slate-900 border border-white/10 rounded-lg p-3">
                    <p className="text-white">{selectedRequest.sales_head_remarks}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === 'approve' 
                ? 'Add any comments for the employee (optional)'
                : 'Please provide a reason for rejection'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-slate-900 border border-white/10 rounded-lg p-3">
                <p className="text-sm text-gray-400">Employee</p>
                <p className="text-white font-medium">{selectedRequest.employee_name}</p>
                <p className="text-sm text-gray-400 mt-2">Leave Period</p>
                <p className="text-white font-medium">
                  {selectedRequest.leave_from} to {selectedRequest.leave_to} 
                  ({calculateDays(selectedRequest.leave_from, selectedRequest.leave_to)} days)
                </p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Remarks {actionType === 'reject' && <span className="text-red-400">*</span>}
              </label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={actionType === 'approve' ? 'Add any notes...' : 'Reason for rejection...'}
                className="bg-slate-900 border-white/10 text-white"
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                disabled={processing}
                className="border-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveReject}
                disabled={processing || (actionType === 'reject' && !remarks.trim())}
                className={actionType === 'approve' 
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                }
              >
                {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveApprovalManagement;