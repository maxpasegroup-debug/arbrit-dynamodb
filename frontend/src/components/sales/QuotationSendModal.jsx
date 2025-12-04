import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { X, Download, Mail, MessageCircle, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function QuotationSendModal({ lead, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendMethod, setSendMethod] = useState('Email');
  const [clientEmail, setClientEmail] = useState('');

  useEffect(() => {
    if (lead && lead.quotation_id) {
      fetchPreview();
    }
  }, [lead]);

  const fetchPreview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/sales/quotations/${lead.quotation_id}/preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPreview(response.data);
      setClientEmail(response.data.contact_email || '');
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast.error('Failed to load quotation preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/sales/quotations/${lead.quotation_id}/generate-pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation_${preview.client_name}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleSendToClient = async () => {
    if (sendMethod === 'Email' && !clientEmail) {
      toast.error('Please enter client email address');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/sales/quotations/${lead.quotation_id}/send-to-client`,
        {
          client_email: clientEmail,
          sent_via: sendMethod,
          client_contact: preview.contact_mobile,
          remarks: `Sent via ${sendMethod}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Quotation sent to client via ${sendMethod}!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast.error('Failed to send quotation');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-50 rounded-xl p-8 border border-gray-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 my-8">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-b border-gray-300 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Quotation Preview
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Review and send to client
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 space-y-6">
          {/* Company Header */}
          <div className="text-center pb-4 border-b border-gray-300">
            <h1 className="text-3xl font-bold text-blue-400">ARBRIT SAFETY</h1>
            <p className="text-gray-500 text-sm mt-1">Professional Safety Training & Consulting</p>
          </div>

          {/* Quotation Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">QUOTATION</h2>
          </div>

          {/* Quotation Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100/50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Quotation Ref</p>
              <p className="text-white font-semibold">{preview.quotation_ref}</p>
            </div>
            <div className="bg-gray-100/50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Valid Until</p>
              <p className="text-white font-semibold">{preview.validity_period}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-gray-100/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Client Details</h3>
            <div className="space-y-2 text-sm">
              <p className="text-white">
                <span className="text-gray-500">Company:</span> {preview.client_name}
              </p>
              <p className="text-white">
                <span className="text-gray-500">Contact Person:</span> {preview.contact_person}
              </p>
              {preview.contact_email && (
                <p className="text-white">
                  <span className="text-gray-500">Email:</span> {preview.contact_email}
                </p>
              )}
              {preview.contact_mobile && (
                <p className="text-white">
                  <span className="text-gray-500">Mobile:</span> {preview.contact_mobile}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Quotation Details</h3>
            <div className="bg-gray-100/50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-white text-sm">#</th>
                    <th className="px-4 py-3 text-left text-white text-sm">Description</th>
                    <th className="px-4 py-3 text-center text-white text-sm">Qty</th>
                    <th className="px-4 py-3 text-right text-white text-sm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-300">
                    <td className="px-4 py-3 text-white">1</td>
                    <td className="px-4 py-3 text-white">{preview.items}</td>
                    <td className="px-4 py-3 text-center text-white">{preview.num_trainees}</td>
                    <td className="px-4 py-3 text-right text-white">
                      AED {preview.total_amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-100/50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="text-white">AED {preview.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT (5%):</span>
                <span className="text-white">AED {preview.vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                <span className="text-white">Grand Total:</span>
                <span className="text-green-400">AED {preview.grand_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Send Options */}
          <div className="bg-gray-100/50 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white">Send to Client</h3>

            {/* Send Method */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Send Via</label>
              <select
                value={sendMethod}
                onChange={(e) => setSendMethod(e.target.value)}
                className="w-full bg-slate-600 text-white rounded-lg px-4 py-2 border border-gray-300"
              >
                <option value="Email">📧 Email</option>
                <option value="WhatsApp">📱 WhatsApp</option>
                <option value="Hand Delivered">💼 Hand Delivered</option>
              </select>
            </div>

            {/* Email Input */}
            {sendMethod === 'Email' && (
              <div>
                <label className="block text-slate-400 text-sm mb-2">Client Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full bg-slate-600 text-white rounded-lg px-4 py-2 border border-gray-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 p-6 flex gap-3">
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="flex-1 border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={handleSendToClient}
            disabled={sending}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {sending ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to Client
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
