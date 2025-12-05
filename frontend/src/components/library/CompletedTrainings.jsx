import { useState, useEffect } from 'react';
import { BookOpen, Award, Calendar, Users, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CompletedTrainings = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, certificates: 0 });

  useEffect(() => {
    fetchCompletedTrainings();
  }, []);

  const fetchCompletedTrainings = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch work orders for executive dashboard (MD/COO)
      const response = await axios.get(`${API}/executive/work-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data || [];
      const completed = data.filter(item => item.status === 'completed' || item.status === 'Completed');
      
      setTrainings(completed);
      
      // Calculate stats
      const thisMonth = completed.filter(t => {
        const date = new Date(t.completion_date || t.updated_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;
      
      setStats({
        total: completed.length,
        thisMonth,
        certificates: completed.filter(t => t.certificate_generated).length
      });
    } catch (error) {
      console.error('Error fetching completed trainings:', error);
      // Don't show error toast - just show empty state
      setTrainings([]);
      setStats({ total: 0, thisMonth: 0, certificates: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">Loading training history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          Arbrit&apos;s Journey - Completed Trainings
        </h2>
        <p className="text-slate-400 mt-1">Complete history of all training programs delivered</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">Total Trainings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-400">{stats.thisMonth}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">Certificates Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-400">{stats.certificates}</p>
          </CardContent>
        </Card>
      </div>

      {/* Training History */}
      <div className="space-y-4">
        {trainings.length === 0 ? (
          <Card className="bg-slate-900 border-white/10">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No completed trainings yet</p>
            </CardContent>
          </Card>
        ) : (
          trainings.map((training, idx) => (
            <Card key={idx} className="bg-slate-900 border-white/10 hover:bg-white transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-6 h-6 text-cyan-400" />
                      <h4 className="text-xl font-bold text-white">{training.course_name || 'Training Course'}</h4>
                      <Badge className="bg-green-500/20 text-green-300 border-green-400/50">
                        Completed
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm text-slate-300 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{training.num_trainees || 0} Participants</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{training.completion_date || training.updated_at || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-slate-400" />
                        <span>{training.certificate_generated ? 'Certificate Issued' : 'Pending'}</span>
                      </div>
                    </div>
                    
                    {training.client_name && (
                      <p className="text-slate-400 text-sm">Client: {training.client_name}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {training.certificate_generated && (
                      <Button size="sm" variant="outline" className="border-green-500/50 text-green-400">
                        <Download className="w-4 h-4 mr-2" />
                        Certificate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CompletedTrainings;