import { useState, useEffect } from 'react';
import { X, Edit2, Save, History, DollarSign, Calendar, User, Phone, Mail, Building2, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadDetailsModal = ({ open, onOpenChange, lead, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leadData, setLeadData] = useState(null);
  const [history, setHistory] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    if (open && lead) {
      fetchLeadDetails();
      fetchLeadHistory();
      fetchPurchaseHistory();
    }
  }, [open, lead]);

  const fetchLeadDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/leads/${lead.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeadData(response.data);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      setLeadData(lead);
    }
  };

  const fetchLeadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/leads/${lead.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/leads/${lead.id}/purchases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchases(response.data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/sales/leads/${lead.id}`, leadData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Lead updated successfully');
      setIsEditing(false);
      if (onSuccess) onSuccess();
      fetchLeadHistory();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  if (!leadData) return null;

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-500/20 text-blue-300 border-blue-400/50',
      contacted: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50',
      quoted: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
      negotiation: 'bg-orange-500/20 text-orange-300 border-orange-400/50',
      won: 'bg-green-500/20 text-green-300 border-green-400/50',
      lost: 'bg-red-500/20 text-red-300 border-red-400/50'
    };
    return colors[status?.toLowerCase()] || colors.new;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white border-gray-300">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl text-gray-900">
              Lead Details - {leadData.company_name || leadData.client_name}
            </DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-white hover:bg-white"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(false)}
                    size="sm"
                    variant="outline"
                    className="border-gray-300 text-white hover:bg-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-white border border-gray-300">
            <TabsTrigger value="details" className="data-[state=active]:bg-blue-500/20">
              <FileText className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/20">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="purchases" className="data-[state=active]:bg-green-500/20">
              <DollarSign className="w-4 h-4 mr-2" />
              Purchases
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-4 space-y-6">
            {/* Status Section */}
            <div className="bg-white rounded-lg p-4 border border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-500 text-xs">Current Status</Label>
                  {isEditing ? (
                    <select
                      value={leadData.status || 'new'}
                      onChange={(e) => setLeadData({ ...leadData, status: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md p-2 mt-1"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  ) : (
                    <Badge className={`${getStatusColor(leadData.status)} text-lg px-4 py-1 mt-1`}>
                      {leadData.status?.toUpperCase() || 'NEW'}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Lead Score (Manual Override)</Label>
                  {isEditing ? (
                    <select
                      value={leadData.lead_score || 'warm'}
                      onChange={(e) => setLeadData({ ...leadData, lead_score: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md p-2 mt-1"
                    >
                      <option value="hot">🔥 HOT</option>
                      <option value="warm">🟡 WARM</option>
                      <option value="cold">🔵 COLD</option>
                    </select>
                  ) : (
                    <Badge className={`text-lg px-4 py-1 mt-1 ${
                      leadData.lead_score === 'hot' ? 'bg-red-500/20 text-red-300 border-red-400/50' :
                      leadData.lead_score === 'warm' ? 'bg-orange-500/20 text-orange-300 border-orange-400/50' :
                      'bg-blue-500/20 text-blue-300 border-blue-400/50'
                    }`}>
                      {leadData.lead_score === 'hot' ? '🔥 HOT' :
                       leadData.lead_score === 'warm' ? '🟡 WARM' :
                       '🔵 COLD'}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Estimated Value</Label>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {leadData.lead_value ? `${leadData.lead_value} AED` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg p-4 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">Company/Client Name</Label>
                  {isEditing ? (
                    <Input
                      value={leadData.company_name || leadData.client_name}
                      onChange={(e) => setLeadData({ ...leadData, company_name: e.target.value })}
                      className="bg-gray-50 border-gray-300 text-gray-900 mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{leadData.company_name || leadData.client_name || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Contact Person</Label>
                  {isEditing ? (
                    <Input
                      value={leadData.contact_person || ''}
                      onChange={(e) => setLeadData({ ...leadData, contact_person: e.target.value })}
                      className="bg-gray-50 border-gray-300 text-gray-900 mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{leadData.contact_person || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Phone</Label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {leadData.phone || leadData.contact_mobile || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Email</Label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {leadData.contact_email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Training Details */}
            <div className="bg-white rounded-lg p-4 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Requirements</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">Course</Label>
                  <p className="text-gray-900 mt-1">{leadData.course_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Number of Participants</Label>
                  <p className="text-gray-900 mt-1">{leadData.num_trainees || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Training Location</Label>
                  <p className="text-gray-900 mt-1">{leadData.training_location || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Preferred Date</Label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {leadData.training_date ? new Date(leadData.training_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-lg p-4 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-500 text-xs">Lead Owner</Label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {leadData.lead_owner || leadData.created_by_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Requirements</Label>
                  <p className="text-gray-900 mt-1">{leadData.requirement || leadData.remarks || 'No additional requirements'}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No modification history available</p>
                </div>
              ) : (
                history.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-slate-400">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-900">{item.action}</p>
                        {item.changed_by && (
                          <p className="text-xs text-slate-400 mt-1">
                            by {item.changed_by}
                          </p>
                        )}
                      </div>
                      {item.change_type && (
                        <Badge className="bg-purple-500/20 text-purple-300">
                          {item.change_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="mt-4">
            <div className="space-y-4">
              {purchases.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No purchase history available</p>
                </div>
              ) : (
                purchases.map((purchase, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-gray-900 font-semibold">{purchase.course_name}</h4>
                        <p className="text-sm text-slate-400 mt-1">
                          {new Date(purchase.date).toLocaleDateString()} • {purchase.num_participants} participants
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">{purchase.amount} AED</p>
                        <Badge className="mt-1 bg-green-500/20 text-green-300">
                          {purchase.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailsModal;
