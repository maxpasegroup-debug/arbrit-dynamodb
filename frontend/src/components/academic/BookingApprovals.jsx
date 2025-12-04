import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Calendar, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [decision, setDecision] = useState('');
  const [remarks, setRemarks] = useState('');
  const [confirmedDate, setConfirmedDate] = useState('');

  useEffect(() => {
    fetchBookingRequests();
  }, []);

  const fetchBookingRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/booking-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      toast.error('Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request, dec) => {
    setSelectedRequest(request);
    setDecision(dec);
    setConfirmedDate(request.requested_date || '');
    setRemarks('');
    setDialogOpen(true);
  };

  const handleApproveReject = async () => {
    if (!selectedRequest) return;

    if (decision === 'approved' && !confirmedDate) {
      toast.error('Please confirm the training date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/booking-requests/${selectedRequest.id}`,
        {
          status: decision,
          confirmed_date: decision === 'approved' ? confirmedDate : null,
          remarks: remarks
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Booking ${decision}!`);
      setDialogOpen(false);
      setSelectedRequest(null);
      fetchBookingRequests();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to update booking');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50', label: 'Pending' },
      approved: { color: 'bg-green-500/20 text-green-300 border-green-400/50', label: 'Approved' },
      rejected: { color: 'bg-red-500/20 text-red-300 border-red-400/50', label: 'Rejected' }
    };
    const { color, label } = config[status] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Training Booking Approvals</h2>
          <p className="text-gray-500 text-sm mt-1">Review and approve training bookings from sales team</p>
        </div>
        <Badge variant="outline" className="text-base border-gray-300">
          {pendingRequests.length} pending
        </Badge>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white0 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Pending Approval</h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-100">{request.company_name}</h4>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>
                          <strong>Requested Date:</strong>{' '}
                          {new Date(request.requested_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-400" />
                        <span>
                          <strong>Trainees:</strong> {request.num_trainees}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-purple-400" />
                        <span>
                          <strong>Contact:</strong> {request.contact_person}
                        </span>
                      </div>
                      <div>
                        <strong>Mobile:</strong> {request.contact_mobile}
                      </div>
                    </div>

                    {request.course_name && (
                      <div className="mb-3">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">
                          {request.course_name}
                        </Badge>
                      </div>
                    )}

                    <div className="text-xs text-slate-400">
                      <p>
                        Requested by: {request.requested_by_name} on{' '}
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleOpenDialog(request, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleOpenDialog(request, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="bg-white0 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Decisions</h3>
          <div className="space-y-3">
            {processedRequests.slice(0, 10).map((request) => (
              <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-100">{request.company_name}</h4>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div>
                        <strong>Requested:</strong>{' '}
                        {new Date(request.requested_date).toLocaleDateString()}
                      </div>
                      {request.confirmed_date && (
                        <div>
                          <strong>Confirmed:</strong>{' '}
                          {new Date(request.confirmed_date).toLocaleDateString()}
                        </div>
                      )}
                      <div>
                        <strong>Course:</strong> {request.course_name || 'N/A'}
                      </div>
                      <div>
                        <strong>Trainees:</strong> {request.num_trainees}
                      </div>
                    </div>

                    {request.remarks && (
                      <div className="mt-2 text-sm text-slate-400 italic">
                        <strong>Remarks:</strong> {request.remarks}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-slate-400">Loading booking requests...</div>
      )}

      {!loading && requests.length === 0 && (
        <div className="bg-white0 backdrop-blur-sm rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500">No booking requests yet</p>
        </div>
      )}

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {decision === 'approved' ? 'Approve Booking' : 'Reject Booking'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  <p className="font-medium text-slate-200 mt-2">
                    {selectedRequest.company_name} - {selectedRequest.course_name}
                  </p>
                  <p className="text-sm text-slate-400">
                    {selectedRequest.num_trainees} trainees
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {decision === 'approved' && (
              <div>
                <Label className="text-gray-700">Confirm Training Date *</Label>
                <Input
                  type="date"
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  className="bg-gray-50 border-gray-200 text-slate-100"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-slate-400 mt-1">
                  You can adjust the date if needed
                </p>
              </div>
            )}

            <div>
              <Label className="text-gray-700">Remarks (Optional)</Label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-slate-100 rounded-md p-2 min-h-[80px]"
                placeholder={
                  decision === 'approved'
                    ? 'Add any special instructions...'
                    : 'Reason for rejection...'
                }
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 border-gray-300 hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveReject}
                className={`flex-1 ${
                  decision === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {decision === 'approved' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingApprovals;
