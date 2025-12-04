import { useState, useEffect } from 'react';
import { Award, Download, Send, CheckCircle, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificateGeneration = () => {
  const [completedTrainings, setCompletedTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedTrainings();
  }, []);

  const fetchCompletedTrainings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/training-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const completed = (response.data || []).filter(t => 
        t.status === 'Completed' || t.progress_percentage === 100
      );
      setCompletedTrainings(completed);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async (training) => {
    toast.info('Certificate generation feature will be available soon');
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Certificate Generation</h2>
        <p className="text-gray-300">Generate and manage training certificates</p>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Completed Trainings</h3>
        
        {completedTrainings.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No completed trainings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedTrainings.map((training) => (
              <div key={training.id} className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{training.client_name}</h4>
                  <p className="text-sm text-gray-400">{training.course_name} - {training.number_of_participants} participants</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleGenerateCertificate(training)} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
                    <FileText className="w-4 h-4 mr-1" />
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateGeneration;