import { useState, useEffect } from 'react';
import { AlertTriangle, X, Check, Users, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DuplicateManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [leadA, setLeadA] = useState(null);
  const [leadB, setLeadB] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/duplicate-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load duplicate alerts');
    } finally {
      setLoading(false);
    }
  };

  const openComparison = async (alert) => {
    setSelectedAlert(alert);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch both leads
      const [responseA, responseB] = await Promise.all([
        axios.get(`${API}/sales/leads/${alert.lead_a_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/sales/leads/${alert.lead_b_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setLeadA(responseA.data);
      setLeadB(responseB.data);
      setComparisonOpen(true);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast.error('Failed to load lead details');
    }
  };

  const resolveAlert = async (action, data = {}) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/sales/resolve-duplicate/${selectedAlert.id}`,
        { action, ...data },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Duplicate ${action === 'merge' ? 'merged' : 'resolved'} successfully`);
      setComparisonOpen(false);
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving duplicate:', error);
      toast.error('Failed to resolve duplicate');
    }
  };

  const handleMerge = () => {
    resolveAlert('merge', {
      keep_lead_id: leadA.id,
      archive_lead_id: leadB.id
    });
  };

  const handleMarkDifferent = () => {
    resolveAlert('different');
  };

  const handleMarkDuplicate = () => {
    resolveAlert('duplicate', {
      duplicate_lead_id: leadB.id
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            Duplicate Alert Management
          </h2>
          <p className="text-slate-400 mt-1">
            Review and resolve potential duplicate lead submissions
          </p>
        </div>
        <Badge className="bg-red-500/20 text-red-300 text-lg px-4 py-2">
          {alerts.length} Pending
        </Badge>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
          <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-slate-300 text-lg">All Clear!</p>
          <p className="text-slate-400 mt-1">No duplicate alerts to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const newLeadData = typeof alert.new_lead_data === 'string' 
              ? JSON.parse(alert.new_lead_data) 
              : alert.new_lead_data;
            const similarityScore = typeof alert.similarity_score === 'string'
              ? parseInt(alert.similarity_score)
              : Math.round(alert.similarity_score * 100);
            const confidence = similarityScore >= 80 ? 'high' : 'medium';
            
            return (
              <div
                key={alert.id}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-orange-400/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${
                        confidence === 'high'
                          ? 'bg-red-500/20 text-red-300 border-red-400/50'
                          : 'bg-orange-500/20 text-orange-300 border-orange-400/50'
                      }`}>
                        {similarityScore}% Match
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-300">
                        {confidence.toUpperCase()} Confidence
                      </Badge>
                      <Badge className="bg-yellow-500/20 text-yellow-300">
                        {alert.status === 'pending' ? 'PENDING REVIEW' : alert.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="bg-orange-500/10 rounded p-4 border border-orange-400/30 mb-3">
                      <p className="text-xs text-slate-400 mb-2">New Lead Submission:</p>
                      <p className="text-white font-semibold text-lg mb-2">{newLeadData?.company_name || 'Unknown Company'}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Contact:</span>
                          <span className="text-slate-200 ml-2">{newLeadData?.contact_person || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Mobile:</span>
                          <span className="text-slate-200 ml-2">{newLeadData?.contact_mobile || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Course:</span>
                          <span className="text-slate-200 ml-2">{newLeadData?.course_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Value:</span>
                          <span className="text-green-400 ml-2 font-semibold">
                            {newLeadData?.lead_value ? `${newLeadData.lead_value} AED` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 rounded p-3 border border-blue-400/30 mb-2">
                      <p className="text-xs text-orange-300 font-semibold">⚠️ Detection Reason:</p>
                      <p className="text-slate-300 text-sm mt-1">{alert.detection_reason || 'Similar lead detected in system'}</p>
                    </div>

                    <p className="text-xs text-slate-500">
                      Detected: {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        // For now, just resolve it as different
                        resolveAlert('different');
                      }}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        resolveAlert('duplicate', { duplicate_lead_id: alert.lead_ids?.[1] || alert.id });
                      }}
                      variant="outline"
                      className="border-red-400/50 hover:bg-red-500/20 text-red-300"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Modal */}
      <Dialog open={comparisonOpen} onOpenChange={setComparisonOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              Duplicate Lead Review
            </DialogTitle>
          </DialogHeader>

          {leadA && leadB && (
            <div className="space-y-6">
              {/* Similarity Info */}
              <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-white font-semibold">
                        {selectedAlert?.similarity_score}% Similarity Match
                      </p>
                      <p className="text-sm text-slate-400">
                        {selectedAlert?.confidence === 'high' ? 'High confidence duplicate' : 'Medium confidence - review carefully'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side by Side Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/30">
                  <h3 className="text-lg font-semibold text-white mb-4">Lead A (Original)</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-400">Company</p>
                      <p className="text-white font-medium">{leadA.company_name || leadA.client_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Contact</p>
                      <p className="text-white">{leadA.contact_person || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Phone</p>
                      <p className="text-white">{leadA.phone || leadA.contact_mobile || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Email</p>
                      <p className="text-white">{leadA.contact_email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Submitted By</p>
                      <p className="text-white">{leadA.created_by_name || leadA.assigned_to_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Date</p>
                      <p className="text-white">{new Date(leadA.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Status</p>
                      <Badge className="bg-blue-500/20 text-blue-300">{leadA.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-400/30">
                  <h3 className="text-lg font-semibold text-white mb-4">Lead B (New Submission)</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-400">Company</p>
                      <p className="text-white font-medium">{leadB.company_name || leadB.client_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Contact</p>
                      <p className="text-white">{leadB.contact_person || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Phone</p>
                      <p className="text-white">{leadB.phone || leadB.contact_mobile || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Email</p>
                      <p className="text-white">{leadB.contact_email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Submitted By</p>
                      <p className="text-white">{leadB.created_by_name || leadB.assigned_to_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Date</p>
                      <p className="text-white">{new Date(leadB.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Status</p>
                      <Badge className="bg-orange-500/20 text-orange-300">{leadB.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <Button
                  onClick={handleMerge}
                  className="bg-green-600 hover:bg-green-700 h-auto py-4"
                >
                  <ArrowRightLeft className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">Merge Leads</div>
                    <div className="text-xs opacity-80">Keep Lead A, archive Lead B</div>
                  </div>
                </Button>

                <Button
                  onClick={handleMarkDifferent}
                  className="bg-blue-600 hover:bg-blue-700 h-auto py-4"
                >
                  <Check className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">Mark as Different</div>
                    <div className="text-xs opacity-80">Both are legitimate companies</div>
                  </div>
                </Button>

                <Button
                  onClick={handleMarkDuplicate}
                  className="bg-red-600 hover:bg-red-700 h-auto py-4"
                  variant="destructive"
                >
                  <X className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">Mark as Duplicate</div>
                    <div className="text-xs opacity-80">Lead B is a duplicate submission</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setComparisonOpen(false)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 h-auto py-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">Review Later</div>
                    <div className="text-xs opacity-80">Keep alert pending</div>
                  </div>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DuplicateManagement;
