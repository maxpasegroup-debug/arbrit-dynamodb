import { useState, useEffect } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VisitLogger = () => {
  const [visits, setVisits] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    company: '',
    contact_person: '',
    notes: ''
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
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales/visit-log`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Visit logged successfully');
      setShowDialog(false);
      setFormData({ date: new Date().toISOString().split('T')[0], company: '', contact_person: '', notes: '' });
      fetchVisits();
    } catch (error) {
      toast.error('Failed to log visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Visit Logs</h3>
        <Button onClick={() => setShowDialog(true)} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">
          <Plus className="w-4 h-4 mr-2" />
          Log Visit
        </Button>
      </div>

      <div className="grid gap-4">
        {visits.length === 0 ? (
          <Card className="bg-white border-gray-300 p-8 text-center">
            <p className="text-gray-400">No visits logged yet</p>
          </Card>
        ) : (
          visits.map((visit) => (
            <Card key={visit.id} className="bg-white border-gray-300 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-400 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{visit.company}</h4>
                  <p className="text-sm text-gray-300">Contact: {visit.contact_person}</p>
                  <p className="text-xs text-gray-400">Date: {visit.date}</p>
                  {visit.notes && (
                    <p className="text-sm text-gray-400 mt-2">{visit.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-white">
          <DialogHeader>
            <DialogTitle>Log Client Visit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-300">Date *</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required className="bg-white border-gray-300 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Company *</Label>
              <Input value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} required className="bg-white border-gray-300 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Contact Person *</Label>
              <Input value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} required className="bg-white border-gray-300 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} className="bg-white border-gray-300 text-white mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="border-gray-300 text-white">Cancel</Button>
              <Button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">Log Visit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitLogger;