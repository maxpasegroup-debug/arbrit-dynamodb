import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, BookOpen, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AcademicCalendar = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [trainers, setTrainers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchTrainers();
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [currentMonth, selectedCourse]);

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

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/booking-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
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

  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.requested_date).toISOString().split('T')[0];
      if (selectedCourse !== 'all') {
        return bookingDate === dateStr && booking.course_id === selectedCourse;
      }
      return bookingDate === dateStr;
    });
  };

  const isDateAvailable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const getAvailabilityStatus = (date) => {
    const bookingsOnDate = getBookingsForDate(date);
    if (bookingsOnDate.length === 0) return 'available';
    if (bookingsOnDate.length >= trainers.length) return 'full';
    return 'partial';
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const selectedCourseName = selectedCourse === 'all' 
    ? 'All Courses' 
    : courses.find(c => c.id === selectedCourse)?.name || 'Unknown Course';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-8 h-8 text-blue-400" />
            Academic Calendar - Training Slots
          </h2>
          <p className="text-sm text-slate-400">Check available training slots for courses</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-gray-300">Available Slots</p>
              <p className="text-2xl font-bold text-white">
                {days.filter(d => d && isDateAvailable(d) && getAvailabilityStatus(d) === 'available').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-300">Partially Booked</p>
              <p className="text-2xl font-bold text-white">
                {days.filter(d => d && getAvailabilityStatus(d) === 'partial').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-300">Fully Booked</p>
              <p className="text-2xl font-bold text-white">
                {days.filter(d => d && getAvailabilityStatus(d) === 'full').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-gray-300">Active Trainers</p>
              <p className="text-2xl font-bold text-white">{trainers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Filter */}
      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 p-4">
        <div className="flex items-center gap-4">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <label className="text-sm text-gray-300 font-semibold">Filter by Course:</label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-80 bg-slate-800 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Badge className="bg-blue-500/30 text-blue-200 text-sm px-3 py-1">
              Viewing: {selectedCourseName}
            </Badge>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => navigateMonth(-1)}
            variant="outline"
            size="sm"
            className="border-white/20 hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="text-2xl font-bold text-white">
            {monthNames[month]} {year}
          </h3>
          
          <Button
            onClick={() => navigateMonth(1)}
            variant="outline"
            size="sm"
            className="border-white/20 hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const bookingsOnDate = getBookingsForDate(date);
            const isAvailable = isDateAvailable(date);
            const availabilityStatus = getAvailabilityStatus(date);
            
            let bgColor = 'bg-white';
            let borderColor = 'border-white/20';
            let textColor = 'text-slate-400';
            
            if (isAvailable) {
              if (availabilityStatus === 'available') {
                bgColor = 'bg-green-500/20';
                borderColor = 'border-green-500/50';
                textColor = 'text-green-300';
              } else if (availabilityStatus === 'partial') {
                bgColor = 'bg-yellow-500/20';
                borderColor = 'border-yellow-500/50';
                textColor = 'text-yellow-300';
              } else if (availabilityStatus === 'full') {
                bgColor = 'bg-red-500/20';
                borderColor = 'border-red-500/50';
                textColor = 'text-red-300';
              }
            }

            return (
              <div
                key={index}
                className={`aspect-square border rounded-lg p-2 ${bgColor} ${borderColor} hover:border-white/30 transition-all cursor-pointer`}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-sm font-semibold ${textColor}`}>
                    {date.getDate()}
                  </div>
                  
                  {bookingsOnDate.length > 0 && (
                    <div className="mt-auto space-y-1">
                      <div className="text-xs text-white flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {bookingsOnDate.length} booking{bookingsOnDate.length > 1 ? 's' : ''}
                      </div>
                      
                      {bookingsOnDate.slice(0, 2).map((booking, idx) => (
                        <div 
                          key={idx} 
                          className="text-xs bg-slate-900 rounded px-1 py-0.5 truncate"
                          title={`${booking.course_name} - ${booking.company_name}`}
                        >
                          {booking.course_name || 'Training'}
                        </div>
                      ))}
                      
                      {bookingsOnDate.length > 2 && (
                        <div className="text-xs text-slate-400">
                          +{bookingsOnDate.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                  
                  {bookingsOnDate.length === 0 && isAvailable && (
                    <div className="mt-auto text-xs text-center text-slate-400">
                      Available
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Legend:</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded"></div>
            <span className="text-sm text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/50 rounded"></div>
            <span className="text-sm text-gray-700">Partially Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded"></div>
            <span className="text-sm text-gray-700">Fully Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-900 border border-white/20 rounded"></div>
            <span className="text-sm text-gray-700">Past Date</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendar;
