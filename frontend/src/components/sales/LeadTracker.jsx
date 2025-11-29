import { useState, useEffect } from 'react';
import { Phone, MessageCircle, FileText, Calendar, CheckCircle, Filter, Search, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import EnhancedLeadForm from './EnhancedLeadForm';
import TrainerCalendar from './TrainerCalendar';
import LeadDetailsModal from './LeadDetailsModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadTracker = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarLead, setCalendarLead] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLead, setDetailsLead] = useState(null);

  const statuses = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, scoreFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        (lead.company_name || lead.client_name || '').toLowerCase().includes(search) ||
        (lead.contact_person || '').toLowerCase().includes(search) ||
        (lead.course_name || '').toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (scoreFilter !== 'all') {
      filtered = filtered.filter(lead => (lead.lead_score || 'warm') === scoreFilter);
    }

    setFilteredLeads(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-green-500/20 text-green-300 border-green-400/50',
      'Contacted': 'bg-blue-500/20 text-blue-300 border-blue-400/50',
      'Quoted': 'bg-purple-500/20 text-purple-300 border-purple-400/50',
      'Negotiation': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50',
      'Won': 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
      'Lost': 'bg-red-500/20 text-red-300 border-red-400/50'
    };
    return colors[status] || colors['New'];
  };

  const getScoreBadge = (score) => {
    const config = {
      hot: { color: 'bg-red-500/20 text-red-300 border-red-400/50', icon: '🔥' },
      warm: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50', icon: '🌡️' },
      cold: { color: 'bg-blue-500/20 text-blue-300 border-blue-400/50', icon: '❄️' }
    };
    const { color, icon } = config[score] || config.warm;
    return <Badge className={`${color} text-xs`}>{icon} {score}</Badge>;
  };

  const getStatusCount = (status) => {
    return leads.filter(l => l.status === status).length;
  };

  const handleWhatsApp = (lead) => {
    const mobile = lead.contact_mobile || '';
    const name = lead.contact_person || lead.client_name || '';
    const course = lead.course_name || '';
    const message = `Hi ${name}, thank you for your interest in ${course}. We'd like to discuss your training requirements.`;
    const url = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/sales-head/leads/${leadId}`, 
        { status: newStatus, last_contact_date: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status updated!');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Company/Client', 'Contact', 'Course', 'Status', 'Value', 'Score', 'Date'].join(','),
      ...filteredLeads.map(lead => [
        lead.company_name || lead.client_name,
        lead.contact_person || lead.client_name,
        lead.course_name,
        lead.status,
        lead.lead_value || '0',
        lead.lead_score || 'warm',
        new Date(lead.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported to CSV!');
  };

  const handleOpenCalendar = (lead) => {
    setCalendarLead(lead);
    setCalendarOpen(true);
  };

  const handleBookingSuccess = () => {
    setCalendarOpen(false);
    toast.success('Booking request sent successfully!');
    fetchLeads();
  };

  const handleOpenDetails = (lead) => {
    setDetailsLead(lead);
    setDetailsOpen(true);
  };

  const handleDetailsSuccess = () => {
    fetchLeads();
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Bar */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <div className="grid grid-cols-6 gap-2">
          {statuses.map((status, idx) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`p-3 rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 ring-2 ring-blue-400'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-100">{getStatusCount(status)}</p>
                <p className="text-xs text-slate-400 mt-1">{status}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company, contact, or course..."
              className="pl-10 bg-slate-800 border-white/10 text-slate-100"
            />
          </div>
        </div>
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
          className="bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2"
        >
          <option value="all">All Scores</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">🌡️ Warm</option>
          <option value="cold">❄️ Cold</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFormOpen(true);
            setSelectedLead(null);
          }}
          className="border-white/20 hover:bg-white/10"
        >
          + New Lead
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          className="border-white/20 hover:bg-white/10"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Leads Grid */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        {loading ? (
          <p className="text-center py-8 text-slate-400">Loading leads...</p>
        ) : filteredLeads.length === 0 ? (
          <p className="text-center py-8 text-slate-400">
            {searchTerm || statusFilter !== 'all' ? 'No leads match your filters' : 'No leads yet'}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-100">
                        {lead.company_name || lead.client_name}
                      </h3>
                      <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                      {getScoreBadge(lead.lead_score || 'warm')}
                      {lead.urgency === 'high' && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-400/50 text-xs">
                          URGENT
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm text-slate-300 mb-3">
                      {lead.contact_person && (
                        <div>
                          <span className="text-slate-400">Contact:</span> {lead.contact_person}
                          {lead.contact_designation && ` (${lead.contact_designation})`}
                        </div>
                      )}
                      {lead.course_name && (
                        <div>
                          <span className="text-slate-400">Course:</span> {lead.course_name}
                        </div>
                      )}
                      {lead.lead_value && (
                        <div>
                          <span className="text-slate-400">Value:</span>{' '}
                          <span className="font-semibold text-green-400">{lead.lead_value} AED</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetails(lead)}
                        className="border-blue-400/50 hover:bg-blue-500/20 text-blue-300"
                        title="View Full Details"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${lead.contact_mobile}`)}
                        className="border-white/20 hover:bg-green-500/20"
                        title="Call"
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWhatsApp(lead)}
                        className="border-white/20 hover:bg-green-500/20"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.info('Quotation feature coming soon!')}
                        className="border-white/20 hover:bg-blue-500/20"
                        title="Send Quote"
                      >
                        <FileText className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCalendar(lead)}
                        className="border-white/20 hover:bg-purple-500/20"
                        title="Check Calendar & Request Booking"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Calendar
                      </Button>

                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                        className="ml-auto text-xs bg-slate-800 border border-white/10 text-slate-100 rounded px-2 py-1"
                      >
                        {statuses.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {lead.requirement && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-sm text-slate-400">
                    <strong>Requirements:</strong> {lead.requirement}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <EnhancedLeadForm
        open={formOpen}
        onOpenChange={setFormOpen}
        existingLead={selectedLead}
        onSuccess={fetchLeads}
      />

      {/* Trainer Calendar Modal */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-5xl bg-slate-900 border-white/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              Trainer Calendar - Check Availability & Request Booking
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {calendarLead && (
                <span>
                  Lead: {calendarLead.company_name || calendarLead.client_name} - {calendarLead.course_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {calendarLead && (
            <TrainerCalendar
              leadData={calendarLead}
              selectedCourse={{ id: calendarLead.course_id, name: calendarLead.course_name }}
              onBookingRequest={handleBookingSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Lead Details Modal */}
      <LeadDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        lead={detailsLead}
        onSuccess={handleDetailsSuccess}
      />
    </div>
  );
};

export default LeadTracker;
