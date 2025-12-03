import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Receipt, Clock, DollarSign, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoiceApprovalManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/invoice-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoice requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleOpenActionDialog = (invoice, action) => {
    setSelectedInvoice(invoice);
    setActionType(action);
    setComments('');
    setActionDialogOpen(true);
  };

  const handleApproveReject = async () => {
    if (!selectedInvoice) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = actionType === 'approve' 
        ? `${API}/academic/invoice-requests/${selectedInvoice.id}/approve`
        : `${API}/academic/invoice-requests/${selectedInvoice.id}/reject`;

      await axios.put(endpoint, 
        { comments },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Invoice request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      setActionDialogOpen(false);
      fetchInvoices();
    } catch (error) {
      console.error(`Error ${actionType}ing invoice:`, error);
      toast.error(`Failed to ${actionType} invoice request`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      'Approved': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      'Rejected': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
      'Processed': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Receipt }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading invoice requests...</div>
      </div>
    );
  }

  const pendingInvoices = invoices.filter(i => i.status === 'Pending' || i.status === 'pending');
  const processedInvoices = invoices.filter(i => i.status !== 'Pending' && i.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Invoice Approval Management</h2>
        <p className="text-gray-300">Review and approve invoice requests from the sales team</p>
      </div>

      {/* Pending Invoices */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending Approval ({pendingInvoices.length})
        </h3>

        {pendingInvoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pending invoice requests to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingInvoices.map((invoice) => (
              <div 
                key={invoice.id}
                className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{invoice.client_name}</h4>
                      {getStatusBadge(invoice.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <User className="w-4 h-4" />
                        <span>Requested by: {invoice.requested_by_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <DollarSign className="w-4 h-4" />
                        <span>Amount: AED {Number(invoice.amount).toLocaleString()}</span>
                      </div>
                      {invoice.quotation_ref && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <FileText className="w-4 h-4" />
                          <span>Ref: {invoice.quotation_ref}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2">
                      {invoice.description || invoice.remarks || 'No description provided'}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(invoice)}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenActionDialog(invoice, 'approve')}
                      className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenActionDialog(invoice, 'reject')}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Invoices */}
      {processedInvoices.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recently Processed</h3>
          <div className="space-y-3">
            {processedInvoices.slice(0, 5).map((invoice) => (
              <div 
                key={invoice.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium">{invoice.client_name}</p>
                  <p className="text-sm text-gray-400">AED {Number(invoice.amount).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(invoice.status)}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(invoice)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Invoice Request Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Client Name</p>
                  <p className="text-white font-medium">{selectedInvoice.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="text-white font-medium">AED {Number(selectedInvoice.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Requested By</p>
                  <p className="text-white font-medium">{selectedInvoice.requested_by_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                {selectedInvoice.quotation_ref && (
                  <div>
                    <p className="text-sm text-gray-400">Quotation Reference</p>
                    <p className="text-white font-medium">{selectedInvoice.quotation_ref}</p>
                  </div>
                )}
              </div>
              
              {selectedInvoice.description && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Description</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-white whitespace-pre-wrap">{selectedInvoice.description}</p>
                  </div>
                </div>
              )}

              {selectedInvoice.remarks && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Remarks</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-white whitespace-pre-wrap">{selectedInvoice.remarks}</p>
                  </div>
                </div>
              )}

              {selectedInvoice.comments && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Comments</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-white">{selectedInvoice.comments}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {actionType === 'approve' ? 'Approve Invoice Request' : 'Reject Invoice Request'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === 'approve' 
                ? 'Approved invoices will be sent to Accounts department for processing'
                : 'Please provide a reason for rejection'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInvoice && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-sm text-gray-400">Client</p>
                <p className="text-white font-medium">{selectedInvoice.client_name}</p>
                <p className="text-sm text-gray-400 mt-2">Amount</p>
                <p className="text-white font-medium">AED {Number(selectedInvoice.amount).toLocaleString()}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Comments {actionType === 'reject' && <span className="text-red-400">*</span>}
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={actionType === 'approve' ? 'Add any notes...' : 'Reason for rejection...'}
                className="bg-white/5 border-white/10 text-white"
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                disabled={processing}
                className="border-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveReject}
                disabled={processing || (actionType === 'reject' && !comments.trim())}
                className={actionType === 'approve' 
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                }
              >
                {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve & Send to Accounts' : 'Reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceApprovalManagement;
