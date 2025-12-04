import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainerCalendar = ({ onBookingRequest, selectedCourse, leadData }) => {
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    requested_date: '',
    num_trainees: leadData?.num_trainees || 1,
    company_name: leadData?.company_name || leadData?.client_name || '',
    contact_person: leadData?.contact_person || leadData?.client_name || '',
    contact_mobile: leadData?.contact_mobile || '',
    course_id: selectedCourse?.id || '',
    course_name: selectedCourse?.name || '',
    lead_id: leadData?.id || ''
  });

  useEffect(() => {
    fetchTrainers();
    fetchCourses();
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [currentMonth]);

  const fetchTrainers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/trainers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainers(response.data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

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

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/booking-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateAvailable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => {
      const bookingDate = booking.requested_date?.split('T')[0];
      return bookingDate === dateStr && booking.status !== 'rejected';
    });
  };

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setBookingData({
        ...bookingData,
        requested_date: date.toISOString().split('T')[0]
      });
      setBookingDialogOpen(true);
    }
  };

  const handleCourseChange = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setBookingData({
        ...bookingData,
        course_id: courseId,
        course_name: course.name
      });
    }
  };

  const handleBookingRequest = async () => {
    if (!bookingData.requested_date || !bookingData.company_name || !bookingData.course_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/booking-requests`, bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Booking request sent to Academic Head!');
      setBookingDialogOpen(false);
      if (onBookingRequest) onBookingRequest();
    } catch (error) {
      console.error('Error creating booking request:', error);
      toast.error(error.response?.data?.detail || 'Failed to create booking request');
    }
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-20" />);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isAvailable = isDateAvailable(date);
    const isToday = new Date().toDateString() === date.toDateString();
    const dayBookings = getBookingsForDate(date);
    const hasBookings = dayBookings.length > 0;
    
    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        disabled={!isAvailable}
        className={`h-24 p-2 rounded-lg border transition-all ${
          isToday ? 'border-blue-400 bg-blue-500/20' :
          hasBookings ? 'border-orange-400/50 bg-orange-500/10 hover:bg-orange-500/20' :
          isAvailable ? 'border-gray-300 bg-white hover:bg-white hover:border-gray-300' :
          'border-white/5 bg-gray-50/30 opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="text-left h-full flex flex-col">
          <div className={`text-sm font-semibold ${isAvailable ? 'text-gray-900' : 'text-slate-600'}`}>
            {day}
          </div>
          {hasBookings && (
            <div className="mt-1 space-y-1">
              {dayBookings.slice(0, 2).map((booking, idx) => (
                <div key={idx} className="text-xs truncate">
                  <Badge className="text-xs bg-orange-500/20 text-orange-300 border-orange-400/50 w-full justify-start">
                    {booking.course_name || 'Training'}
                  </Badge>
                </div>
              ))}
              {dayBookings.length > 2 && (
                <Badge className="text-xs bg-gray-100 text-gray-700 w-full">
                  +{dayBookings.length - 2} more
                </Badge>
              )}
            </div>
          )}
          {!hasBookings && isAvailable && (
            <Badge className="text-xs mt-auto bg-green-500/20 text-green-300 border-green-400/50">
              Available
            </Badge>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white0 backdrop-blur-sm rounded-xl border border-gray-300 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Trainer Availability Calendar
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className="border-gray-300 hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-4 py-2 text-gray-900 font-medium">{monthName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="border-gray-300 hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Trainers Info */}
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-slate-200">Available Trainers: {trainers.length}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {trainers.slice(0, 5).map((trainer, idx) => (
              <Badge key={idx} className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs">
                {trainer.name}
              </Badge>
            ))}
            {trainers.length > 5 && (
              <Badge className="bg-gray-100 text-gray-700 text-xs">
                +{trainers.length - 5} more
              </Badge>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
              {day}
            </div>
          ))}
          {days}
        </div>

        <div className="mt-4 p-3 bg-gray-50/50 rounded-lg border border-gray-300">
          <p className="text-xs text-gray-700 font-semibold mb-2">Calendar Legend:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500/20 border border-green-400/50"></div>
              <span className="text-gray-500">Available dates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-400/50"></div>
              <span className="text-gray-500">Scheduled trainings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-400"></div>
              <span className="text-gray-500">Today</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Click on an available date to request a booking. The Academic Head will review and confirm trainer assignment.
          </p>
        </div>
      </div>

      {/* Booking Request Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Request Training Booking</DialogTitle>
            <DialogDescription className="text-gray-500">
              Submit booking request for Academic Head approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Selected Date:</strong> {selectedDate?.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <div>
              <Label className="text-gray-700">Select Course *</Label>
              <select
                value={bookingData.course_id}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md p-2"
                required
              >
                <option value="">Choose a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} - {course.duration} ({course.base_fee} AED)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-gray-700">Company/Client Name *</Label>
              <Input
                value={bookingData.company_name}
                onChange={(e) => setBookingData({ ...bookingData, company_name: e.target.value })}
                className="bg-gray-50 border-gray-300 text-gray-900"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label className="text-gray-700">Contact Person *</Label>
              <Input
                value={bookingData.contact_person}
                onChange={(e) => setBookingData({ ...bookingData, contact_person: e.target.value })}
                className="bg-gray-50 border-gray-300 text-gray-900"
                placeholder="Enter contact name"
              />
            </div>

            <div>
              <Label className="text-gray-700">Contact Mobile *</Label>
              <Input
                value={bookingData.contact_mobile}
                onChange={(e) => setBookingData({ ...bookingData, contact_mobile: e.target.value })}
                className="bg-gray-50 border-gray-300 text-gray-900"
                placeholder="971xxxxxxxxx"
              />
            </div>

            <div>
              <Label className="text-gray-700">Number of Trainees</Label>
              <Input
                type="number"
                min="1"
                value={bookingData.num_trainees}
                onChange={(e) => setBookingData({ ...bookingData, num_trainees: parseInt(e.target.value) || 1 })}
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setBookingDialogOpen(false)}
                className="flex-1 border-gray-300 hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookingRequest}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerCalendar;
