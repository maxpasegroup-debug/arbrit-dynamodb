import { useState, useEffect } from 'react';
import { Bell, AlertCircle, AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AgingAlertsButton = () => {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({
    total_alerts: 0,
    critical: 0,
    urgent: 0,
    warning: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAgingAlerts();
    // Refresh every 2 minutes
    const interval = setInterval(fetchAgingAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgingAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/certificate-tracking/aging-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlerts(response.data.alerts || []);
      setSummary({
        total_alerts: response.data.total_alerts || 0,
        critical: response.data.critical || 0,
        urgent: response.data.urgent || 0,
        warning: response.data.warning || 0
      });
    } catch (error) {
      console.error('Error fetching aging alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      critical: {
        color: 'bg-red-500/20 text-red-300 border-red-400/50',
        icon: AlertCircle,
        label: 'CRITICAL'
      },
      urgent: {
        color: 'bg-orange-500/20 text-orange-300 border-orange-400/50',
        icon: AlertTriangle,
        label: 'URGENT'
      },
      warning: {
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50',
        icon: Clock,
        label: 'WARNING'
      }
    };
    return configs[severity] || configs.warning;
  };

  const hasCriticalAlerts = summary.critical > 0;
  const hasUrgentAlerts = summary.urgent > 0;

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <Button
          onClick={() => {
            setAlertsOpen(true);
            fetchAgingAlerts();
          }}
          className={`relative ${
            hasCriticalAlerts 
              ? 'bg-red-600 hover:bg-red-700' 
              : hasUrgentAlerts 
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Bell className={`w-4 h-4 mr-2 ${hasCriticalAlerts ? 'animate-pulse' : ''}`} />
          Aging Alerts
          {summary.total_alerts > 0 && (
            <Badge className="ml-2 bg-white text-red-600 font-bold">
              {summary.total_alerts}
            </Badge>
          )}
        </Button>
        
        {/* Pulsing Dot for Critical Alerts */}
        {hasCriticalAlerts && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
        )}
      </div>

      {/* Aging Alerts Modal */}
      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-red-400" />
              Certificate Aging Alerts
              <Badge className="ml-2 bg-red-500/20 text-red-300 border-red-400/50">
                {summary.total_alerts} Total
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading aging alerts...</p>
            </div>
          ) : summary.total_alerts === 0 ? (
            <div className="text-center py-12">
              <div className="bg-green-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-xl font-semibold text-green-300 mb-2">All Clear!</p>
              <p className="text-slate-400">No aging alerts at this time. All certificates are on track.</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-slate-300 mb-1">Total Alerts</p>
                  <p className="text-2xl font-bold text-white">{summary.total_alerts}</p>
                </div>
                <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-3 border border-red-400/30">
                  <p className="text-xs text-red-200 mb-1">Critical</p>
                  <p className="text-2xl font-bold text-red-300">{summary.critical}</p>
                </div>
                <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-3 border border-orange-400/30">
                  <p className="text-xs text-orange-200 mb-1">Urgent</p>
                  <p className="text-2xl font-bold text-orange-300">{summary.urgent}</p>
                </div>
                <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-3 border border-yellow-400/30">
                  <p className="text-xs text-yellow-200 mb-1">Warning</p>
                  <p className="text-2xl font-bold text-yellow-300">{summary.warning}</p>
                </div>
              </div>

              {/* Alerts List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {alerts.map((alert) => {
                  const config = getSeverityConfig(alert.severity);
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={alert.id}
                      className={`${
                        alert.severity === 'critical' 
                          ? 'bg-red-500/10 border-red-400/50' 
                          : alert.severity === 'urgent'
                          ? 'bg-orange-500/10 border-orange-400/50'
                          : 'bg-yellow-500/10 border-yellow-400/50'
                      } border rounded-lg p-4`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${
                          alert.severity === 'critical' 
                            ? 'bg-red-500/20' 
                            : alert.severity === 'urgent'
                            ? 'bg-orange-500/20'
                            : 'bg-yellow-500/20'
                        } rounded-full p-2`}>
                          <Icon className={`w-5 h-5 ${
                            alert.severity === 'critical' 
                              ? 'text-red-400 animate-pulse' 
                              : alert.severity === 'urgent'
                              ? 'text-orange-400'
                              : 'text-yellow-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">
                              {alert.certificate_type}
                            </Badge>
                            <Badge className="bg-white/10 text-white border-white/20">
                              {alert.status.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          </div>
                          
                          <h4 className="text-base font-bold text-white mb-1">{alert.company_name}</h4>
                          <p className="text-sm text-slate-300 mb-2">{alert.course_name}</p>
                          
                          <div className={`${
                            alert.severity === 'critical' 
                              ? 'bg-red-500/20 text-red-300' 
                              : alert.severity === 'urgent'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          } rounded-lg p-2 mb-2`}>
                            <p className="text-sm font-semibold">{alert.alert_message}</p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Contact</p>
                              <p className="text-white font-medium">{alert.contact_person}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Mobile</p>
                              <p className="text-white font-medium">{alert.contact_mobile}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Age</p>
                              <p className="text-white font-bold">
                                {alert.certificate_type === 'In-House' 
                                  ? `${alert.age_hours}h` 
                                  : `${alert.age_days}d`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guidelines Footer */}
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">📋 Aging Alert Guidelines:</h4>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
                  <div>
                    <p className="font-semibold text-white mb-1">In-House (48-Hour Rule):</p>
                    <ul className="space-y-1 ml-4">
                      <li>• 36-48h: <span className="text-yellow-300">Warning</span></li>
                      <li>• 48-72h: <span className="text-orange-300">Urgent</span></li>
                      <li>• &gt;72h: <span className="text-red-300">Critical</span></li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">International:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• 30-60d: <span className="text-yellow-300">Warning</span></li>
                      <li>• 60-90d: <span className="text-orange-300">Urgent</span></li>
                      <li>• &gt;90d: <span className="text-red-300">Critical</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgingAlertsButton;
