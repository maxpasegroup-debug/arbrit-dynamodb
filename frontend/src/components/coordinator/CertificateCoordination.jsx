import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Send, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificateCoordination = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertificates(response.data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-400/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50';
      case 'delivered': return 'bg-blue-500/20 text-blue-400 border-blue-400/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/50';
    }
  };

  const handleMarkDelivered = async (certificateId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/academic/certificates/${certificateId}/deliver`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Certificate marked as delivered');
      fetchCertificates();
    } catch (error) {
      console.error('Error updating certificate:', error);
      toast.error('Failed to update certificate status');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading certificates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Certificate Coordination</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Coordinate certificate delivery and tracking</p>
        </CardHeader>
        <CardContent className="p-6">
          {certificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No certificates to coordinate</p>
              <p className="text-sm text-gray-500 mt-2">Approved certificates will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <Card key={cert.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-yellow-500/20 p-2 rounded-lg">
                            <Award className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{cert.course_name}</h3>
                            <p className="text-sm text-gray-400">{cert.client_name}</p>
                          </div>
                        </div>
                        <div className="ml-12 space-y-1 text-sm text-gray-300">
                          <p>WO Ref: {cert.wo_ref_no}</p>
                          <p>Requested: {new Date(cert.requested_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(cert.status)}>
                          {cert.status}
                        </Badge>
                        {cert.status?.toLowerCase() === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkDelivered(cert.id)}
                            className="bg-blue-500/20 text-blue-400 border border-blue-400/50 hover:bg-blue-500/30"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Mark Delivered
                          </Button>
                        )}
                        {cert.status?.toLowerCase() === 'delivered' && (
                          <div className="flex items-center gap-2 text-green-400">
                            <Check className="w-4 h-4" />
                            <span className="text-sm">Delivered</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateCoordination;
