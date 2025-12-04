import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, MapPin, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssistantProfile = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ today: 0, week: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API}/hrm/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allEmployees = response.data || [];
      const myProfile = allEmployees.find(emp => emp.mobile === user.mobile);
      setProfile(myProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dispatch/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTasks = response.data || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const delivered = allTasks.filter(task => task.status === 'DELIVERED');
      
      const todayCount = delivered.filter(task => {
        const deliveredDate = new Date(task.delivered_at);
        return deliveredDate >= today;
      }).length;
      
      const weekCount = delivered.filter(task => {
        const deliveredDate = new Date(task.delivered_at);
        return deliveredDate >= weekAgo;
      }).length;
      
      setStats({
        today: todayCount,
        week: weekCount,
        total: delivered.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-white text-xl">My Profile</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="bg-yellow-500/20 p-4 rounded-full">
              <User className="w-12 h-12 text-yellow-400" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{profile?.name || 'N/A'}</h3>
                <p className="text-gray-400">Dispatch Assistant</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{profile?.mobile || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{profile?.branch || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Delivery Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-blue-500/10 border-blue-400/30">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{stats.today}</p>
                <p className="text-sm text-gray-300 mt-1">Today</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-400/30">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{stats.week}</p>
                <p className="text-sm text-gray-300 mt-1">This Week</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-400/30">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">{stats.total}</p>
                <p className="text-sm text-gray-300 mt-1">Total</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssistantProfile;
