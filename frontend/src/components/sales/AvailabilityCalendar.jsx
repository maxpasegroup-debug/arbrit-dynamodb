import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Phone, Video, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AvailabilityCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState([
    { time: '09:00', status: 'available', activity: 'Open for calls' },
    { time: '10:00', status: 'busy', activity: 'Client meeting - ABC Corp' },
    { time: '11:00', status: 'busy', activity: 'Site visit - Downtown' },
    { time: '12:00', status: 'break', activity: 'Lunch break' },
    { time: '13:00', status: 'available', activity: 'Open for calls' },
    { time: '14:00', status: 'available', activity: 'Open for calls' },
    { time: '15:00', status: 'busy', activity: 'Training session' },
    { time: '16:00', status: 'available', activity: 'Follow-up calls' },
    { time: '17:00', status: 'available', activity: 'Open for calls' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'busy': return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'break': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      default: return 'bg-slate-8000/20 text-gray-400 border-gray-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <Phone className="w-4 h-4" />;
      case 'busy': return <Video className="w-4 h-4" />;
      case 'break': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const markAvailable = (time) => {
    setAvailability(prev => 
      prev.map(slot => 
        slot.time === time 
          ? { ...slot, status: 'available', activity: 'Open for calls' }
          : slot
      )
    );
    toast.success('Marked as available for calls');
  };

  const markBusy = (time) => {
    setAvailability(prev => 
      prev.map(slot => 
        slot.time === time 
          ? { ...slot, status: 'busy', activity: 'Busy - In call' }
          : slot
      )
    );
    toast.success('Marked as busy');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Call Availability Calendar
          </h3>
          <p className="text-slate-400">
            Manage your availability for client calls and meetings
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-300 font-medium">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-500/10 border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Available Slots</p>
                <p className="text-2xl font-bold text-green-300">
                  {availability.filter(slot => slot.status === 'available').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Video className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-red-400 font-semibold">Busy Slots</p>
                <p className="text-2xl font-bold text-red-300">
                  {availability.filter(slot => slot.status === 'busy').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-blue-400 font-semibold">Total Slots</p>
                <p className="text-2xl font-bold text-blue-300">{availability.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Availability Schedule */}
      <Card className="bg-slate-9000 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availability.map((slot, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-white/20"
            >
              <div className="flex items-center gap-4">
                <div className="text-slate-300 font-mono text-lg min-w-[60px]">
                  {slot.time}
                </div>
                <Badge className={`${getStatusColor(slot.status)} flex items-center gap-1`}>
                  {getStatusIcon(slot.status)}
                  {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                </Badge>
                <span className="text-slate-300">{slot.activity}</span>
              </div>
              
              <div className="flex gap-2">
                {slot.status !== 'available' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAvailable(slot.time)}
                    className="border-green-400/50 text-green-300 hover:bg-green-500/20"
                  >
                    Mark Available
                  </Button>
                )}
                {slot.status !== 'busy' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markBusy(slot.time)}
                    className="border-red-400/50 text-red-300 hover:bg-red-500/20"
                  >
                    Mark Busy
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-500/10 border-blue-400/30">
        <CardContent className="p-4">
          <h4 className="text-blue-300 font-semibold mb-2">How to Use:</h4>
          <ul className="text-blue-200 space-y-1 text-sm">
            <li>• Update your availability in real-time during calls</li>
            <li>• Colleagues can check your status before transferring calls</li>
            <li>• Green = Available for new client calls</li>
            <li>• Red = Busy with existing client or meeting</li>
            <li>• Orange = On break or unavailable</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailabilityCalendar;