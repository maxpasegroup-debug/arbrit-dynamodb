import { useState, useEffect } from 'react';
import { Plus, GraduationCap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainerRequest = () => {
  const [requests, setRequests] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    course_type: '',
    preferred_date: '',
    location: '',
    duration: '',
    remarks: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/trainer-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching trainer requests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name || !formData.course_type || !formData.preferred_date) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales/trainer-requests`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Trainer request submitted successfully');
      setShowDialog(false);
      setFormData({
        client_name: '',
        course_type: '',
        preferred_date: '',
        location: '',
        duration: '',
        remarks: ''
      });
      fetchRequests();
    } catch (error) {
      console.error('Error submitting trainer request:', error);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-yellow-400" />
          Trainer Availability Requests
        </h3>
        <Button
          data-testid="request-trainer-button"
          onClick={() => setShowDialog(true)}
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
          className="text-[#0a1e3d] font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Trainer
        </Button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-gray-300 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-300">
              <TableHead className="text-gray-300">Client Name</TableHead>
              <TableHead className="text-gray-300">Course Type</TableHead>
              <TableHead className="text-gray-300">Preferred Date</TableHead>
              <TableHead className="text-gray-300">Duration</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No trainer requests submitted yet
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className="border-gray-300">
                  <TableCell className="text-white font-medium">{req.client_name}</TableCell>
                  <TableCell className="text-gray-300">{req.course_type}</TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {new Date(req.preferred_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{req.duration || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-yellow-400" />
              Request Trainer Availability
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Client Name *</Label>
                <Input
                  data-testid="trainer-client-name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  className="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Course Type *</Label>
                <Input
                  data-testid="trainer-course-type"
                  value={formData.course_type}
                  onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                  required
                  placeholder="e.g., Fire Safety, First Aid"
                  className="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Preferred Date *</Label>
                <Input
                  data-testid="trainer-date"
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                  required
                  className="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Duration</Label>
                <Input
                  data-testid="trainer-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 2 days, 1 week"
                  className="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Location</Label>
              <Input
                data-testid="trainer-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Training location"
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300">Remarks</Label>
              <Textarea
                data-testid="trainer-remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                placeholder="Additional requirements or notes..."
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-trainer-request"
                type="submit"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
                className="text-[#0a1e3d] font-semibold"
              >
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerRequest;