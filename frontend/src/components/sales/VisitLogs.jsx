import { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VisitLogs = () => {
  const [visits, setVisits] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    location: '',
    visit_date: '',
    visit_time: '',
    purpose: '',
    outcome: '',
    next_action: ''
  });

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/visit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
    } catch (error) {
      console.error('Error fetching visit logs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name || !formData.location || !formData.visit_date) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales/visit-logs`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Visit log submitted successfully');
      setShowDialog(false);
      setFormData({
        client_name: '',
        location: '',
        visit_date: '',
        visit_time: '',
        purpose: '',
        outcome: '',
        next_action: ''
      });
      fetchVisits();
    } catch (error) {
      console.error('Error submitting visit log:', error);
      toast.error('Failed to submit visit log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-400" />
          Field Visit Logs
        </h3>
        <Button
          data-testid="log-visit-button"
          onClick={() => setShowDialog(true)}
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
          className="text-[#0a1e3d] font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Visit
        </Button>
      </div>

      <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-300 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-300">
              <TableHead className="text-gray-300">Client Name</TableHead>
              <TableHead className="text-gray-300">Location</TableHead>
              <TableHead className="text-gray-300">Date & Time</TableHead>
              <TableHead className="text-gray-300">Purpose</TableHead>
              <TableHead className="text-gray-300">Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No visit logs recorded yet
                </TableCell>
              </TableRow>
            ) : (
              visits.map((visit) => (
                <TableRow key={visit.id} className="border-gray-300">
                  <TableCell className="text-white font-medium">{visit.client_name}</TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      {visit.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(visit.visit_date).toLocaleDateString()}
                      </div>
                      {visit.visit_time && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {visit.visit_time}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm max-w-xs truncate">
                    {visit.purpose || '-'}
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm max-w-xs truncate">
                    {visit.outcome || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Log Field Visit
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Client Name *</Label>
                <Input
                  data-testid="visit-client-name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  className="bg-white border-gray-300 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Location *</Label>
                <Input
                  data-testid="visit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder="City, Area"
                  className="bg-white border-gray-300 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Visit Date *</Label>
                <Input
                  data-testid="visit-date"
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  required
                  className="bg-white border-gray-300 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Visit Time</Label>
                <Input
                  data-testid="visit-time"
                  type="time"
                  value={formData.visit_time}
                  onChange={(e) => setFormData({ ...formData, visit_time: e.target.value })}
                  className="bg-white border-gray-300 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Purpose of Visit</Label>
              <Textarea
                data-testid="visit-purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                rows={2}
                placeholder="Meeting objective, demonstration, etc."
                className="bg-white border-gray-300 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300">Outcome</Label>
              <Textarea
                data-testid="visit-outcome"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                rows={2}
                placeholder="What was discussed and achieved..."
                className="bg-white border-gray-300 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300">Next Action</Label>
              <Textarea
                data-testid="visit-next-action"
                value={formData.next_action}
                onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                rows={2}
                placeholder="Follow-up steps, next meeting, etc."
                className="bg-white border-gray-300 text-white mt-1"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-gray-300 text-white hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-visit-log"
                type="submit"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
                className="text-[#0a1e3d] font-semibold"
              >
                Submit Log
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitLogs;