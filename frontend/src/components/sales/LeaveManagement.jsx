import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Eye, UserCheck, Send, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LeaveManagement = () => {
  const [activeView, setActiveView] = useState('team_requests');
  const [teamRequests, setTeamRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [newRequest, setNewRequest] = useState({
    leaveType: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: '',
    handoverNotes: ''
  });

  const [stats, setStats] = useState({
    pendingReviews: 0,
    approvedThisMonth: 0,
    myPendingRequests: 0,
    teamOnLeave: 0
  });

  useEffect(() => {
    fetchTeamRequests();
    fetchMyRequests();
    fetchStats();
  }, []);

  const fetchTeamRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/sales-head/team-leave-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching team requests:', error);
      // Mock data
      setTeamRequests([
        {
          id: 1,
          employeeName: 'Ahmed Hassan',
          employeeRole: 'Field Sales',
          leaveType: 'Annual Leave',
          startDate: '2025-12-15',
          endDate: '2025-12-20',
          days: 5,
          reason: 'Family vacation in Egypt',
          emergencyContact: '+971501234567',
          handoverNotes: 'All client meetings rescheduled. Follow-up calls assigned to Sarah.',
          status: 'pending',
          requestDate: '2025-12-01',
          employeeId: 'emp001'
        },
        {
          id: 2,
          employeeName: 'Sarah Ali',
          employeeRole: 'Tele Sales',
          leaveType: 'Sick Leave',
          startDate: '2025-12-10',
          endDate: '2025-12-12',
          days: 3,
          reason: 'Medical treatment',
          emergencyContact: '+971509876543',
          handoverNotes: 'Lead calls transferred to Mohammed Ahmed.',
          status: 'pending',
          requestDate: '2025-12-08',
          employeeId: 'emp002'
        },
        {
          id: 3,
          employeeName: 'Mohammed Ahmed',
          employeeRole: 'Sales Employee',
          leaveType: 'Personal Leave',
          startDate: '2025-11-28',
          endDate: '2025-11-28',
          days: 1,
          reason: 'Personal appointment',
          emergencyContact: '+971555123456',
          handoverNotes: 'No urgent tasks pending.',
          status: 'approved',
          requestDate: '2025-11-25',
          reviewedBy: 'Mohammad Akbar',
          reviewDate: '2025-11-26',
          reviewComments: 'Approved for one day personal leave.',
          employeeId: 'emp003'
        }
      ]);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/sales-head/my-leave-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching my requests:', error);
      // Mock data
      setMyRequests([
        {
          id: 1,
          leaveType: 'Annual Leave',
          startDate: '2025-12-25',
          endDate: '2025-12-31',
          days: 6,
          reason: 'Year-end vacation with family',
          status: 'approved',
          requestDate: '2025-11-15',
          approvedBy: 'HR Department',
          approvalDate: '2025-11-18'
        }
      ]);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/sales-head/leave-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Mock stats
      setStats({
        pendingReviews: 2,
        approvedThisMonth: 8,
        myPendingRequests: 0,
        teamOnLeave: 1
      });
    }
  };

  const handleReviewRequest = async () => {
    if (!selectedRequest || !reviewAction) {
      toast.error('Please select an action');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/sales-head/review-leave-request`, {
        requestId: selectedRequest.id,
        action: reviewAction, // 'approve', 'reject', 'forward_to_hr'
        comments: reviewComments
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Leave request ${reviewAction}d successfully`);
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewAction('');
      setReviewComments('');
      fetchTeamRequests();
      fetchStats();
    } catch (error) {
      console.error('Error reviewing request:', error);
      toast.error('Failed to process leave request');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    if (!newRequest.leaveType || !newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const days = Math.ceil((new Date(newRequest.endDate) - new Date(newRequest.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      
      await axios.post(`${BACKEND_URL}/api/sales-head/submit-leave-request`, {
        ...newRequest,
        days
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Leave request submitted to HR');
      setCreateRequestOpen(false);
      setNewRequest({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: '',
        handoverNotes: ''
      });
      fetchMyRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit leave request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'forwarded': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'forwarded': return <Send className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Leave Management Center
          </h3>
          <p className="text-slate-400">
            Review team requests and manage your own leave applications
          </p>
        </div>
        <Button
          onClick={() => setCreateRequestOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-orange-500/10 border-orange-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-orange-400" />
              <div>
                <p className="text-orange-400 font-semibold">Pending Reviews</p>
                <p className="text-xl font-bold text-orange-300">{stats.pendingReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Approved This Month</p>
                <p className="text-xl font-bold text-green-300">{stats.approvedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-blue-400 font-semibold">My Pending</p>
                <p className="text-xl font-bold text-blue-300">{stats.myPendingRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-purple-400 font-semibold">Team On Leave</p>
                <p className="text-xl font-bold text-purple-300">{stats.teamOnLeave}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveView('team_requests')}
          variant={activeView === 'team_requests' ? 'default' : 'outline'}
          className={activeView === 'team_requests' ? 'bg-blue-600' : 'border-white/20'}
        >
          Team Requests ({teamRequests.filter(r => r.status === 'pending').length})
        </Button>
        <Button
          onClick={() => setActiveView('my_requests')}
          variant={activeView === 'my_requests' ? 'default' : 'outline'}
          className={activeView === 'my_requests' ? 'bg-blue-600' : 'border-white/20'}
        >
          My Leave Requests
        </Button>
      </div>

      {/* Team Requests */}
      {activeView === 'team_requests' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Team Leave Requests</h4>
          {teamRequests.map((request) => (
            <Card key={request.id} className="bg-slate-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="text-white font-semibold">{request.employeeName}</h5>
                    <p className="text-slate-400">{request.employeeRole}</p>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">Leave Type</p>
                    <p className="text-white">{request.leaveType}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Duration</p>
                    <p className="text-white">{request.startDate} to {request.endDate} ({request.days} days)</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Reason</p>
                    <p className="text-white">{request.reason}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Emergency Contact</p>
                    <p className="text-white">{request.emergencyContact}</p>
                  </div>
                </div>

                {request.handoverNotes && (
                  <div className="mb-4">
                    <p className="text-slate-400 text-sm">Handover Notes</p>
                    <p className="text-slate-300 bg-slate-800/50 p-2 rounded">{request.handoverNotes}</p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setReviewAction('approve');
                        setReviewDialogOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setReviewAction('reject');
                        setReviewDialogOpen(true);
                      }}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setReviewAction('forward_to_hr');
                        setReviewDialogOpen(true);
                      }}
                      variant="outline"
                      className="border-white/20"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Forward to HR
                    </Button>
                  </div>
                )}

                {request.status !== 'pending' && (
                  <div className="text-sm text-slate-400">
                    {request.status === 'approved' && `Approved by ${request.reviewedBy} on ${request.reviewDate}`}
                    {request.reviewComments && (
                      <p className="mt-1 text-slate-300">Comments: {request.reviewComments}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {teamRequests.length === 0 && (
            <Card className="bg-slate-800/30 border-white/10">
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-slate-300 text-lg font-semibold mb-2">
                  No Pending Requests
                </h3>
                <p className="text-slate-400">
                  All team leave requests have been processed.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* My Requests */}
      {activeView === 'my_requests' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">My Leave Requests</h4>
          {myRequests.map((request) => (
            <Card key={request.id} className="bg-slate-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="text-white font-semibold">{request.leaveType}</h5>
                    <p className="text-slate-400">{request.startDate} to {request.endDate} ({request.days} days)</p>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>

                <div className="mb-4">
                  <p className="text-slate-400 text-sm">Reason</p>
                  <p className="text-white">{request.reason}</p>
                </div>

                <div className="text-sm text-slate-400">
                  Requested on {request.requestDate}
                  {request.status === 'approved' && request.approvedBy && (
                    <span> • Approved by {request.approvedBy} on {request.approvalDate}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {myRequests.length === 0 && (
            <Card className="bg-slate-800/30 border-white/10">
              <CardContent className="text-center py-12">
                <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-slate-300 text-lg font-semibold mb-2">
                  No Leave Requests
                </h3>
                <p className="text-slate-400">
                  You haven't submitted any leave requests yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {reviewAction === 'approve' && 'Approve Leave Request'}
              {reviewAction === 'reject' && 'Reject Leave Request'}
              {reviewAction === 'forward_to_hr' && 'Forward to HR'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Comments (Optional)</Label>
              <Textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Add any comments or notes..."
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReviewRequest}
                className={
                  reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }
              >
                {reviewAction === 'approve' && 'Approve'}
                {reviewAction === 'reject' && 'Reject'}
                {reviewAction === 'forward_to_hr' && 'Forward'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Request Dialog */}
      <Dialog open={createRequestOpen} onOpenChange={setCreateRequestOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Submit Leave Request</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Leave Type *</Label>
                <Select
                  value={newRequest.leaveType}
                  onValueChange={(value) => setNewRequest({...newRequest, leaveType: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-slate-100">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                    <SelectItem value="Management Leave">Management Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Days</Label>
                <Input
                  type="text"
                  value={
                    newRequest.startDate && newRequest.endDate
                      ? Math.ceil((new Date(newRequest.endDate) - new Date(newRequest.startDate)) / (1000 * 60 * 60 * 24)) + 1
                      : ''
                  }
                  placeholder="Will calculate automatically"
                  className="bg-slate-800 border-white/10 text-slate-100"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Start Date *</Label>
                <Input
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({...newRequest, startDate: e.target.value})}
                  className="bg-slate-800 border-white/10 text-slate-100"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label className="text-slate-300">End Date *</Label>
                <Input
                  type="date"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({...newRequest, endDate: e.target.value})}
                  className="bg-slate-800 border-white/10 text-slate-100"
                  min={newRequest.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Reason *</Label>
              <Textarea
                value={newRequest.reason}
                onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                placeholder="Please provide the reason for your leave request..."
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>

            <div>
              <Label className="text-slate-300">Emergency Contact</Label>
              <Input
                value={newRequest.emergencyContact}
                onChange={(e) => setNewRequest({...newRequest, emergencyContact: e.target.value})}
                placeholder="Contact person during your leave"
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>

            <div>
              <Label className="text-slate-300">Handover Notes</Label>
              <Textarea
                value={newRequest.handoverNotes}
                onChange={(e) => setNewRequest({...newRequest, handoverNotes: e.target.value})}
                placeholder="Important tasks, client information for handover..."
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateRequestOpen(false)}
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveManagement;