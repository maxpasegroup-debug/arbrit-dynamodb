import { useState } from 'react';
import { Calendar, Clock, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LeaveRequest = () => {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: '',
    handoverNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  const calculateLeaveDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    const days = calculateLeaveDays(formData.startDate, formData.endDate);
    if (days <= 0) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const requestData = {
        ...formData,
        days: days,
        status: 'pending',
        requestDate: new Date().toISOString().split('T')[0]
      };

      await axios.post(`${BACKEND_URL}/api/sales/leave-requests`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add to local list for demo
      const newRequest = {
        id: Date.now(),
        type: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: days,
        reason: formData.reason,
        status: 'pending',
        requestDate: new Date().toISOString().split('T')[0],
        approvedBy: null
      };
      setRequests(prev => [newRequest, ...prev]);

      toast.success('Leave request submitted successfully!');
      
      // Reset form
      setFormData({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: '',
        handoverNotes: ''
      });
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-400/30';
      default: return 'bg-slate-8000/20 text-gray-400 border-gray-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const totalDaysRequested = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.days, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Leave Requests
        </h3>
        <p className="text-slate-400">
          Submit and track your leave requests to HR
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-500/10 border-orange-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-orange-400" />
              <div>
                <p className="text-orange-400 font-semibold">Pending</p>
                <p className="text-xl font-bold text-orange-300">{pendingRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Approved</p>
                <p className="text-xl font-bold text-green-300">{approvedRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-blue-400 font-semibold">Days Taken</p>
                <p className="text-xl font-bold text-blue-300">{totalDaysRequested}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Leave Request Form */}
      <Card className="bg-slate-9000 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Submit New Leave Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Leave Type *</Label>
                <Select
                  value={formData.leaveType}
                  onValueChange={(value) => setFormData({...formData, leaveType: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-white/20 text-gray-900">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                    <SelectItem value="Maternity/Paternity Leave">Maternity/Paternity Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Days Requested</Label>
                <Input
                  type="text"
                  value={calculateLeaveDays(formData.startDate, formData.endDate) || ''}
                  placeholder="Will calculate automatically"
                  className="bg-slate-800 border-white/20 text-gray-900"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="bg-slate-800 border-white/20 text-gray-900"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label className="text-slate-300">End Date *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="bg-slate-800 border-white/20 text-gray-900"
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Reason for Leave *</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Please provide the reason for your leave request..."
                className="bg-slate-800 border-white/20 text-gray-900 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-slate-300">Emergency Contact (Optional)</Label>
              <Input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                placeholder="Contact person during your leave"
                className="bg-slate-800 border-white/20 text-gray-900"
              />
            </div>

            <div>
              <Label className="text-slate-300">Handover Notes (Optional)</Label>
              <Textarea
                value={formData.handoverNotes}
                onChange={(e) => setFormData({...formData, handoverNotes: e.target.value})}
                placeholder="Any important tasks or client information for handover..."
                className="bg-slate-800 border-white/20 text-gray-900 min-h-[60px]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Submitting...' : 'Submit Leave Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Requests */}
      <Card className="bg-slate-9000 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Leave Request History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((request) => (
            <div 
              key={request.id}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-white/20"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">{request.type}</span>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>{request.startDate} to {request.endDate}</span>
                  <span>{request.days} day{request.days > 1 ? 's' : ''}</span>
                  <span>Requested on {request.requestDate}</span>
                  {request.approvedBy && (
                    <span>by {request.approvedBy}</span>
                  )}
                </div>
                <p className="text-slate-300 text-sm mt-1">{request.reason}</p>
                {request.rejectionReason && (
                  <p className="text-red-400 text-sm mt-1">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Rejection reason: {request.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveRequest;