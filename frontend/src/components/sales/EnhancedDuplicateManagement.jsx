import { useState, useEffect } from 'react';
import { AlertTriangle, X, Check, Users, Award, Split, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EnhancedDuplicateManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('different');
  const [notes, setNotes] = useState('');

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

  const openComparison = (alert) => {
    setSelectedAlert(alert);
    setSelectedAction('different');
    setNotes('');
    setComparisonOpen(true);
  };

  const resolveAlert = async () => {
    if (!selectedAlert) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/sales/resolve-duplicate/${selectedAlert.id}`,
        { 
          action: selectedAction,
          notes: notes,
          credit_assigned_to: selectedAction === 'assign_to_a' ? 'Lead A' : selectedAction === 'assign_to_b' ? 'Lead B' : ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const actionMessages = {
        'assign_to_a': 'Credit assigned to Lead A (First submission)',
        'assign_to_b': 'Credit assigned to Lead B (Second submission)',
        'split_credit': 'Credit split between both sales reps',
        'different': 'Marked as different leads - both approved',
        'reject_both': 'Both leads rejected'
      };
      
      toast.success(actionMessages[selectedAction] || 'Duplicate resolved');
      setComparisonOpen(false);
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving duplicate:', error);
      toast.error('Failed to resolve duplicate');
    }
  };

  const LeadComparisonCard = ({ lead, label, color }) => (
    <div className={`flex-1 bg-${color}-500/10 rounded-lg p-4 border-2 border-${color}-400/30`}>
      <div className="flex items-center justify-between mb-3">
        <Badge className={`bg-${color}-500/20 text-${color}-300 border-${color}-400/50`}>
          {label}
        </Badge>
        <Badge className="bg-white/10 text-white">
          {lead?.lead_score?.toUpperCase() || 'N/A'}
        </Badge>
      </div>

      <h3 className="text-xl font-bold text-white mb-4">{lead?.company_name || 'Unknown'}</h3>

      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-slate-400">Contact Person</p>
            <p className="text-white font-medium">{lead?.contact_person || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-400">Designation</p>
            <p className="text-white">{lead?.contact_designation || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-slate-400">Mobile</p>
            <p className="text-white font-medium">{lead?.contact_mobile || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-400">Email</p>
            <p className="text-white text-xs">{lead?.contact_email || 'N/A'}</p>
          </div>
        </div>

        <div>
          <p className="text-slate-400">Course</p>
          <p className="text-white font-medium">{lead?.course_name || 'N/A'}</p>
        </div>

        <div>
          <p className="text-slate-400">Lead Value</p>
          <p className="text-green-400 font-bold text-lg">{lead?.lead_value ? `${lead.lead_value} AED` : 'N/A'}</p>
        </div>

        <div>
          <p className="text-slate-400">Requirements</p>
          <p className="text-white text-xs">{lead?.requirement || 'No requirements specified'}</p>
        </div>

        <div className="pt-3 border-t border-white/10">
          <p className="text-slate-400 text-xs">Submitted By</p>
          <p className="text-white font-semibold">{lead?.submitted_by || 'Unknown'}</p>
          <p className="text-slate-400 text-xs">{lead?.submitted_by_role || ''}</p>
        </div>

        <div>
          <p className="text-slate-400 text-xs">Submission Time</p>
          <p className="text-white text-xs">{lead?.created_at ? new Date(lead.created_at).toLocaleString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            Duplicate Lead Management
          </h2>
          <p className="text-slate-400 mt-1">
            Review similarities, compare details, and assign credit fairly
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
            const leadA = alert.lead_a_data || {};
            const leadB = alert.lead_b_data || {};
            const similarityScore = typeof alert.similarity_score === 'string'
              ? parseInt(alert.similarity_score)
              : Math.round(alert.similarity_score * 100);
            
            return (
              <div
                key={alert.id}
                className="bg-white/5 rounded-lg p-5 border border-white/10 hover:border-orange-400/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-500/20 text-red-300 border-red-400/50 text-sm">
                      {similarityScore}% Match
                    </Badge>
                    <Badge className="bg-orange-500/20 text-orange-300 text-sm">
                      HIGH PRIORITY
                    </Badge>
                  </div>
                  <Button
                    onClick={() => openComparison(alert)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Review & Decide
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-500/10 rounded p-3 border border-blue-400/30">
                    <p className="text-xs text-blue-300 mb-1">LEAD A (First)</p>
                    <p className="text-white font-semibold">{leadA.company_name || 'N/A'}</p>
                    <p className="text-sm text-slate-300">By: {leadA.submitted_by || 'Unknown'} ({leadA.submitted_by_role})</p>
                    <p className="text-xs text-slate-400 mt-1">Value: {leadA.lead_value} AED</p>
                  </div>
                  <div className="bg-orange-500/10 rounded p-3 border border-orange-400/30">
                    <p className="text-xs text-orange-300 mb-1">LEAD B (Second)</p>
                    <p className="text-white font-semibold">{leadB.company_name || 'N/A'}</p>
                    <p className="text-sm text-slate-300">By: {leadB.submitted_by || 'Unknown'} ({leadB.submitted_by_role})</p>
                    <p className="text-xs text-slate-400 mt-1">Value: {leadB.lead_value} AED</p>
                  </div>
                </div>

                {alert.similarity_factors && (
                  <div className="bg-red-500/10 rounded p-3 border border-red-400/30">
                    <p className="text-xs text-red-300 font-semibold mb-2">🚨 Similarity Factors:</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {alert.similarity_factors.map((factor, idx) => (
                        <li key={idx}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Comparison Modal */}
      <Dialog open={comparisonOpen} onOpenChange={setComparisonOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              Duplicate Lead Resolution
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Compare both leads side-by-side and decide who gets credit
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6">
              {/* Side by Side Comparison */}
              <div className="flex gap-4">
                <LeadComparisonCard 
                  lead={selectedAlert.lead_a_data} 
                  label="LEAD A (First Submission)" 
                  color="blue"
                />
                <LeadComparisonCard 
                  lead={selectedAlert.lead_b_data} 
                  label="LEAD B (Second Submission)" 
                  color="orange"
                />
              </div>

              {/* Decision Options */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Sales Head Decision
                </h3>

                <RadioGroup value={selectedAction} onValueChange={setSelectedAction} className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded border border-blue-400/30">
                    <RadioGroupItem value="assign_to_a" id="assign_to_a" />
                    <Label htmlFor="assign_to_a" className="flex-1 cursor-pointer text-white">
                      <div className="font-semibold">Assign Credit to Lead A</div>
                      <div className="text-xs text-slate-400">Give full credit to {selectedAlert.lead_a_data?.submitted_by || 'first submitter'}</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-orange-500/10 rounded border border-orange-400/30">
                    <RadioGroupItem value="assign_to_b" id="assign_to_b" />
                    <Label htmlFor="assign_to_b" className="flex-1 cursor-pointer text-white">
                      <div className="font-semibold">Assign Credit to Lead B</div>
                      <div className="text-xs text-slate-400">Give full credit to {selectedAlert.lead_b_data?.submitted_by || 'second submitter'}</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-purple-500/10 rounded border border-purple-400/30">
                    <RadioGroupItem value="split_credit" id="split_credit" />
                    <Label htmlFor="split_credit" className="flex-1 cursor-pointer text-white">
                      <div className="font-semibold flex items-center gap-2">
                        <Split className="w-4 h-4" />
                        Split Credit (50/50)
                      </div>
                      <div className="text-xs text-slate-400">Both sales reps share the credit</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-green-500/10 rounded border border-green-400/30">
                    <RadioGroupItem value="different" id="different" />
                    <Label htmlFor="different" className="flex-1 cursor-pointer text-white">
                      <div className="font-semibold">They Are Different Leads</div>
                      <div className="text-xs text-slate-400">Both leads are valid and independent</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-red-500/10 rounded border border-red-400/30">
                    <RadioGroupItem value="reject_both" id="reject_both" />
                    <Label htmlFor="reject_both" className="flex-1 cursor-pointer text-white">
                      <div className="font-semibold flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Reject Both Leads
                      </div>
                      <div className="text-xs text-slate-400">Invalid or poor quality submissions</div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="mt-4">
                  <Label htmlFor="notes" className="text-white mb-2 block">Resolution Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about your decision..."
                    className="bg-slate-800 border-white/10 text-white min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={resolveAlert}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Confirm Decision
                  </Button>
                  <Button
                    onClick={() => setComparisonOpen(false)}
                    variant="outline"
                    className="border-white/20 hover:bg-white/10"
                    size="lg"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedDuplicateManagement;
