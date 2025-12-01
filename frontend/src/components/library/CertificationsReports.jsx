import { useState, useEffect } from 'react';
import { Award, Calendar, AlertTriangle, CheckCircle, Clock, Download, FileText, TrendingUp, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificationsReports = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total_certificates: 0,
    expiring_soon: 0,
    expired: 0,
    active: 0
  });

  useEffect(() => {
    fetchCertificationData();
  }, []);

  const fetchCertificationData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch BOTH training library AND certificate tracking data
      const [libraryResponse, trackingResponse] = await Promise.all([
        axios.get(`${API}/training-library`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/certificate-tracking`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const libraryRecords = libraryResponse.data || [];
      const trackingRecords = trackingResponse.data || [];
      
      // Filter library records with certificates
      const certificateRecords = libraryRecords.filter(r => r.certificate_issued);
      
      // Combine with tracking records (for dispatch status)
      const combinedRecords = certificateRecords.map(cert => {
        // Find matching dispatch record
        const dispatchRecord = trackingRecords.find(
          track => track.company_name === cert.company_name && 
                   track.course_name === cert.course_name &&
                   track.training_date === cert.training_date
        );
        
        return {
          ...cert,
          dispatch_status: dispatchRecord?.status || 'not_dispatched',
          dispatch_id: dispatchRecord?.id || null,
          courier_service: dispatchRecord?.courier_service || null,
          tracking_number: dispatchRecord?.tracking_number || null
        };
      });
      
      // Also add tracking records that don't have library entries yet
      trackingRecords.forEach(track => {
        const exists = combinedRecords.some(
          cert => cert.company_name === track.company_name && 
                  cert.course_name === track.course_name &&
                  cert.training_date === track.training_date
        );
        
        if (!exists) {
          combinedRecords.push({
            id: track.id,
            company_name: track.company_name,
            contact_person: track.contact_person,
            contact_mobile: track.contact_mobile,
            course_name: track.course_name,
            training_date: track.training_date,
            participants_count: track.participants_count,
            certificate_issued: true,
            certificate_numbers: track.certificate_numbers || [],
            dispatch_status: track.status,
            dispatch_id: track.id,
            courier_service: track.courier_service,
            tracking_number: track.tracking_number
          });
        }
      });
      
      // Calculate statistics
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      let expiringSoon = 0;
      let expired = 0;
      let active = 0;
      
      combinedRecords.forEach(record => {
        const trainingDate = new Date(record.training_date);
        const expiryDate = new Date(trainingDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 3); // Assume 3-year validity
        
        if (expiryDate < today) {
          expired++;
        } else if (expiryDate <= thirtyDaysFromNow) {
          expiringSoon++;
        } else {
          active++;
        }
      });
      
      setStats({
        total_certificates: combinedRecords.length,
        expiring_soon: expiringSoon,
        expired: expired,
        active: active
      });
      
      setRecords(combinedRecords);
    } catch (error) {
      console.error('Error fetching certification data:', error);
      toast.error('Failed to load certification data');
    } finally {
      setLoading(false);
    }
  };

  const getCertificateStatus = (trainingDate) => {
    const training = new Date(trainingDate);
    const expiry = new Date(training);
    expiry.setFullYear(expiry.getFullYear() + 3);
    
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);
    
    if (expiry < today) {
      return { status: 'expired', color: 'red', label: 'Expired' };
    } else if (expiry <= thirtyDays) {
      return { status: 'expiring', color: 'orange', label: 'Expiring Soon' };
    } else {
      return { status: 'active', color: 'green', label: 'Active' };
    }
  };

  const exportCertificateReport = () => {
    const csv = [
      ['Company', 'Contact', 'Course', 'Training Date', 'Certificate Numbers', 'Expiry Date', 'Status'].join(','),
      ...records.map(r => {
        const training = new Date(r.training_date);
        const expiry = new Date(training);
        expiry.setFullYear(expiry.getFullYear() + 3);
        const status = getCertificateStatus(r.training_date);
        
        return [
          r.company_name,
          r.contact_person,
          r.course_name,
          r.training_date,
          (r.certificate_numbers || []).join(';'),
          expiry.toISOString().split('T')[0],
          status.label
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Certificate report exported!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Award className="w-8 h-8" />
              Certifications Status & Reports
            </h2>
            <p className="text-green-100 mt-1">Track certificate validity and expiration management</p>
          </div>
          <Button
            onClick={exportCertificateReport}
            className="bg-white text-green-600 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5" />
              <p className="text-sm text-green-100">Total Certificates</p>
            </div>
            <p className="text-3xl font-bold">{stats.total_certificates}</p>
          </div>
          <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-400/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm text-green-100">Active</p>
            </div>
            <p className="text-3xl font-bold text-green-200">{stats.active}</p>
          </div>
          <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5" />
              <p className="text-sm text-orange-100">Expiring Soon</p>
            </div>
            <p className="text-3xl font-bold text-orange-200">{stats.expiring_soon}</p>
          </div>
          <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-4 border border-red-400/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm text-red-100">Expired</p>
            </div>
            <p className="text-3xl font-bold text-red-200">{stats.expired}</p>
          </div>
        </div>
      </div>

      {/* Certificate List */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Certificate Tracking
        </h3>

        {loading ? (
          <p className="text-center py-12 text-slate-400">Loading certificates...</p>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No certificates issued yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const training = new Date(record.training_date);
              const expiry = new Date(training);
              expiry.setFullYear(expiry.getFullYear() + 3);
              const status = getCertificateStatus(record.training_date);
              
              return (
                <div
                  key={record.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Company</p>
                        <p className="font-semibold text-white">{record.company_name}</p>
                        <p className="text-sm text-slate-400">{record.contact_person}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Course</p>
                        <p className="text-sm text-slate-300">{record.course_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Training Date</p>
                        <p className="text-sm text-slate-300">{new Date(record.training_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Expiry Date</p>
                        <p className="text-sm text-slate-300">{expiry.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Status</p>
                        <Badge className={`${
                          status.color === 'green' 
                            ? 'bg-green-500/20 text-green-300 border-green-400/50'
                            : status.color === 'orange'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-400/50'
                            : 'bg-red-500/20 text-red-300 border-red-400/50'
                        }`}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {record.certificate_numbers && record.certificate_numbers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Certificate Numbers:</p>
                      <p className="text-sm text-slate-300">{record.certificate_numbers.join(', ')}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expiry Alert Summary */}
      {(stats.expiring_soon > 0 || stats.expired > 0) && (
        <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-orange-300 mb-2">Certificate Renewal Required</h3>
              {stats.expired > 0 && (
                <p className="text-slate-300 mb-2">
                  ⚠️ <span className="font-semibold text-red-300">{stats.expired} certificate(s)</span> have expired and need immediate renewal
                </p>
              )}
              {stats.expiring_soon > 0 && (
                <p className="text-slate-300">
                  🔔 <span className="font-semibold text-orange-300">{stats.expiring_soon} certificate(s)</span> expiring within 30 days
                </p>
              )}
              <p className="text-slate-400 text-sm mt-3">
                Contact these companies to schedule renewal training sessions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Certificate Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Active Certificates:</span>
                <span className="text-green-400 font-semibold">{stats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Renewal Pending:</span>
                <span className="text-orange-400 font-semibold">{stats.expiring_soon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expired:</span>
                <span className="text-red-400 font-semibold">{stats.expired}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Validity Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-2">
                {stats.total_certificates > 0 
                  ? Math.round((stats.active / stats.total_certificates) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-slate-400">of certificates are currently valid</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Renewal Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-400 mb-2">
                {stats.expiring_soon + stats.expired}
              </p>
              <p className="text-xs text-slate-400">companies need immediate attention</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CertificationsReports;
