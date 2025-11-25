import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SelfLeadForm = ({ showFieldType = false, onSuccess }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    mobile: '',
    email: '',
    company_name: '',
    branch: '',
    requirement: '',
    lead_type: 'Individual',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.mobile || !formData.branch || !formData.requirement) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales/self-lead`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Self lead submitted successfully');
      setShowDialog(false);
      setFormData({
        client_name: '',
        mobile: '',
        email: '',
        company_name: '',
        branch: '',
        requirement: '',
        lead_type: 'Individual',
        notes: ''
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to submit lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        data-testid="submit-self-lead-button"
        onClick={() => setShowDialog(true)}
        style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
        className="text-[#0a1e3d] font-semibold"
      >
        <Plus className="w-4 h-4 mr-2" />
        Submit Self Lead
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Submit Self Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Client Name *</Label>
                <Input
                  data-testid="lead-client-name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  className="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Mobile *</Label>
                <Input
                  data-testid="lead-mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                  className="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Email</Label>
                <Input
                  data-testid="lead-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Company Name</Label>
                <Input
                  data-testid="lead-company"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Branch *</Label>
                <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value })}>
                  <SelectTrigger data-testid="lead-branch" className="bg-white/5 border-white/20 text-white mt-1">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                    <SelectItem value="Dubai">Dubai</SelectItem>
                    <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showFieldType && (
                <div>
                  <Label className="text-gray-300">Lead Type *</Label>
                  <Select value={formData.lead_type} onValueChange={(value) => setFormData({ ...formData, lead_type: value })}>
                    <SelectTrigger data-testid="lead-type" className="bg-white/5 border-white/20 text-white mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                      <SelectItem value="Company">Company</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label className="text-gray-300">Requirement *</Label>
              <Textarea
                data-testid="lead-requirement"
                value={formData.requirement}
                onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                required
                rows={3}
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300">Notes</Label>
              <Textarea
                data-testid="lead-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
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
                data-testid="submit-lead-button"
                type="submit"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
                className="text-[#0a1e3d] font-semibold"
              >
                Submit Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SelfLeadForm;
