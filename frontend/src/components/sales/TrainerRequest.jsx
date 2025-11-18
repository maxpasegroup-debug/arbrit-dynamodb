import { useState, useEffect } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
    course: '',
    preferred_dates: '',
    branch: '',
    mode: 'Offline',
    notes: ''
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
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales/trainer-request`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Trainer request submitted');
      setShowDialog(false);
      setFormData({ client_name: '', course: '', preferred_dates: '', branch: '', mode: 'Offline', notes: '' });
      fetchRequests();
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500/20 text-yellow-300',
      'Confirmed': 'bg-green-500/20 text-green-300',
      'Rejected': 'bg-red-500/20 text-red-300'
    };
    return colors[status] || colors['Pending'];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Trainer Availability Requests</h3>
        <Button onClick={() => setShowDialog(true)} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">
          <Plus className="w-4 h-4 mr-2" />
          Request Trainer
        </Button>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card className="bg-white/5 border-white/10 p-8 text-center">
            <p className="text-gray-400">No trainer requests yet</p>
          </Card>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="bg-white/5 border-white/10 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-white">{req.course}</h4>
                    <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-300">Client: {req.client_name}</p>
                  <p className="text-sm text-gray-400">Dates: {req.preferred_dates} | {req.mode} | {req.branch}</p>
                  {req.trainer_name && (
                    <p className="text-sm text-green-400 mt-2">Trainer: {req.trainer_name}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Request Trainer Availability</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Client Name *</Label>
                <Input value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})} required className="bg-white/5 border-white/20 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-300">Course *</Label>
                <Input value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} required className="bg-white/5 border-white/20 text-white mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Preferred Dates *</Label>
                <Input value={formData.preferred_dates} onChange={(e) => setFormData({...formData, preferred_dates: e.target.value})} required className="bg-white/5 border-white/20 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-300">Branch *</Label>
                <Select value={formData.branch} onValueChange={(v) => setFormData({...formData, branch: v})}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                    <SelectItem value="Dubai">Dubai</SelectItem>
                    <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Mode</Label>
              <Select value={formData.mode} onValueChange={(v) => setFormData({...formData, mode: v})}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} className="bg-white/5 border-white/20 text-white mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="border-white/20 text-white">Cancel</Button>
              <Button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerRequest;