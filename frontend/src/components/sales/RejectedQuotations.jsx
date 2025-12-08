import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Edit, Send, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import QuotationDialog from './QuotationDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RejectedQuotations = () => {
  const [rejectedQuotations, setRejectedQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);

  useEffect(() => {
    fetchRejectedQuotations();
  }, []);

  const fetchRejectedQuotations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/quotations/rejected`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRejectedQuotations(response.data.quotations || []);
    } catch (error) {
      console.error('Error fetching rejected quotations:', error);
      toast.error('Failed to load rejected quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (quotationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API}/sales/quotations/${quotationId}/resubmit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message || 'Quotation resubmitted successfully!');
      fetchRejectedQuotations(); // Refresh the list
    } catch (error) {
      console.error('Error resubmitting quotation:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to resubmit quotation';
      toast.error(errorMsg);
    }
  };

  const openRevisionDialog = (quotation) => {
    setSelectedQuotation(quotation);
    setShowRevisionDialog(true);
  };

  if (rejectedQuotations.length === 0 && !loading) {
    return null; // Don't show component if no rejected quotations
  }

  return (
    <>
      <Card className="bg-red-500/10 border-red-400/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <CardTitle className="text-white">
                Rejected Quotations - Revision Required
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRejectedQuotations}
              disabled={loading}
              className="border-red-400/50 text-red-300 hover:bg-red-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription className="text-slate-300">
            {rejectedQuotations.length} quotation(s) need your attention. Review the feedback and revise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rejectedQuotations.map((quotation) => (
              <div
                key={quotation.id}
                className="p-4 bg-slate-800/50 border border-red-400/20 rounded-lg hover:border-red-400/40 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-slate-100 font-semibold">
                      {quotation.client_name}
                    </h4>
                    <p className="text-sm text-slate-400">
                      Total: <span className="text-red-300 font-semibold">{quotation.total_amount} AED</span>
                    </p>
                  </div>
                  <Badge className="bg-red-500/20 text-red-300 border-red-400/50">
                    Revision Required
                  </Badge>
                </div>

                {/* Rejection Feedback - Most Important! */}
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded">
                  <p className="text-xs text-yellow-300 font-semibold mb-1">
                    Feedback from {quotation.rejected_by_name || 'Sales Head'}:
                  </p>
                  <p className="text-sm text-slate-200">
                    {quotation.rejection_reason || quotation.comments || 'No feedback provided'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>
                    Rejected: {quotation.rejected_at ? new Date(quotation.rejected_at).toLocaleDateString() : 'N/A'}
                  </span>
                  <span>
                    Revision: v{quotation.revision_count || 0}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => openRevisionDialog(quotation)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Revise Quotation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResubmit(quotation.id)}
                    className="flex-1 border-green-400/50 text-green-300 hover:bg-green-500/20"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Resubmit As-Is
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revision Dialog */}
      {selectedQuotation && (
        <QuotationDialog
          open={showRevisionDialog}
          onOpenChange={setShowRevisionDialog}
          lead={null}
          existingQuotation={selectedQuotation}
          isRevision={true}
          onSuccess={() => {
            fetchRejectedQuotations();
            setShowRevisionDialog(false);
          }}
        />
      )}
    </>
  );
};

export default RejectedQuotations;
