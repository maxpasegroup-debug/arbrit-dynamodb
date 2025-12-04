import { useState } from 'react';
import { Calendar, Users, MapPin, AlertCircle, Building2, User, Phone, Mail, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainingRequestForm = ({ open, onOpenChange, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    contact_person: '',
    contact_mobile: '',
    contact_email: '',
    course_name: '',
    number_of_participants: '',
    preferred_dates: ['', ''],
    location: 'Dubai',
    urgency: 'Medium',
    requirement: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.contact_person || !formData.contact_mobile || !formData.course_name || !formData.number_of_participants) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const requestData = {
        ...formData,
        number_of_participants: parseInt(formData.number_of_participants),
        preferred_dates: formData.preferred_dates.filter(d => d !== '')
      };

      await axios.post(
        `${API}/sales/training-requests`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Training request submitted successfully!');
      
      // Reset form
      setFormData({
        client_name: '',
        contact_person: '',
        contact_mobile: '',
        contact_email: '',
        course_name: '',
        number_of_participants: '',
        preferred_dates: ['', ''],
        location: 'Dubai',
        urgency: 'Medium',
        requirement: ''
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating training request:', error);
      toast.error(error.response?.data?.detail || 'Failed to create training request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            Request Training
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Client Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Company Name *</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  className="bg-gray-50 border-gray-200 text-white"
                  placeholder="ABC Construction"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Contact Person *</Label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  className="bg-gray-50 border-gray-200 text-white"
                  placeholder="Ahmed Ali"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Contact Mobile *</Label>
                <Input
                  value={formData.contact_mobile}
                  onChange={(e) => setFormData({...formData, contact_mobile: e.target.value})}
                  className="bg-gray-50 border-gray-200 text-white"
                  placeholder="971501234567"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  className="bg-gray-50 border-gray-200 text-white"
                  placeholder="contact@company.com"
                />
              </div>
            </div>
          </div>

          {/* Training Details */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Training Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Course Name *</Label>
                <Input
                  value={formData.course_name}
                  onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                  className="bg-gray-50 border-gray-200 text-white"
                  placeholder="Scaffolding Safety"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Number of Participants *</Label>
                <Input
                  type="number"
                  value={formData.number_of_participants}
                  onChange={(e) => setFormData({...formData, number_of_participants: e.target.value})}
                  className="bg-gray-50 border-gray-200 text-white"
                  placeholder="25"
                  min="1"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Location *</Label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-white"
                  required
                >
                  <option value="Dubai">Dubai</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Saudi">Saudi</option>
                  <option value="UK">UK</option>
                </select>
              </div>
              <div>
                <Label className="text-white">Urgency *</Label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-white"
                  required
                >
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preferred Dates */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              Preferred Dates
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Option 1</Label>
                <Input
                  type="date"
                  value={formData.preferred_dates[0]}
                  onChange={(e) => {
                    const newDates = [...formData.preferred_dates];
                    newDates[0] = e.target.value;
                    setFormData({...formData, preferred_dates: newDates});
                  }}
                  className="bg-gray-50 border-gray-200 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Option 2</Label>
                <Input
                  type="date"
                  value={formData.preferred_dates[1]}
                  onChange={(e) => {
                    const newDates = [...formData.preferred_dates];
                    newDates[1] = e.target.value;
                    setFormData({...formData, preferred_dates: newDates});
                  }}
                  className="bg-gray-50 border-gray-200 text-white"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <Label className="text-white">Additional Requirements</Label>
            <textarea
              value={formData.requirement}
              onChange={(e) => setFormData({...formData, requirement: e.target.value})}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-white min-h-[80px]"
              placeholder="Any special requirements or notes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 text-white hover:bg-white"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingRequestForm;
