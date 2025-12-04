import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadSubmissionModal = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    requirement: '',
    industry: '',
    source: 'Online',
    status: 'New',
    remarks: '',
    assigned_to: '',
    next_followup_date: ''
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const salesEmployees = (response.data || []).filter(e => 
        e.role === 'Tele Sales' || e.role === 'Field Sales'
      );
      setEmployees(salesEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/sales-head/leads`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Lead submitted successfully!');
      
      // Reset form
      setFormData({
        client_name: '',
        requirement: '',
        industry: '',
        source: 'Online',
        status: 'New',
        remarks: '',
        assigned_to: '',
        next_followup_date: ''
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit lead');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Submit New Lead</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Client Name *</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => handleChange('client_name', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              required
              placeholder="Enter client name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirement">Requirement *</Label>
            <Textarea
              id="requirement"
              value={formData.requirement}
              onChange={(e) => handleChange('requirement', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
              required
              placeholder="Describe the client's requirements..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              placeholder="e.g., Construction, Oil & Gas, Manufacturing"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Select value={formData.source} onValueChange={(value) => handleChange('source', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To</Label>
            <Select value={formData.assigned_to} onValueChange={(value) => handleChange('assigned_to', value)}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Select employee (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_followup_date">Next Follow-up Date</Label>
            <Input
              id="next_followup_date"
              type="date"
              value={formData.next_followup_date}
              onChange={(e) => handleChange('next_followup_date', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
              placeholder="Add any additional remarks..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
            >
              {loading ? 'Submitting...' : 'Submit Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadSubmissionModal;
