import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VATReports = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/accounts/vat-report?start_date=${startDate}&end_date=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportData(response.data);
      toast.success('VAT report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate VAT report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const csvContent = [
      ['VAT Report'],
      [`Period: ${reportData.period.start_date} to ${reportData.period.end_date}`],
      [],
      ['Summary'],
      ['Total Sales (Excl. VAT)', reportData.summary.total_sales_excluding_vat],
      ['VAT Collected (5%)', reportData.summary.total_vat_collected],
      ['Total Sales (Incl. VAT)', reportData.summary.total_sales_including_vat],
      ['Total Invoices', reportData.summary.invoice_count],
      [],
      ['Invoice Details'],
      ['Invoice Number', 'Client', 'Date', 'Subtotal', 'VAT', 'Total'],
      ...reportData.invoices.map(inv => [
        inv.invoice_number,
        inv.client_name,
        new Date(inv.created_at).toLocaleDateString(),
        inv.subtotal,
        inv.vat_amount,
        inv.total_amount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VAT_Report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">VAT Reports</h2>
        <p className="text-gray-400">Generate VAT reports for TRA submission (UAE 5% VAT)</p>
      </div>

      {/* Report Parameters */}
      <Card className="bg-slate-900 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-white">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-white">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {reportData && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Report Summary</h3>
            <Button onClick={exportReport} className="bg-green-500 hover:bg-green-600">
              <Download className="w-4 h-4 mr-2" />
              Export to CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border-blue-500/30">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-400">Sales (Excl. VAT)</p>
                <p className="text-2xl font-bold text-white mt-2">
                  AED {reportData.summary.total_sales_excluding_vat.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/20 to-slate-900/40 border-green-500/30">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-400">VAT Collected (5%)</p>
                <p className="text-2xl font-bold text-green-400 mt-2">
                  AED {reportData.summary.total_vat_collected.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900/40 border-purple-500/30">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-400">Total (Incl. VAT)</p>
                <p className="text-2xl font-bold text-white mt-2">
                  AED {reportData.summary.total_sales_including_vat.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/20 to-slate-900/40 border-yellow-500/30">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-400">Total Invoices</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {reportData.summary.invoice_count}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Details */}
          <Card className="bg-slate-900 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-300">Invoice #</TableHead>
                    <TableHead className="text-gray-300">Client</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Subtotal</TableHead>
                    <TableHead className="text-gray-300">VAT (5%)</TableHead>
                    <TableHead className="text-gray-300">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-white/10">
                      <TableCell className="text-white">{invoice.invoice_number}</TableCell>
                      <TableCell className="text-white">{invoice.client_name}</TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-white">AED {invoice.subtotal?.toLocaleString()}</TableCell>
                      <TableCell className="text-green-400">AED {invoice.vat_amount?.toLocaleString()}</TableCell>
                      <TableCell className="text-white font-semibold">AED {invoice.total_amount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!reportData && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a date range and generate report to view VAT details</p>
        </div>
      )}
    </div>
  );
};

export default VATReports;