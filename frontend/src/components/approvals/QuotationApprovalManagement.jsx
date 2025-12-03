import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, FileText, Clock, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationApprovalManagement = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/quotation-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotations(response.data || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to load quotation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (quotation) => {
    setSelectedQuotation(quotation);
    setViewDialogOpen(true);
  };

  const handleOpenActionDialog = (quotation, action) => {
    setSelectedQuotation(quotation);
    setActionType(action);
    setComments('');
    setActionDialogOpen(true);
  };

  const handleApproveReject = async () => {
    if (!selectedQuotation) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = actionType === 'approve' 
        ? `${API}/academic/quotations/${selectedQuotation.id}/approve`
        : `${API}/academic/quotations/${selectedQuotation.id}/reject`;

      await axios.put(endpoint, 
        { comments },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Quotation ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      setActionDialogOpen(false);
      fetchQuotations();
    } catch (error) {
      console.error(`Error ${actionType}ing quotation:`, error);
      toast.error(`Failed to ${actionType} quotation`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      'Approved': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      'Rejected': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle }
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
        <div className="text-gray-400">Loading quotation requests...</div>
      </div>
    );
  }

  const pendingQuotations = quotations.filter(q => q.status === 'Pending' || q.status === 'pending');
  const processedQuotations = quotations.filter(q => q.status !== 'Pending' && q.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Quotation Approval Management</h2>
        <p className="text-gray-300">Review and approve quotation requests from the sales team</p>
      </div>

      {/* Pending Quotations */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending Approval ({pendingQuotations.length})
        </h3>

        {pendingQuotations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pending quotations to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingQuotations.map((quotation) => (
              <div 
                key={quotation.id}
                className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{quotation.client_name}</h4>
                      {getStatusBadge(quotation.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <User className="w-4 h-4" />
                        <span>By: {quotation.created_by_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <DollarSign className="w-4 h-4" />
                        <span>Amount: AED {quotation.total_amount?.toLocaleString() || 0}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2">
                      {quotation.items || quotation.remarks || 'No description provided'}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(quotation)}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenActionDialog(quotation, 'approve')}
                      className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenActionDialog(quotation, 'reject')}
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

      {/* Processed Quotations */}
      {processedQuotations.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recently Processed</h3>
          <div className="space-y-3">
            {processedQuotations.slice(0, 5).map((quotation) => (
              <div 
                key={quotation.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium">{quotation.client_name}</p>
                  <p className="text-sm text-gray-400">AED {quotation.total_amount?.toLocaleString() || 0}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(quotation.status)}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(quotation)}
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
            <DialogTitle className="text-2xl">Quotation Details</DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Client Name</p>
                  <p className="text-white font-medium">{selectedQuotation.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="text-white font-medium">AED {selectedQuotation.total_amount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Created By</p>
                  <p className="text-white font-medium">{selectedQuotation.created_by_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedQuotation.status)}</div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Items / Description</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-white whitespace-pre-wrap">{selectedQuotation.items || selectedQuotation.remarks || 'No description'}</p>
                </div>
              </div>

              {selectedQuotation.comments && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Comments</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-white">{selectedQuotation.comments}</p>
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
              {actionType === 'approve' ? 'Approve Quotation' : 'Reject Quotation'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === 'approve' 
                ? 'Add any comments for the sales team (optional)'
                : 'Please provide a reason for rejection'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQuotation && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-sm text-gray-400">Client</p>
                <p className="text-white font-medium">{selectedQuotation.client_name}</p>
                <p className="text-sm text-gray-400 mt-2">Amount</p>
                <p className="text-white font-medium">AED {selectedQuotation.total_amount?.toLocaleString() || 0}</p>
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
                {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationApprovalManagement;
