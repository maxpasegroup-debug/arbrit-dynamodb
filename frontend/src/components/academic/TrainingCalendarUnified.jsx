import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronRight,
  User,
  FileText,
  Building,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainingCalendarUnified = () => {
  const [requests, setRequests] = useState([]);
  const [scheduledTrainings, setScheduledTrainings] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    // Step 2: Schedule
    training_date: '',
    training_time: '09:00',
    training_duration: '8',
    location: '',
    
    // Step 3: Trainer
    trainer_id: '',
    trainer_name: '',
    trainer_type: 'full-time',
    
    // Step 4: Work Order
    work_order_notes: '',
    special_requirements: '',
    
    // Final
    status: 'Approved'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [requestsRes, trainingsRes, trainersRes] = await Promise.all([
        axios.get(`${API}/booking-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/academic/trainings`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/hrm/employees`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setRequests(requestsRes.data.filter(r => r.status === 'pending') || []);
      setScheduledTrainings(trainingsRes.data || []);
      
      const trainersList = trainersRes.data.filter(e => 
        e.designation?.includes('Trainer') || 
        e.designation?.includes('TRAINER') ||
        e.role?.includes('Trainer')
      );
      setTrainers(trainersList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWizard = (request) => {
    setSelectedRequest(request);
    setCurrentStep(1);
    setWizardData({
      training_date: request.requested_date || '',
      training_time: '09:00',
      training_duration: '8',
      location: request.training_location || '',
      trainer_id: '',
      trainer_name: '',
      trainer_type: 'full-time',
      work_order_notes: '',
      special_requirements: '',
      status: 'Approved'
    });
    setWizardOpen(true);
  };

  const nextStep = () => {
    if (currentStep === 2 && (!wizardData.training_date || !wizardData.location)) {
      toast.error('Please fill in date and location');
      return;
    }
    if (currentStep === 3 && !wizardData.trainer_id) {
      toast.error('Please select a trainer');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleReject = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/booking-requests/${requestId}`,
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Request rejected');
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const submitWizard = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Update booking request
      await axios.put(
        `${API}/booking-requests/${selectedRequest.id}`,
        { 
          status: 'approved',
          training_date: wizardData.training_date,
          training_time: wizardData.training_time,
          location: wizardData.location,
          trainer_id: wizardData.trainer_id,
          trainer_name: wizardData.trainer_name
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Create training record
      await axios.post(
        `${API}/academic/trainings`,
        {
          booking_request_id: selectedRequest.id,
          company_name: selectedRequest.company_name,
          course_name: selectedRequest.course_name,
          training_date: wizardData.training_date,
          training_time: wizardData.training_time,
          training_duration: wizardData.training_duration,
          location: wizardData.location,
          number_of_participants: selectedRequest.number_of_participants,
          trainer_id: wizardData.trainer_id,
          trainer_name: wizardData.trainer_name,
          trainer_type: wizardData.trainer_type,
          work_order_notes: wizardData.work_order_notes,
          special_requirements: wizardData.special_requirements,
          status: 'Scheduled'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Training scheduled successfully!');
      setWizardOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error scheduling training:', error);
      toast.error('Failed to schedule training');
    }
  };

  const getStepTitle = (step) => {
    const titles = {
      1: 'Review Details',
      2: 'Schedule Date & Time',
      3: 'Allocate Trainer',
      4: 'Work Order Details',
      5: 'Confirm & Send'
    };
    return titles[step];
  };

  return (
    <div className="space-y-6">
      {/* Pending Requests Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">📋 Pending Booking Requests</h2>
            <p className="text-sm text-slate-400">Review and approve training requests from sales team</p>
          </div>
          <Badge className="bg-yellow-500/30 text-yellow-200 text-lg px-4 py-2">
            {requests.length} Pending
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No pending requests</p>
            <p className="text-sm">All requests have been processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-slate-800/50 rounded-lg p-6 border border-white/10 hover:border-yellow-500/30 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    {/* Company & Course */}
                    <div className="flex items-start gap-4">
                      <Building className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{request.company_name}</h3>
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          {request.course_name}
                        </p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 pl-9">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Users className="w-4 h-4 text-green-400" />
                        {request.number_of_participants} Participants
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <CalendarIcon className="w-4 h-4 text-purple-400" />
                        {new Date(request.requested_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPin className="w-4 h-4 text-red-400" />
                        {request.training_location || 'Not specified'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <User className="w-4 h-4 text-cyan-400" />
                        {request.contact_person || 'N/A'}
                      </div>
                    </div>

                    {/* Contact Info */}
                    {(request.contact_mobile || request.contact_email) && (
                      <div className="flex items-center gap-4 pl-9 text-xs text-slate-400">
                        {request.contact_mobile && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {request.contact_mobile}
                          </div>
                        )}
                        {request.contact_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {request.contact_email}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => startWizard(request)}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Review & Approve
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      variant="outline"
                      className="border-red-400/50 text-red-300 hover:bg-red-500/20"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Trainings Calendar */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">📅 Scheduled Trainings Calendar</h2>
            <p className="text-sm text-slate-400">All approved and scheduled trainings</p>
          </div>
          <Badge className="bg-green-500/30 text-green-200 text-lg px-4 py-2">
            {scheduledTrainings.length} Scheduled
          </Badge>
        </div>

        {scheduledTrainings.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No scheduled trainings</p>
            <p className="text-sm">Approved requests will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledTrainings.map((training) => (
              <div
                key={training.id}
                className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-4 border border-green-500/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-white text-sm">{training.company_name}</h4>
                  <Badge className="bg-green-500/30 text-green-200 text-xs">Scheduled</Badge>
                </div>
                
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-yellow-400" />
                    {training.course_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3 h-3 text-purple-400" />
                    {new Date(training.training_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-blue-400" />
                    {training.training_time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-red-400" />
                    {training.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-cyan-400" />
                    {training.trainer_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Training Approval - Step {currentStep} of 5
            </DialogTitle>
            <p className="text-slate-400">{getStepTitle(currentStep)}</p>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step <= currentStep
                          ? 'bg-yellow-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {step}
                    </div>
                    {step < 5 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          step < currentStep ? 'bg-yellow-500' : 'bg-slate-700'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="bg-white/5 rounded-lg p-6 min-h-[300px]">
                {/* Step 1: Review Details */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Review Request Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Company</p>
                        <p className="text-white font-semibold">{selectedRequest.company_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Course</p>
                        <p className="text-white font-semibold">{selectedRequest.course_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Participants</p>
                        <p className="text-white">{selectedRequest.number_of_participants}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Requested Date</p>
                        <p className="text-white">
                          {new Date(selectedRequest.requested_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Location</p>
                        <p className="text-white">{selectedRequest.training_location || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Contact Person</p>
                        <p className="text-white">{selectedRequest.contact_person || 'N/A'}</p>
                      </div>
                    </div>
                    {selectedRequest.notes && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Notes</p>
                        <p className="text-white bg-white/5 p-3 rounded">{selectedRequest.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Schedule */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Schedule Date & Time</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Training Date *</Label>
                        <Input
                          type="date"
                          value={wizardData.training_date}
                          onChange={(e) => setWizardData({ ...wizardData, training_date: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Training Time *</Label>
                        <Input
                          type="time"
                          value={wizardData.training_time}
                          onChange={(e) => setWizardData({ ...wizardData, training_time: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Duration (hours)</Label>
                        <Input
                          type="number"
                          value={wizardData.training_duration}
                          onChange={(e) => setWizardData({ ...wizardData, training_duration: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Location *</Label>
                        <Input
                          value={wizardData.location}
                          onChange={(e) => setWizardData({ ...wizardData, location: e.target.value })}
                          placeholder="Training location"
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Allocate Trainer */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Allocate Trainer</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Trainer Type *</Label>
                        <Select
                          value={wizardData.trainer_type}
                          onValueChange={(v) => setWizardData({ ...wizardData, trainer_type: v })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                            <SelectItem value="full-time">Full-Time Trainer</SelectItem>
                            <SelectItem value="part-time">Part-Time / Outsourced Trainer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-300">Select Trainer *</Label>
                        <Select
                          value={wizardData.trainer_id}
                          onValueChange={(v) => {
                            const trainer = trainers.find(t => t.id === v);
                            setWizardData({
                              ...wizardData,
                              trainer_id: v,
                              trainer_name: trainer?.name || ''
                            });
                          }}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Select trainer" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                            {trainers.map(trainer => (
                              <SelectItem key={trainer.id} value={trainer.id}>
                                {trainer.name} - {trainer.designation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Work Order */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Work Order Details</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Work Order Notes</Label>
                        <Textarea
                          value={wizardData.work_order_notes}
                          onChange={(e) => setWizardData({ ...wizardData, work_order_notes: e.target.value })}
                          placeholder="Instructions for the trainer..."
                          rows={3}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Special Requirements</Label>
                        <Textarea
                          value={wizardData.special_requirements}
                          onChange={(e) => setWizardData({ ...wizardData, special_requirements: e.target.value })}
                          placeholder="Equipment, materials, etc..."
                          rows={3}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Confirm */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Confirm & Send</h3>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-green-300 mb-3">Summary</h4>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p><strong>Company:</strong> {selectedRequest.company_name}</p>
                        <p><strong>Course:</strong> {selectedRequest.course_name}</p>
                        <p><strong>Date:</strong> {wizardData.training_date}</p>
                        <p><strong>Time:</strong> {wizardData.training_time}</p>
                        <p><strong>Location:</strong> {wizardData.location}</p>
                        <p><strong>Trainer:</strong> {wizardData.trainer_name} ({wizardData.trainer_type})</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Clicking "Approve & Schedule" will:
                    </p>
                    <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                      <li>Approve the booking request</li>
                      <li>Create a scheduled training</li>
                      <li>Notify the trainer</li>
                      <li>Update the calendar</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="border-white/20 text-white"
                >
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setWizardOpen(false)}
                variant="outline"
                className="border-white/20 text-white"
              >
                Cancel
              </Button>
              {currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={submitWizard}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Schedule
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingCalendarUnified;
