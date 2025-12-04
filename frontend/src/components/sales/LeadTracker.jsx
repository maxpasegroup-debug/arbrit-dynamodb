import { useState, useEffect } from 'react';
import { Phone, MessageCircle, FileText, Calendar, CheckCircle, Filter, Search, Download, Eye, DollarSign, Edit } from 'lucide-react';
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
import UnifiedLeadForm from './UnifiedLeadForm';
import TrainerCalendar from './TrainerCalendar';
import LeadDetailsModal from './LeadDetailsModal';
import LeadProgressTracker from './LeadProgressTracker';
import QuotationDialog from './QuotationDialog';
import QuotationSendModal from './QuotationSendModal';
import { AlertTriangle, Award, Split, XCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadTracker = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarLead, setCalendarLead] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLead, setDetailsLead] = useState(null);
  const [userRole, setUserRole] = useState('');
  
  // Quotation dialog state
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [quotationLead, setQuotationLead] = useState(null);
  
  // Sales Head specific: Quotation & Invoice requests
  const [quotationRequests, setQuotationRequests] = useState([]);
  const [invoiceRequests, setInvoiceRequests] = useState([]);
  const [quotationRequestOpen, setQuotationRequestOpen] = useState(false);
  const [invoiceRequestOpen, setInvoiceRequestOpen] = useState(false);
  const [quotationSendModalOpen, setQuotationSendModalOpen] = useState(false);
  const [selectedLeadForSend, setSelectedLeadForSend] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Duplicate management states
  const [duplicateAlerts, setDuplicateAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('different');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const statuses = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];
  
  // Get unique areas and employees for filters
  const areas = [...new Set(leads.map(l => l.training_location || l.branch).filter(Boolean))];
  const employees = [...new Set(leads.map(l => l.lead_owner || l.assigned_to_name || l.created_by_name).filter(Boolean))];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    fetchLeads();
    fetchDuplicateAlerts();
    if (['Sales Head', 'COO', 'MD', 'CEO'].includes(user.role)) {
      fetchQuotationRequests();
      fetchInvoiceRequests();
    }
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, scoreFilter, areaFilter, employeeFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isSalesHead = ['Sales Head', 'COO', 'MD', 'CEO'].includes(user.role);
      
      // Use appropriate endpoint based on role
      const endpoint = isSalesHead ? `${API}/sales-head/leads` : `${API}/sales/leads`;
      
      const response = await axios.get(endpoint, {
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

  const fetchQuotationRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isSalesHead = ['Sales Head', 'COO', 'MD', 'CEO'].includes(user.role);
      
      const endpoint = isSalesHead ? `${API}/sales-head/quotations` : `${API}/quotations`;
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotationRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching quotation requests:', error);
    }
  };

  const fetchInvoiceRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isSalesHead = ['Sales Head', 'COO', 'MD', 'CEO'].includes(user.role);
      
      const endpoint = isSalesHead ? `${API}/sales-head/invoices` : `${API}/accounts/invoice-requests`;
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoiceRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching invoice requests:', error);
    }
  };

  const fetchDuplicateAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/duplicate-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDuplicateAlerts(response.data || []);
    } catch (error) {
      console.error('Error fetching duplicate alerts:', error);
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

    // Sales Head specific filters
    if (areaFilter !== 'all') {
      filtered = filtered.filter(lead => 
        (lead.training_location === areaFilter || lead.branch === areaFilter)
      );
    }

    if (employeeFilter !== 'all') {
      filtered = filtered.filter(lead => 
        (lead.lead_owner === employeeFilter || 
         lead.assigned_to_name === employeeFilter ||
         lead.created_by_name === employeeFilter)
      );
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = user.role || '';
      
      let endpoint;
      let requestData;
      
      // Determine endpoint based on user role
      if (userRole.includes('Sales Head') || userRole.includes('COO') || userRole.includes('MD') || userRole.includes('CEO')) {
        endpoint = `${API}/sales-head/leads/${leadId}`;
        requestData = { status: newStatus, last_contact_date: new Date().toISOString() };
      } else if (userRole.includes('Tele Sales') || userRole.includes('Field Sales') || userRole.includes('Sales Employee')) {
        endpoint = `${API}/sales/leads/${leadId}`;
        requestData = { status: newStatus, last_contact_date: new Date().toISOString() };
      } else {
        throw new Error('Insufficient permissions to update lead status');
      }
      
      await axios.put(endpoint, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Status updated!');
      fetchLeads();
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to update status';
      toast.error(errorMsg);
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

  // Send Quotation to Client Handler
  const handleSendQuotationToClient = async (lead) => {
    try {
      const token = localStorage.getItem('token');
      const quotation_id = lead.quotation_id;
      
      if (!quotation_id) {
        toast.error('No quotation found for this lead');
        return;
      }
      
      // Show confirmation dialog with client details
      const sendMethod = await new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/10">
              <h3 class="text-xl font-bold text-white mb-4">📤 Send Quotation to Client</h3>
              
              <div class="space-y-3 mb-6">
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Client</p>
                  <p class="text-white font-semibold">${lead.company_name || lead.client_name}</p>
                </div>
                
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Contact Person</p>
                  <p class="text-white">${lead.contact_person || 'N/A'}</p>
                </div>
                
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Email</p>
                  <input type="email" id="client-email" 
                    value="${lead.contact_email || ''}" 
                    class="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1"
                    placeholder="client@example.com" />
                </div>
                
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Send Via</p>
                  <select id="send-method" class="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1">
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Hand Delivered">Hand Delivered</option>
                  </select>
                </div>
              </div>
              
              <div class="flex gap-3">
                <button id="send-btn" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  📤 Send Quotation
                </button>
                <button id="cancel-btn" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(dialog);
        
        dialog.querySelector('#send-btn').onclick = () => {
          const email = dialog.querySelector('#client-email').value;
          const method = dialog.querySelector('#send-method').value;
          document.body.removeChild(dialog);
          resolve({ action: 'send', email, method });
        };
        
        dialog.querySelector('#cancel-btn').onclick = () => {
          document.body.removeChild(dialog);
          resolve({ action: 'cancel' });
        };
      });
      
      if (sendMethod.action === 'cancel') return;
      
      // Send quotation to client
      await axios.put(`${API}/sales/quotations/${quotation_id}/send-to-client`, {
        client_email: sendMethod.email,
        sent_via: sendMethod.method,
        remarks: `Sent via ${sendMethod.method}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Quotation sent to client via ${sendMethod.method}!`);
      fetchLeads();
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast.error('Failed to send quotation to client');
    }
  };

  // Quotation Approval Handler
  const handleQuotationApproval = async (lead) => {
    try {
      const token = localStorage.getItem('token');
      const quotation_id = lead.quotation_id;
      
      if (!quotation_id) {
        toast.error('No quotation found for this lead');
        return;
      }
      
      // Find the quotation details
      const quotResponse = await axios.get(`${API}/sales-head/quotations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const quotation = quotResponse.data.find(q => q.id === quotation_id);
      
      if (!quotation) {
        toast.error('Quotation not found');
        return;
      }
      
      // Show confirmation dialog
      const action = await new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/10">
              <h3 class="text-xl font-bold text-white mb-4">Review Quotation</h3>
              <div class="space-y-3 mb-6">
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Client</p>
                  <p class="text-white font-semibold">${quotation.client_name}</p>
                </div>
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Total Amount</p>
                  <p class="text-green-400 font-bold text-lg">${quotation.total_amount} AED</p>
                </div>
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Created By</p>
                  <p class="text-white">${quotation.created_by_name}</p>
                </div>
              </div>
              <div class="flex gap-3">
                <button id="approve-btn" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  ✅ Approve
                </button>
                <button id="reject-btn" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                  ❌ Reject
                </button>
                <button id="cancel-btn" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(dialog);
        
        dialog.querySelector('#approve-btn').onclick = () => {
          document.body.removeChild(dialog);
          resolve('approve');
        };
        dialog.querySelector('#reject-btn').onclick = () => {
          document.body.removeChild(dialog);
          resolve('reject');
        };
        dialog.querySelector('#cancel-btn').onclick = () => {
          document.body.removeChild(dialog);
          resolve('cancel');
        };
      });
      
      if (action === 'cancel') return;
      
      const endpoint = action === 'approve' 
        ? `${API}/sales-head/quotations/${quotation_id}/approve`
        : `${API}/sales-head/quotations/${quotation_id}/reject`;
      
      await axios.put(endpoint, {
        comments: action === 'approve' ? 'Approved by Sales Head' : 'Rejected by Sales Head'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Quotation ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchLeads();
      fetchQuotationRequests();
    } catch (error) {
      console.error('Error handling quotation:', error);
      toast.error('Failed to process quotation');
    }
  };

  // Invoice Approval Handler
  const handleInvoiceApproval = async (lead) => {
    try {
      const token = localStorage.getItem('token');
      const invoice_id = lead.invoice_id;
      
      if (!invoice_id) {
        toast.error('No invoice found for this lead');
        return;
      }
      
      // Find the invoice details
      const invResponse = await axios.get(`${API}/sales-head/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const invoice = invResponse.data.find(inv => inv.id === invoice_id);
      
      if (!invoice) {
        toast.error('Invoice not found');
        return;
      }
      
      // Show confirmation dialog
      const action = await new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/10">
              <h3 class="text-xl font-bold text-white mb-4">Review Invoice</h3>
              <div class="space-y-3 mb-6">
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Client</p>
                  <p class="text-white font-semibold">${invoice.client_name}</p>
                </div>
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Amount</p>
                  <p class="text-green-400 font-bold text-lg">${invoice.amount} AED</p>
                </div>
                <div class="bg-white/5 p-3 rounded">
                  <p class="text-slate-400 text-sm">Requested By</p>
                  <p class="text-white">${invoice.requested_by_name}</p>
                </div>
              </div>
              <div class="flex gap-3">
                <button id="approve-btn" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  ✅ Approve → Send to Accounts
                </button>
                <button id="reject-btn" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                  ❌ Reject
                </button>
                <button id="cancel-btn" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(dialog);
        
        dialog.querySelector('#approve-btn').onclick = () => {
          document.body.removeChild(dialog);
          resolve('approve');
        };
        dialog.querySelector('#reject-btn').onclick = () => {
          document.body.removeChild(dialog);
          resolve('reject');
        };
        dialog.querySelector('#cancel-btn').onclick = () => {
          document.body.removeChild(dialog);
          resolve('cancel');
        };
      });
      
      if (action === 'cancel') return;
      
      const endpoint = action === 'approve' 
        ? `${API}/sales-head/invoices/${invoice_id}/approve`
        : `${API}/sales-head/invoices/${invoice_id}/reject`;
      
      await axios.put(endpoint, {
        comments: action === 'approve' ? 'Approved by Sales Head - Sent to Accounts' : 'Rejected by Sales Head'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(action === 'approve' ? 'Invoice approved and sent to Accounts' : 'Invoice rejected');
      fetchLeads();
      fetchInvoiceRequests();
    } catch (error) {
      console.error('Error handling invoice:', error);
      toast.error('Failed to process invoice');
    }
  };

  // Duplicate management handlers
  const openComparison = (alert) => {
    setSelectedAlert(alert);
    setSelectedAction('different');
    setResolutionNotes('');
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
          notes: resolutionNotes,
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
      fetchLeads();
      fetchDuplicateAlerts();
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
      {/* Duplicate Alerts Section - Priority 1 */}
      {duplicateAlerts.length > 0 && (
        <div className="bg-red-500/10 backdrop-blur-sm rounded-xl border-2 border-red-400/50 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-xl font-bold text-red-300">🔴 Duplicate Lead Alerts</h3>
                <p className="text-sm text-slate-400">Review and resolve potential duplicate submissions</p>
              </div>
            </div>
            <Badge className="bg-red-500/30 text-red-200 text-lg px-4 py-2 border-red-400/50">
              {duplicateAlerts.length} Pending
            </Badge>
          </div>

          <div className="space-y-3">
            {duplicateAlerts.map((alert) => {
              const leadA = alert.lead_a_data || {};
              const leadB = alert.lead_b_data || {};
              const similarityScore = typeof alert.similarity_score === 'string'
                ? parseInt(alert.similarity_score)
                : Math.round(alert.similarity_score * 100);
              
              return (
                <div
                  key={alert.id}
                  className="bg-white/5 rounded-lg p-4 border border-red-400/30 hover:border-red-400/60 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-red-500/20 text-red-300 border-red-400/50">
                          {similarityScore}% Match
                        </Badge>
                        <Badge className="bg-orange-500/20 text-orange-300">
                          HIGH PRIORITY
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-blue-500/10 rounded p-3 border border-blue-400/30">
                          <p className="text-xs text-blue-300 mb-1">LEAD A (First)</p>
                          <p className="text-white font-semibold">{leadA.company_name || 'N/A'}</p>
                          <p className="text-sm text-slate-300">By: {leadA.submitted_by || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">Value: {leadA.lead_value} AED</p>
                        </div>
                        <div className="bg-orange-500/10 rounded p-3 border border-orange-400/30">
                          <p className="text-xs text-orange-300 mb-1">LEAD B (Second)</p>
                          <p className="text-white font-semibold">{leadB.company_name || 'N/A'}</p>
                          <p className="text-sm text-slate-300">By: {leadB.submitted_by || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">Value: {leadB.lead_value} AED</p>
                        </div>
                      </div>

                      {alert.similarity_factors && (
                        <div className="bg-red-500/10 rounded p-2 border border-red-400/30 mb-2">
                          <p className="text-xs text-red-300 font-semibold mb-1">Why Flagged:</p>
                          <ul className="text-xs text-slate-300 space-y-1">
                            {alert.similarity_factors.slice(0, 2).map((factor, idx) => (
                              <li key={idx}>• {factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button
                        onClick={() => openComparison(alert)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Review & Decide
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Sales Head: Quotation & Invoice Request Alerts */}
      {['Sales Head', 'COO', 'MD', 'CEO'].includes(userRole) && (
        <div className="grid grid-cols-2 gap-4">
          {/* Quotation Requests */}
          <div className="bg-purple-500/10 backdrop-blur-sm rounded-xl border border-purple-400/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-purple-300">📋 Quotation Requests</h3>
                <p className="text-sm text-slate-400">Pending review from team</p>
              </div>
              <Badge className="bg-purple-500/30 text-purple-200 text-lg px-3 py-1">
                {quotationRequests.filter(q => q.status === 'pending').length}
              </Badge>
            </div>
            {quotationRequests.filter(q => q.status === 'pending').length > 0 && (
              <Button
                onClick={() => setQuotationRequestOpen(true)}
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
              >
                Review Quotations
              </Button>
            )}
          </div>

          {/* Invoice Requests */}
          <div className="bg-green-500/10 backdrop-blur-sm rounded-xl border border-green-400/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-green-300">💰 Invoice Requests</h3>
                <p className="text-sm text-slate-400">Awaiting approval</p>
              </div>
              <Badge className="bg-green-500/30 text-green-200 text-lg px-3 py-1">
                {invoiceRequests.filter(i => i.status === 'pending').length}
              </Badge>
            </div>
            {invoiceRequests.filter(i => i.status === 'pending').length > 0 && (
              <Button
                onClick={() => setInvoiceRequestOpen(true)}
                className="mt-3 w-full bg-green-600 hover:bg-green-700"
              >
                Review Invoices
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[300px]">
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

        {/* Sales Head Specific Filters */}
        {['Sales Head', 'COO', 'MD', 'CEO'].includes(userRole) && (
          <>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2"
            >
              <option value="all">All Areas</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>

            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </>
        )}
        
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

                    {/* Metro-Style Progress Tracker */}
                    <div className="mb-3">
                      <LeadProgressTracker currentStatus={lead.status} />
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
                      {/* Quotation Button - Shows for both Sales Team and Sales Head */}
                      {(() => {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const isSalesHead = ['Sales Head', 'COO', 'MD', 'CEO'].includes(user.role);
                        
                        // Show quotation status badge if quotation exists
                        if (lead.quotation_status) {
                          const statusConfig = {
                            'Pending': { className: 'border-yellow-400/50 text-yellow-300 animate-pulse', label: '⏳ Pending' },
                            'Approved': { className: 'border-green-400/50 text-green-300', label: '✅ Approved' },
                            'Sent to Client': { className: 'border-blue-400/50 text-blue-300', label: '📤 Sent' },
                            'Rejected': { className: 'border-red-400/50 text-red-300', label: '❌ Rejected' }
                          };
                          const config = statusConfig[lead.quotation_status] || statusConfig['Pending'];
                          
                          if (isSalesHead && lead.quotation_status === 'Pending') {
                            // Sales Head can approve/reject
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className={`${config.className} hover:bg-purple-500/20`}
                                title="Review Quotation Request"
                                onClick={() => handleQuotationApproval(lead)}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                {config.label}
                              </Button>
                            );
                          } else if (lead.quotation_status === 'Approved') {
                            // Approved - show "Send to Client" button
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-400/50 text-green-300 hover:bg-green-500/20"
                                title="Send Quotation to Client"
                                onClick={() => handleSendQuotationToClient(lead)}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                📤 Send to Client
                              </Button>
                            );
                          } else {
                            // Show status only
                            return (
                              <Badge className={`${config.className} text-xs`}>
                                <FileText className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            );
                          }
                        } else {
                          // No quotation yet - Sales team can create
                          if (!isSalesHead) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setQuotationLead(lead);
                                  setQuotationOpen(true);
                                }}
                                className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20"
                                title="Create Quotation"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Quotation
                              </Button>
                            );
                          } else {
                            // Sales Head sees button to create quotation too
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setQuotationLead(lead);
                                  setQuotationOpen(true);
                                }}
                                className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20"
                                title="Create Quotation"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Quotation
                              </Button>
                            );
                          }
                        }
                      })()}

                      {/* Invoice Button - Shows for both Sales Team and Sales Head */}
                      {(() => {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const isSalesHead = ['Sales Head', 'COO', 'MD', 'CEO'].includes(user.role);
                        
                        // Show invoice status badge if invoice exists
                        if (lead.invoice_status) {
                          const statusConfig = {
                            'Pending Sales Head': { className: 'border-yellow-400/50 text-yellow-300 animate-pulse', label: '⏳ Pending' },
                            'Pending Accounts': { className: 'border-blue-400/50 text-blue-300', label: '📊 With Accounts' },
                            'Rejected by Sales Head': { className: 'border-red-400/50 text-red-300', label: '❌ Rejected' },
                            'Sent - Awaiting Payment': { className: 'border-purple-400/50 text-purple-300', label: '📄 Sent' },
                            'Paid': { className: 'border-green-400/50 text-green-300', label: '✅ Paid' }
                          };
                          const config = statusConfig[lead.invoice_status] || statusConfig['Pending Sales Head'];
                          
                          if (isSalesHead && lead.invoice_status === 'Pending Sales Head') {
                            // Sales Head can approve/reject
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className={`${config.className} hover:bg-green-500/20`}
                                title="Review Invoice Request"
                                onClick={() => handleInvoiceApproval(lead)}
                              >
                                <DollarSign className="w-3 h-3 mr-1" />
                                {config.label}
                              </Button>
                            );
                          } else {
                            // Show status only
                            return (
                              <Badge className={`${config.className} text-xs`}>
                                <DollarSign className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            );
                          }
                        } else {
                          // No invoice yet - Both Sales team and Sales Head can create
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-400/50 text-green-300 hover:bg-green-500/20"
                              title="Create Invoice Request"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  await axios.post(`${API}/sales/invoice-requests`, {
                                    lead_id: lead.id,
                                    client_name: lead.client_name || lead.company_name,
                                    amount: lead.lead_value || '0',
                                    description: `Invoice for ${lead.course_name || 'Training Services'}`,
                                    remarks: 'Invoice request from lead tracker'
                                  }, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                
                                  toast.success(isSalesHead ? 'Invoice request created' : 'Invoice request submitted to Sales Head');
                                  fetchLeads();
                                } catch (error) {
                                  console.error('Error requesting invoice:', error);
                                  toast.error('Failed to submit invoice request');
                                }
                              }}
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              Invoice
                            </Button>
                          );
                        }
                      })()}
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

      <UnifiedLeadForm mode="enhanced"
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

      {/* Duplicate Comparison Modal */}
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
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
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
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirm Decision
                  </Button>
                  <Button
                    onClick={() => setComparisonOpen(false)}
                    variant="outline"
                    className="border-white/20 hover:bg-white/10"
                    size="lg"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quotation Dialog */}
      <QuotationDialog
        open={quotationOpen}
        onOpenChange={setQuotationOpen}
        lead={quotationLead}
        onSuccess={fetchLeads}
      />

      {/* Sales Head: Quotation Requests Management Dialog */}
      <Dialog open={quotationRequestOpen} onOpenChange={setQuotationRequestOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">📋 Quotation Requests for {selectedRequest?.lead?.company_name || selectedRequest?.lead?.client_name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review, edit, approve or reject quotation requests
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {(selectedRequest?.requests || []).map((quot) => (
              <div key={quot.id} className="bg-white/5 rounded-lg p-4 border border-purple-400/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg text-white">{quot.client_name || quot.company_name}</h4>
                    <p className="text-sm text-slate-400">By: {quot.created_by_name} • {new Date(quot.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className="bg-purple-500/30 text-purple-200">{quot.status}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Course</p>
                    <p className="text-sm text-white">{quot.course_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="text-sm text-white font-semibold">{quot.total_amount} AED</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Participants</p>
                    <p className="text-sm text-white">{quot.number_of_participants || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Valid Until</p>
                    <p className="text-sm text-white">{quot.valid_until || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setQuotationLead(selectedRequest.lead);
                      setQuotationOpen(true);
                      setQuotationRequestOpen(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.put(`${API}/quotations/${quot.id}`, 
                          { status: 'approved' },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        toast.success('Quotation approved');
                        setQuotationRequestOpen(false);
                        fetchLeads();
                      } catch (error) {
                        toast.error('Failed to approve quotation');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.put(`${API}/quotations/${quot.id}`, 
                          { status: 'rejected' },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        toast.success('Quotation rejected');
                        setQuotationRequestOpen(false);
                        fetchLeads();
                      } catch (error) {
                        toast.error('Failed to reject quotation');
                      }
                    }}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sales Head: Invoice Requests Management Dialog */}
      <Dialog open={invoiceRequestOpen} onOpenChange={setInvoiceRequestOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">💰 Invoice Requests for {selectedRequest?.lead?.company_name || selectedRequest?.lead?.client_name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review, edit, approve or reject invoice requests
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {(selectedRequest?.requests || []).map((inv) => (
              <div key={inv.id} className="bg-white/5 rounded-lg p-4 border border-green-400/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg text-white">{inv.client_name || inv.company_name}</h4>
                    <p className="text-sm text-slate-400">Requested by: {inv.requested_by_name} • {new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className="bg-green-500/30 text-green-200">{inv.status}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Lead ID</p>
                    <p className="text-sm text-white">{inv.lead_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="text-sm text-white font-semibold">{inv.amount || inv.invoice_amount} AED</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400">Notes</p>
                    <p className="text-sm text-white">{inv.notes || inv.description || 'No notes'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // Open edit dialog for invoice
                      toast.info('Edit invoice functionality - Update amount/notes');
                    }}
                    variant="outline"
                    size="sm"
                    className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.put(`${API}/sales/invoice-requests/${inv.id}`, 
                          { status: 'approved' },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        toast.success('Invoice request approved');
                        setInvoiceRequestOpen(false);
                        fetchLeads();
                      } catch (error) {
                        toast.error('Failed to approve invoice request');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.put(`${API}/sales/invoice-requests/${inv.id}`, 
                          { status: 'rejected' },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        toast.success('Invoice request rejected');
                        setInvoiceRequestOpen(false);
                        fetchLeads();
                      } catch (error) {
                        toast.error('Failed to reject invoice request');
                      }
                    }}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadTracker;
