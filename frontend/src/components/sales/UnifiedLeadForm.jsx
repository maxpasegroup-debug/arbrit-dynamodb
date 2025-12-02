import { useState, useEffect } from 'react';
import { Building2, User, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * UnifiedLeadForm - Single component for both Enhanced and Self lead creation
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state (for enhanced mode)
 * @param {Function} props.onOpenChange - Dialog state handler (for enhanced mode)
 * @param {Function} props.onSuccess - Success callback
 * @param {Object} props.existingLead - Existing lead data for edit mode
 * @param {boolean} props.showFieldType - Show field sales type selector (for self mode)
 * @param {string} props.mode - 'enhanced' or 'self' (determines UI style)
 */
const UnifiedLeadForm = ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  existingLead = null,
  showFieldType = false,
  mode = 'enhanced' // 'enhanced' or 'self'
}) => {
  const [courses, setCourses] = useState([]);
  const [leadType, setLeadType] = useState('company');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  // Unified form data state
  const [formData, setFormData] = useState({
    lead_type: 'company',
    source: 'Self',
    lead_owner: '',
    lead_category: '',
    // Company fields
    company_name: '',
    contact_person: '',
    contact_designation: '',
    phone: '',
    contact_mobile: '',
    contact_email: '',
    website: '',
    industry: '',
    employee_count: '',
    // Individual fields
    client_name: '',
    client_mobile: '',
    client_email: '',
    first_name: '',
    last_name: '',
    // Training details
    training_service_details: '',
    product_services_required: '',
    course_id: '',
    course_name: '',
    num_trainees: 1,
    training_site: '',
    training_location: '',
    training_date: '',
    requirement: '',
    urgency: 'medium',
    payment_mode: '',
    payment_terms: '',
    remarks: '',
    description: '',
    next_followup_date: '',
    branch: '',
    lead_value: '0',
    lead_score: 'warm',
    status: 'new',
    field_sales_type: ''
  });

  useEffect(() => {
    fetchCourses();
    
    // Auto-populate user data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) {
      setFormData(prev => ({
        ...prev,
        lead_owner: user.name,
        branch: user.branch || ''
      }));
    }

    // Populate existing lead data if editing
    if (existingLead) {
      setFormData(prev => ({
        ...prev,
        ...existingLead
      }));
      setLeadType(existingLead.lead_type || 'company');
    }
  }, [existingLead]);

  useEffect(() => {
    // Recalculate lead score when relevant fields change
    if (formData.course_id || formData.num_trainees || formData.lead_value) {
      const newScore = calculateLeadScore(formData);
      setFormData(prev => ({ ...prev, lead_score: newScore }));
    }
  }, [formData.course_id, formData.num_trainees, formData.lead_value, formData.urgency, formData.training_date]);

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

  // Intelligent Lead Scoring Algorithm (Hybrid Approach) - From EnhancedLeadForm
  const calculateLeadScore = (data) => {
    let points = 50; // Start at 50 (Warm baseline)
    
    // Factor 1: Urgency (30 points range)
    if (data.urgency === 'high') points += 30;
    else if (data.urgency === 'medium') points += 10;
    else if (data.urgency === 'low') points -= 20;
    
    // Factor 2: Deal Size (20 points range)
    const value = parseFloat(data.lead_value) || 0;
    if (value > 50000) points += 20;
    else if (value > 20000) points += 10;
    else if (value < 5000) points -= 10;
    
    // Factor 3: Number of Trainees (20 points range)
    const trainees = parseInt(data.num_trainees) || 0;
    if (trainees >= 20) points += 20;
    else if (trainees >= 10) points += 10;
    else if (trainees < 5) points -= 10;
    
    // Factor 4: Lead Category (30 points range)
    if (data.lead_category === 'Hot') points += 30;
    else if (data.lead_category === 'Warm') points += 10;
    else if (data.lead_category === 'Cold') points -= 20;
    else if (data.lead_category === 'Qualified') points += 15;
    
    // Factor 5: Lead Source (15 points range)
    if (data.source === 'Referral') points += 15;
    else if (data.source === 'Walk-in') points += 10;
    else if (data.source === 'Website') points += 5;
    else if (data.source === 'Cold Call') points -= 5;
    
    // Factor 6: Company Size (10 points range)
    if (data.employee_count === '500+') points += 10;
    else if (data.employee_count === '201-500') points += 5;
    else if (data.employee_count === '1-10') points -= 5;
    
    // Convert points to Hot/Warm/Cold
    if (points >= 80) return 'hot';
    if (points <= 35) return 'cold';
    return 'warm';
  };

  const handleCourseChange = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const numTrainees = parseInt(formData.num_trainees) || 1;
      const baseFee = parseFloat(course.base_fee) || 0;
      
      // Calculate lead value based on pricing tiers
      let pricePerTrainee = baseFee;
      if (numTrainees >= 10) {
        pricePerTrainee = parseFloat(course.pricing_tiers?.group_10_plus || baseFee * 0.8);
      } else if (numTrainees >= 5) {
        pricePerTrainee = parseFloat(course.pricing_tiers?.group_5_10 || baseFee * 0.9);
      }
      
      const leadValue = (pricePerTrainee * numTrainees).toFixed(0);
      
      // Calculate intelligent lead score
      const updatedData = {
        ...formData,
        course_id: courseId,
        course_name: course.name,
        lead_value: leadValue
      };
      const leadScore = calculateLeadScore(updatedData);
      
      setFormData({
        ...updatedData,
        lead_score: leadScore
      });
    }
  };

  const handleTraineesChange = (value) => {
    const numTrainees = parseInt(value) || 1;
    setFormData(prev => ({ ...prev, num_trainees: numTrainees }));
    
    // Recalculate lead value if course is selected
    if (formData.course_id) {
      handleCourseChange(formData.course_id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const endpoint = existingLead ? 
        `${API}/sales/leads/${existingLead.id}` : 
        `${API}/sales/leads`;
      
      const method = existingLead ? 'put' : 'post';
      
      await axios[method](endpoint, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(existingLead ? 'Lead updated successfully!' : 'Lead created successfully!');
      
      // Reset form
      setFormData({
        lead_type: 'company',
        source: 'Self',
        lead_owner: '',
        lead_category: '',
        company_name: '',
        contact_person: '',
        contact_designation: '',
        phone: '',
        contact_mobile: '',
        contact_email: '',
        website: '',
        industry: '',
        employee_count: '',
        client_name: '',
        client_mobile: '',
        client_email: '',
        first_name: '',
        last_name: '',
        training_service_details: '',
        product_services_required: '',
        course_id: '',
        course_name: '',
        num_trainees: 1,
        training_site: '',
        training_location: '',
        training_date: '',
        requirement: '',
        urgency: 'medium',
        payment_mode: '',
        payment_terms: '',
        remarks: '',
        description: '',
        next_followup_date: '',
        branch: '',
        lead_value: '0',
        lead_score: 0,
        status: 'New',
        field_sales_type: ''
      });
      
      setLeadType('company');
      
      // Close dialog based on mode
      if (mode === 'enhanced' && onOpenChange) {
        onOpenChange(false);
      } else if (mode === 'self') {
        setShowDialog(false);
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error(error.response?.data?.detail || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  const getLeadScoreBadge = (score) => {
    const config = {
      hot: { color: 'bg-red-500/20 text-red-300 border-red-400/50', icon: '🔥' },
      warm: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50', icon: '🌡️' },
      cold: { color: 'bg-blue-500/20 text-blue-300 border-blue-400/50', icon: '❄️' }
    };
    const { color, icon } = config[score] || config.warm;
    return <Badge className={color}>{icon} {score.toUpperCase()}</Badge>;
  };

  // Form content (same for both modes)
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Lead Metadata Section */}
      <div className="space-y-4 p-4 bg-purple-500/10 border border-purple-400/30 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-200">Lead Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Lead Owner (Sales Rep) *</Label>
            <Input
              value={formData.lead_owner}
              onChange={(e) => setFormData({...formData, lead_owner: e.target.value})}
              placeholder="Auto-filled with your name"
              className="bg-slate-800 border-white/10 text-slate-100"
              required
              readOnly
            />
          </div>
          <div>
            <Label className="text-slate-300">Lead Source</Label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2"
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
            <Label className="text-slate-300">Lead Category</Label>
            <select
              value={formData.lead_category}
              onChange={(e) => setFormData({ ...formData, lead_category: e.target.value })}
              className="w-full bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2"
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

      {/* Lead Type Selector */}
      <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
        <button
          type="button"
          onClick={() => {
            setLeadType('company');
            setFormData(prev => ({ ...prev, lead_type: 'company' }));
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
            leadType === 'company'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company
        </button>
        <button
          type="button"
          onClick={() => {
            setLeadType('individual');
            setFormData(prev => ({ ...prev, lead_type: 'individual' }));
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
            leadType === 'individual'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          Individual
        </button>
      </div>

      {/* Field Sales Type (Self mode only) */}
      {showFieldType && mode === 'self' && (
        <div>
          <Label className="text-white">Field Sales Type</Label>
          <Select
            value={formData.field_sales_type}
            onValueChange={(val) => setFormData(prev => ({ ...prev, field_sales_type: val }))}
          >
            <SelectTrigger className="bg-slate-800 border-white/10 text-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="new">New Lead</SelectItem>
              <SelectItem value="followup">Follow-up</SelectItem>
              <SelectItem value="conversion">Conversion</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Company Fields */}
      {leadType === 'company' && (
        <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-200">Company Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-slate-300">Company Name *</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="ABC Corporation"
                className="bg-slate-800 border-white/10 text-slate-100"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Point of Contact *</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="John Smith"
                className="bg-slate-800 border-white/10 text-slate-100"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Designation *</Label>
              <Input
                value={formData.contact_designation}
                onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
                placeholder="HR Manager"
                className="bg-slate-800 border-white/10 text-slate-100"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Contact Mobile *</Label>
              <Input
                value={formData.contact_mobile}
                onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                placeholder="971xxxxxxxxx"
                className="bg-slate-800 border-white/10 text-slate-100"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="971xxxxxxxxx"
                className="bg-slate-800 border-white/10 text-slate-100"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Contact Email</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="john@company.com"
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-300">Website</Label>
              <Input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.company.com"
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>
            <div>
              <Label className="text-slate-300">Industry</Label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2"
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
              <Label className="text-slate-300">Employee Count</Label>
              <select
                value={formData.employee_count}
                onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                className="w-full bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2"
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

      {/* Individual Lead Fields */}
      {leadType === 'individual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Client Name *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="Enter full name"
                required
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Mobile *</Label>
              <Input
                value={formData.client_mobile}
                onChange={(e) => setFormData(prev => ({ ...prev, client_mobile: e.target.value }))}
                placeholder="971XXXXXXXXX"
                required
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
          </div>
          <div>
            <Label className="text-white">Email</Label>
            <Input
              type="email"
              value={formData.client_email}
              onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
              placeholder="client@email.com"
              className="bg-slate-800 border-white/10 text-white"
            />
          </div>
        </div>
      )}

      {/* Training Details (Common) */}
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Training Details</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Course *</Label>
            <Select
              value={formData.course_id}
              onValueChange={handleCourseChange}
            >
              <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10 max-h-60">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white">Number of Trainees *</Label>
            <Input
              type="number"
              value={formData.num_trainees}
              onChange={(e) => handleTraineesChange(e.target.value)}
              min="1"
              required
              className="bg-slate-800 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Training Site</Label>
            <Select
              value={formData.training_site}
              onValueChange={(val) => setFormData(prev => ({ ...prev, training_site: val }))}
            >
              <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="onsite">Onsite</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white">Training Location</Label>
            <Input
              value={formData.training_location}
              onChange={(e) => setFormData(prev => ({ ...prev, training_location: e.target.value }))}
              placeholder="Enter location"
              className="bg-slate-800 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Preferred Training Date</Label>
            <Input
              type="date"
              value={formData.training_date}
              onChange={(e) => setFormData(prev => ({ ...prev, training_date: e.target.value }))}
              className="bg-slate-800 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white">Urgency</Label>
            <Select
              value={formData.urgency}
              onValueChange={(val) => setFormData(prev => ({ ...prev, urgency: val }))}
            >
              <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-white">Requirements / Notes</Label>
          <Textarea
            value={formData.requirement}
            onChange={(e) => setFormData(prev => ({ ...prev, requirement: e.target.value }))}
            placeholder="Enter any specific requirements or notes"
            className="bg-slate-800 border-white/10 text-white"
            rows={3}
          />
        </div>
      </div>

      {/* Lead Score Display */}
      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">Lead Score:</span>
          <Badge className={`text-lg ${
            formData.lead_score >= 80 ? 'bg-green-500/20 text-green-300 border-green-400/50' :
            formData.lead_score >= 60 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50' :
            'bg-red-500/20 text-red-300 border-red-400/50'
          }`}>
            {formData.lead_score}/100
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Estimated Value: AED {formData.lead_value || '0'}
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (mode === 'enhanced' && onOpenChange) onOpenChange(false);
            else if (mode === 'self') setShowDialog(false);
          }}
          className="border-white/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Saving...' : (existingLead ? 'Update Lead' : 'Create Lead')}
        </Button>
      </div>
    </form>
  );

  // Return based on mode
  if (mode === 'enhanced') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {existingLead ? 'Edit Lead' : 'Create New Lead'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Fill in the details below to create a new lead
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  } else {
    // Self mode - button that opens dialog
    return (
      <>
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Self Lead
        </Button>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Add Self Lead</DialogTitle>
              <DialogDescription className="text-slate-400">
                Create a new lead for your pipeline
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      </>
    );
  }
};

export default UnifiedLeadForm;
