import { useState, useEffect } from 'react';
import { Award, Calendar, AlertTriangle, CheckCircle, Clock, Download, FileText, TrendingUp, Users, Building2, ChevronDown, ChevronUp, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import AgingAlertsButton from '../certificates/AgingAlertsButton';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificationsReports = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [expandedRecords, setExpandedRecords] = useState({});
  const [stats, setStats] = useState({
    total_certificates: 0,
    expiring_soon: 0,
    expired: 0,
    active: 0
  });

  const toggleExpand = (recordId) => {
    setExpandedRecords(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

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
          <div className="flex gap-3">
            <AgingAlertsButton />
            <Button
              onClick={exportCertificateReport}
              className="bg-slate-900 text-green-600 hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900 backdrop-blur-sm rounded-lg p-4">
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
      <div className="bg-slate-9000 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Certificate Registry
        </h3>

        {loading ? (
          <p className="text-center py-12 text-slate-400">Loading certificates...</p>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No certificates issued yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => {
              const training = new Date(record.training_date);
              const expiry = new Date(training);
              expiry.setFullYear(expiry.getFullYear() + 3);
              const status = getCertificateStatus(record.training_date);
              const isExpanded = expandedRecords[record.id];
              const certCount = record.certificate_numbers?.length || 0;
              
              return (
                <div
                  key={record.id}
                  className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all"
                >
                  {/* Main Card Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="w-5 h-5 text-blue-400" />
                          <h4 className="text-lg font-bold text-white">{record.company_name}</h4>
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
                        <p className="text-sm text-slate-400">{record.contact_person} • {record.contact_mobile}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                          <FileCheck className="w-4 h-4" />
                          <span className="text-sm font-semibold">{certCount} Certificate{certCount !== 1 ? 's' : ''}</span>
                        </div>
                        <p className="text-xs text-slate-500">Issued</p>
                      </div>
                    </div>

                    {/* Course and Date Info Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-900 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Course</p>
                        <p className="text-sm font-medium text-white">{record.course_name}</p>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Training Date</p>
                        <p className="text-sm font-medium text-white">{training.toLocaleDateString()}</p>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Valid Until</p>
                        <p className="text-sm font-medium text-white">{expiry.toLocaleDateString()}</p>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Participants</p>
                        <p className="text-sm font-medium text-white">{record.participants_count || certCount}</p>
                      </div>
                    </div>

                    {/* Certificate Numbers Section */}
                    {certCount > 0 && (
                      <div className="border-t border-white/10 pt-4">
                        <button
                          onClick={() => toggleExpand(record.id)}
                          className="w-full flex items-center justify-between text-left hover:bg-white p-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-semibold text-white">
                              Certificate Numbers ({certCount})
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 bg-slate-800/50 rounded-lg p-4">
                            <div className="grid grid-cols-4 gap-2">
                              {record.certificate_numbers.map((certNum, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-900 border border-white/10 rounded px-3 py-2 text-center hover:bg-white transition-colors"
                                >
                                  <p className="text-xs text-slate-500 mb-1">Cert #{idx + 1}</p>
                                  <p className="text-sm font-mono text-blue-300 font-semibold">{certNum}</p>
                                </div>
                              ))}
                            </div>
                            
                            {/* Summary Info */}
                            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                              <span className="text-slate-400">
                                Total Certificates: <span className="text-white font-semibold">{certCount}</span>
                              </span>
                              <span className="text-slate-400">
                                Range: <span className="text-blue-300 font-mono">{record.certificate_numbers[0]}</span> to <span className="text-blue-300 font-mono">{record.certificate_numbers[certCount - 1]}</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dispatch Status Footer (if available) */}
                  {record.dispatch_status && (
                    <div className="bg-slate-900 border-t border-white/10 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Dispatch Status:</span>
                        <Badge className={`text-xs ${
                          record.dispatch_status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                          record.dispatch_status === 'in_transit' ? 'bg-purple-500/20 text-purple-300' :
                          record.dispatch_status === 'dispatched' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {record.dispatch_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                      {record.tracking_number && (
                        <div className="text-xs text-slate-400">
                          Tracking: <span className="text-blue-300 font-mono">{record.tracking_number}</span>
                        </div>
                      )}
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
        <Card className="bg-slate-900 border-white/10">
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

        <Card className="bg-slate-900 border-white/10">
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

        <Card className="bg-slate-900 border-white/10">
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
