import { useState, useEffect } from 'react';
import { QrCode, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import QRCode from 'qrcode';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssessmentQRGenerator = ({ userRole }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/assessment/forms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForms(response.data);
    } catch (error) {
      console.error('Error fetching forms:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (form) => {
    try {
      const publicUrl = `${window.location.origin}${form.qr_code_url}`;
      const qrData = await QRCode.toDataURL(publicUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrDataUrl(qrData);
      setSelectedForm(form);
      toast.success('QR Code generated!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `assessment-qr-${selectedForm.id}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success('QR Code downloaded!');
  };

  const copyLink = (url) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading forms...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">Generate QR Codes</h2>
        {userRole === 'Trainer' && (
          <Badge variant="outline" className="text-sm">
            You can only generate QR codes for your assigned sessions
          </Badge>
        )}
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">No assessment forms available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Forms List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Select Form</h3>
            {forms.map((form) => (
              <Card key={form.id} className="bg-slate-900/50 border border-white/10 hover:bg-white/5 transition-all cursor-pointer" onClick={() => generateQRCode(form)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{form.title}</CardTitle>
                      {form.description && (
                        <p className="text-sm text-slate-400 mt-1">{form.description}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); generateQRCode(form); }}>
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-400 space-y-1">
                    {form.course_name && (
                      <p><span className="font-medium">Course:</span> {form.course_name}</p>
                    )}
                    {form.batch_name && (
                      <p><span className="font-medium">Batch:</span> {form.batch_name}</p>
                    )}
                    {form.trainer_name && (
                      <p><span className="font-medium">Trainer:</span> {form.trainer_name}</p>
                    )}
                    {form.session_date && (
                      <p><span className="font-medium">Date:</span> {new Date(form.session_date).toLocaleDateString()}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); copyLink(form.qr_code_url); }}
                      >
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* QR Code Display */}
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-4">QR Code Preview</h3>
            {qrDataUrl && selectedForm ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{selectedForm.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="bg-slate-800 p-6 rounded-lg border-2 border-white/20 inline-block">
                    <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <div className="space-y-2">
                    <Button onClick={downloadQRCode} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`${window.location.origin}${selectedForm.qr_code_url}`, '_blank')}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Form
                    </Button>
                  </div>
                  <div className="text-sm text-slate-400">
                    <p>Students can scan this QR code to submit their feedback</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <QrCode className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400">Select a form to generate QR code</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentQRGenerator;