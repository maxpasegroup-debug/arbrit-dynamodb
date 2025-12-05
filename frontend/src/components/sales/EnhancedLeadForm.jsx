import { useState, useEffect } from 'react';
import { Building2, User, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

const EnhancedLeadForm = ({ open, onOpenChange, onSuccess, existingLead = null }) => {
  const [courses, setCourses] = useState([]);
  const [leadType, setLeadType] = useState('company');
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
    contact_email: '',
    website: '',
    industry: '',
    employee_count: '',
    // Individual fields
    client_name: '',
    client_mobile: '',
    client_email: '',
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
    // Payment
    payment_mode: '',
    payment_terms: '',
    // Additional
    remarks: '',
    description: '',
    next_followup_date: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (existingLead) {
      setFormData({
        lead_type: existingLead.lead_type || 'company',
        source: existingLead.source || 'Self',
        first_name: existingLead.first_name || '',
        last_name: existingLead.last_name || '',
        lead_owner: existingLead.lead_owner || '',
        lead_category: existingLead.lead_category || '',
        company_name: existingLead.company_name || '',
        phone: existingLead.phone || '',
        contact_person: existingLead.contact_person || '',
        contact_designation: existingLead.contact_designation || '',
        contact_mobile: existingLead.contact_mobile || '',
        contact_email: existingLead.contact_email || '',
        website: existingLead.website || '',
        client_name: existingLead.client_name || '',
        employee_count: existingLead.employee_count || '',
        training_service_details: existingLead.training_service_details || '',
        product_services_required: existingLead.product_services_required || '',
        course_id: existingLead.course_id || '',
        course_name: existingLead.course_name || '',
        num_trainees: existingLead.num_trainees || 1,
        training_site: existingLead.training_site || '',
        training_location: existingLead.training_location || '',
        training_date: existingLead.training_date || '',
        requirement: existingLead.requirement || '',
        industry: existingLead.industry || '',
        urgency: existingLead.urgency || 'medium',
        payment_mode: existingLead.payment_mode || '',
        payment_terms: existingLead.payment_terms || '',
        remarks: existingLead.remarks || '',
        description: existingLead.description || '',
        next_followup_date: existingLead.next_followup_date || ''
      });
      setLeadType(existingLead.lead_type || 'company');
    }
  }, [existingLead]);

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

  useEffect(() => {
    // Set lead owner to current user by default
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name && !formData.lead_owner) {
      setFormData(prev => ({ ...prev, lead_owner: user.name }));
    }
  }, []);

  // Recalculate lead score when relevant factors change
  useEffect(() => {
    if (formData.course_id) {
      const newScore = calculateLeadScore(formData);
      if (newScore !== formData.lead_score) {
        setFormData(prev => ({ ...prev, lead_score: newScore }));
      }
    }
  }, [formData.urgency, formData.num_trainees, formData.lead_category, formData.source, formData.employee_count]);

  // Intelligent Lead Scoring Algorithm (Hybrid Approach)
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (leadType === 'company' && !formData.company_name) {
      toast.error('Company name is required');
      return;
    }
    if (leadType === 'company' && !formData.contact_person) {
      toast.error('Contact person is required');
      return;
    }
    if (leadType === 'individual' && !formData.client_name) {
      toast.error('Client name is required');
      return;
    }
    if (!formData.course_id) {
      toast.error('Please select a course');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        client_name: leadType === 'company' ? formData.company_name : formData.client_name,
        lead_type: leadType
      };

      if (existingLead) {
        await axios.put(`${API}/sales-head/leads/${existingLead.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Lead updated successfully!');
      } else {
        await axios.post(`${API}/sales-head/leads`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Lead created successfully!');
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error(error.response?.data?.detail || 'Failed to save lead');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-900 border-white/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {existingLead ? 'Edit Lead' : 'Create New Lead'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Enhanced lead capture with intelligent scoring
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lead Metadata */}
          <div className="space-y-4 p-4 bg-purple-500/10 border border-purple-400/30 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200">Lead Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Lead Owner (Sales Rep) *</Label>
                <Input
                  value={formData.lead_owner}
                  onChange={(e) => setFormData({ ...formData, lead_owner: e.target.value })}
                  placeholder="Auto-filled with your name"
                  className="bg-slate-900 border-white/20 text-slate-100"
                  required
                  readOnly
                />
              </div>
              <div>
                <Label className="text-slate-300">Lead Source</Label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-slate-900 border border-white/20 text-slate-100 rounded-md p-2"
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
                  className="w-full bg-slate-900 border border-white/20 text-slate-100 rounded-md p-2"
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
                leadType === 'company'
                  ? 'bg-blue-600 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Company
            </button>
            <button
              type="button"
              onClick={() => setLeadType('individual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                leadType === 'individual'
                  ? 'bg-blue-600 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              Individual
            </button>
          </div>

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
                    className="bg-slate-900 border-white/20 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Point of Contact *</Label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="John Smith"
                    className="bg-slate-900 border-white/20 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Designation *</Label>
                  <Input
                    value={formData.contact_designation}
                    onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
                    placeholder="HR Manager"
                    className="bg-slate-900 border-white/20 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Contact Mobile *</Label>
                  <Input
                    value={formData.contact_mobile}
                    onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                    placeholder="971xxxxxxxxx"
                    className="bg-slate-900 border-white/20 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="971xxxxxxxxx"
                    className="bg-slate-900 border-white/20 text-slate-100"
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
                    className="bg-slate-900 border-white/20 text-slate-100"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-300">Website</Label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.company.com"
                    className="bg-slate-900 border-white/20 text-slate-100"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Industry</Label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-slate-900 border border-white/20 text-slate-100 rounded-md p-2"
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
                    className="w-full bg-slate-900 border border-white/20 text-slate-100 rounded-md p-2"
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

          {/* Individual Fields */}
          {leadType === 'individual' && (
            <div className="space-y-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-200">Client Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-300">Client Full Name *</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="John Doe"
                    className="bg-slate-900 border-white/20 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Mobile Number *</Label>
                  <Input
                    value={formData.client_mobile}
                    onChange={(e) => setFormData({ ...formData, client_mobile: e.target.value })}
                    placeholder="971xxxxxxxxx"
                    className="bg-slate-900 border-white/20 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Email Address</Label>
                  <Input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="john@email.com"
                    className="bg-slate-900 border-white/20 text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Course & Training Details */}
          <div className="space-y-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200">Training Requirements</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-300">Training/Service Details</Label>
                <Input
                  value={formData.training_service_details}
                  onChange={(e) => setFormData({ ...formData, training_service_details: e.target.value })}
                  placeholder="Brief description of training needs"
                  className="bg-slate-900 border-white/20 text-slate-100"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-300">Product/Services Required</Label>
                <Input
                  value={formData.product_services_required}
                  onChange={(e) => setFormData({ ...formData, product_services_required: e.target.value })}
                  placeholder="Specific products or services needed"
                  className="bg-slate-900 border-white/20 text-slate-100"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-300">Select Training Program *</Label>
                <select
                  value={formData.course_id}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 text-slate-100 rounded-md p-2"
                  required
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
                <Label className="text-slate-300">Number of Participants</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.num_trainees}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, num_trainees: parseInt(val) || 1 });
                    if (formData.course_id) handleCourseChange(formData.course_id);
                  }}
                  className="bg-slate-900 border-white/20 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Training Date</Label>
                <Input
                  type="date"
                  value={formData.training_date}
                  onChange={(e) => setFormData({ ...formData, training_date: e.target.value })}
                  className="bg-slate-900 border-white/20 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Training Site</Label>
                <Input
                  value={formData.training_site}
                  onChange={(e) => setFormData({ ...formData, training_site: e.target.value })}
                  placeholder="On-site / Off-site"
                  className="bg-slate-900 border-white/20 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Training Location</Label>
                <Input
                  value={formData.training_location}
                  onChange={(e) => setFormData({ ...formData, training_location: e.target.value })}
                  placeholder="City, Country"
                  className="bg-slate-900 border-white/20 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200">Payment Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Payment Mode</Label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full bg-slate-900 border border-white/20 text-slate-100 rounded-md p-2"
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
                <Label className="text-slate-300">Payment Terms</Label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full bg-slate-900 border border-white/20 text-slate-100 rounded-md p-2"
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

          {/* Auto-Calculated Lead Score Display */}
          {formData.lead_score && (
            <div className={`p-4 rounded-lg border ${
              formData.lead_score === 'hot' ? 'bg-red-500/10 border-red-400/30' :
              formData.lead_score === 'warm' ? 'bg-orange-500/10 border-orange-400/30' :
              'bg-blue-500/10 border-blue-400/30'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Auto-Calculated Lead Score</p>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-lg px-4 py-1 ${
                      formData.lead_score === 'hot' ? 'bg-red-500/20 text-red-300 border-red-400/50' :
                      formData.lead_score === 'warm' ? 'bg-orange-500/20 text-orange-300 border-orange-400/50' :
                      'bg-blue-500/20 text-blue-300 border-blue-400/50'
                    }`}>
                      {formData.lead_score === 'hot' ? '🔥 HOT' :
                       formData.lead_score === 'warm' ? '🟡 WARM' :
                       '🔵 COLD'} LEAD
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Based on:</p>
                  <p>• Urgency • Deal Size • Trainees</p>
                  <p>• Category • Source • Company Size</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-4 p-4 bg-slate-9000 border border-white/20 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200">Additional Information</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-slate-300">Remarks & Description</Label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-slate-900 border border-white/20 text-slate-100 rounded-md p-2 min-h-[80px]"
                  placeholder="Any remarks or special notes..."
                />
              </div>
              <div>
                <Label className="text-slate-300">Description</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-white/20 text-slate-100 rounded-md p-2 min-h-[80px]"
                  placeholder="Detailed description of requirements..."
                />
              </div>
            </div>
          </div>

          {/* Lead Intelligence */}
          {formData.course_id && (
            <div className="p-4 bg-purple-500/10 border border-purple-400/30 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">Lead Intelligence</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Estimated Value</p>
                  <p className="text-xl font-bold text-green-400">{formData.lead_value || 0} AED</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Lead Score</p>
                  {getLeadScoreBadge(formData.lead_score || 'warm')}
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Urgency</p>
                  <Badge className={
                    formData.urgency === 'high' ? 'bg-red-500/20 text-red-300 border-red-400/50' :
                    formData.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50' :
                    'bg-blue-500/20 text-blue-300 border-blue-400/50'
                  }>
                    {formData.urgency?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/20 hover:bg-white"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              {existingLead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedLeadForm;
