import { useState, useEffect } from 'react';
import { Plus, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SelfLeadForm = ({ showFieldType = false, onSuccess }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [leadType, setLeadType] = useState('company');
  const [formData, setFormData] = useState({
    lead_type: 'company',
    source: 'Self',
    first_name: '',
    last_name: '',
    lead_owner: '',
    lead_category: '',
    company_name: '',
    phone: '',
    contact_person: '',
    contact_designation: '',
    contact_mobile: '',
    contact_email: '',
    website: '',
    client_name: '',
    employee_count: '',
    training_service_details: '',
    product_services_required: '',
    course_id: '',
    course_name: '',
    num_trainees: 1,
    training_site: '',
    training_location: '',
    training_date: '',
    requirement: '',
    industry: '',
    urgency: 'medium',
    payment_mode: '',
    payment_terms: '',
    remarks: '',
    description: '',
    next_followup_date: '',
    branch: ''
  });

  useEffect(() => {
    if (showDialog) {
      fetchCourses();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.name && !formData.lead_owner) {
        setFormData(prev => ({ ...prev, lead_owner: user.name }));
      }
    }
  }, [showDialog]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleCourseChange = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setFormData({ ...formData, course_id: courseId, course_name: course.name });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.lead_owner) {
      toast.error('Please fill in First Name and Lead Owner');
      return;
    }

    if (leadType === 'company' && (!formData.company_name || !formData.phone)) {
      toast.error('Please fill in Company Name and Phone for company leads');
      return;
    }

    if (leadType === 'individual' && !formData.client_name) {
      toast.error('Please fill in Client Name for individual leads');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = { ...formData, lead_type: leadType, status: 'new', lead_score: 'warm' };

      await axios.post(`${API}/sales/self-lead`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Lead submitted successfully!');
      setShowDialog(false);
      setFormData({
        lead_type: 'company', source: 'Self', first_name: '', last_name: '', lead_owner: '', lead_category: '',
        company_name: '', phone: '', contact_person: '', contact_designation: '', contact_mobile: '',
        contact_email: '', website: '', client_name: '', employee_count: '', training_service_details: '',
        product_services_required: '', course_id: '', course_name: '', num_trainees: 1, training_site: '',
        training_location: '', training_date: '', requirement: '', industry: '', urgency: 'medium',
        payment_mode: '', payment_terms: '', remarks: '', description: '', next_followup_date: '', branch: ''
      });
      setLeadType('company');
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
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">ARBRIT Lead Submission Form</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lead Basic Information */}
            <div className="space-y-4 p-4 bg-purple-500/10 border border-purple-400/30 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-200">Lead Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">First Name *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="John"
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Last Name</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Doe"
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Lead Owner *</Label>
                  <Input
                    value={formData.lead_owner}
                    onChange={(e) => setFormData({ ...formData, lead_owner: e.target.value })}
                    placeholder="Sales Representative"
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Lead Source</Label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-slate-900 border border-white/20 text-gray-900 rounded-md p-2 mt-1"
                  >
                    <option value="Self">Self</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Email Campaign">Email Campaign</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-300">Lead Category</Label>
                  <select
                    value={formData.lead_category}
                    onChange={(e) => setFormData({ ...formData, lead_category: e.target.value })}
                    className="w-full bg-slate-900 border border-white/20 text-gray-900 rounded-md p-2 mt-1"
                  >
                    <option value="">Select Category</option>
                    <option value="Hot">Hot Lead</option>
                    <option value="Warm">Warm Lead</option>
                    <option value="Cold">Cold Lead</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Unqualified">Unqualified</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lead Type Toggle */}
            <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
              <button
                type="button"
                onClick={() => setLeadType('company')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                  leadType === 'company' ? 'bg-blue-600 text-gray-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Company
              </button>
              <button
                type="button"
                onClick={() => setLeadType('individual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                  leadType === 'individual' ? 'bg-blue-600 text-gray-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                Individual
              </button>
            </div>

            {/* Company/Individual Details */}
            {leadType === 'company' && (
              <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-200">Company Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-gray-300">Company Name *</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="ABC Company Ltd."
                      className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Point of Contact *</Label>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="John Doe"
                      className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Designation *</Label>
                    <Input
                      value={formData.contact_designation}
                      onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
                      placeholder="Safety Manager"
                      className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Phone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="971xxxxxxxxx"
                      className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="contact@company.com"
                      className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-300">Website</Label>
                    <Input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.company.com"
                      className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Industry</Label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full bg-slate-900 border border-white/20 text-gray-900 rounded-md p-2 mt-1"
                    >
                      <option value="">Select Industry</option>
                      <option value="Construction">Construction</option>
                      <option value="Oil & Gas">Oil & Gas</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Retail">Retail</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Employee Count</Label>
                    <select
                      value={formData.employee_count}
                      onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                      className="w-full bg-slate-900 border border-white/20 text-gray-900 rounded-md p-2 mt-1"
                    >
                      <option value="">Select Range</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {leadType === 'individual' && (
              <div className="space-y-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-200">Individual Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-gray-300">Full Name *</Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="John Doe"
                      className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Mobile *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="971xxxxxxxxx"
                      className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="john@email.com"
                      className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Training Requirements */}
            <div className="space-y-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-200">Training Requirements</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-gray-300">Training/Service Details</Label>
                  <Input
                    value={formData.training_service_details}
                    onChange={(e) => setFormData({ ...formData, training_service_details: e.target.value })}
                    placeholder="Brief description of training needs"
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-300">Product/Services Required</Label>
                  <Input
                    value={formData.product_services_required}
                    onChange={(e) => setFormData({ ...formData, product_services_required: e.target.value })}
                    placeholder="Specific products or services needed"
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-300">Select Training Program</Label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full bg-slate-900 border border-white/20 text-gray-900 rounded-md p-2 mt-1"
                  >
                    <option value="">Select Training Program</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} - {course.base_fee} AED ({course.duration})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Number of Participants</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.num_trainees}
                    onChange={(e) => setFormData({ ...formData, num_trainees: parseInt(e.target.value) || 1 })}
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Training Date</Label>
                  <Input
                    type="date"
                    value={formData.training_date}
                    onChange={(e) => setFormData({ ...formData, training_date: e.target.value })}
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Training Site</Label>
                  <Input
                    value={formData.training_site}
                    onChange={(e) => setFormData({ ...formData, training_site: e.target.value })}
                    placeholder="On-site / Off-site"
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Training Location</Label>
                  <Input
                    value={formData.training_location}
                    onChange={(e) => setFormData({ ...formData, training_location: e.target.value })}
                    placeholder="City, Country"
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Branch</Label>
                  <Input
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="Branch location"
                    className="bg-slate-900 border-white/20 text-gray-900 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-200">Payment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Payment Mode</Label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="w-full bg-slate-900 border border-white/20 text-gray-900 rounded-md p-2 mt-1"
                  >
                    <option value="">Select Payment Mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online Payment">Online Payment</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Payment Terms</Label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full bg-slate-900 border border-white/20 text-gray-900 rounded-md p-2 mt-1"
                  >
                    <option value="">Select Payment Terms</option>
                    <option value="Advance">100% Advance</option>
                    <option value="50-50">50% Advance, 50% Post-Training</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Custom">Custom Terms</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-4 p-4 bg-slate-9000 border border-white/20 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-200">Additional Information</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-gray-300">Remarks & Description</Label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full bg-slate-900 border border-white/20 text-gray-900 rounded-md p-2 mt-1 min-h-[80px]"
                    placeholder="Any remarks or special notes..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Description</Label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-900 border border-white/20 text-gray-900 rounded-md p-2 mt-1 min-h-[80px]"
                    placeholder="Detailed description of requirements..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
              <Button
                type="button"
                onClick={() => setShowDialog(false)}
                variant="outline"
                className="border-white/20 text-gray-900 hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
                className="text-[#0a1e3d] font-semibold"
              >
                {loading ? 'Submitting...' : 'Submit Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SelfLeadForm;
