import { useState } from 'react';
import { Upload, Plus, FileText, Download, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddPastTraining = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [loading, setLoading] = useState(false);
  
  // Manual form state
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    contact_mobile: '',
    contact_email: '',
    course_name: '',
    training_date: '',
    training_location: '',
    trainer_name: '',
    trainer_qualification: '',
    participants_count: '',
    duration_days: '1',
    certificate_issued: 'true',
    invoice_number: '',
    invoice_amount: '',
    payment_status: 'paid',
    notes: '',
    status: 'completed'
  });

  // Bulk upload state
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkData, setBulkData] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/training-library`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Training record added successfully!');
      
      // Reset form
      setFormData({
        company_name: '',
        contact_person: '',
        contact_mobile: '',
        contact_email: '',
        course_name: '',
        training_date: '',
        training_location: '',
        trainer_name: '',
        trainer_qualification: '',
        participants_count: '',
        duration_days: '1',
        certificate_issued: 'true',
        invoice_number: '',
        invoice_amount: '',
        payment_status: 'paid',
        notes: '',
        status: 'completed'
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding training record:', error);
      toast.error('Failed to add training record');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim());
      
      if (rows.length < 2) {
        toast.error('CSV file must have a header row and at least one data row');
        return;
      }

      const headers = rows[0].split(',').map(h => h.trim());
      const data = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim());
        const record = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        return record;
      });

      setBulkData(data);
      setBulkFile(file);
      toast.success(`Loaded ${data.length} records from CSV`);
    };

    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkData.length === 0) {
      toast.error('Please upload a CSV file first');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/training-library/bulk-upload`, bulkData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(response.data.message);
      
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('Bulk upload errors:', response.data.errors);
        toast.warning(`${response.data.errors.length} rows had errors. Check console for details.`);
      }

      setBulkFile(null);
      setBulkData([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error bulk uploading:', error);
      toast.error('Failed to bulk upload training records');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      'company_name,contact_person,contact_mobile,contact_email,course_name,training_date,training_location,trainer_name,participants_count,duration_days,certificate_issued,invoice_number,invoice_amount,payment_status,notes,status',
      'Al Futtaim Group,Ahmed Hassan,971501234567,ahmed@alfuttaim.ae,Fire Safety Training,2024-01-15,Dubai,John Trainer,50,2,yes,INV-2024-001,15000,paid,Excellent training session,completed',
      'ENOC Group,Sara Ali,971509876543,sara@enoc.ae,First Aid Training,2024-02-20,Abu Dhabi,Mary Coach,30,1,yes,INV-2024-002,8000,paid,,completed'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training_library_template.csv';
    a.click();
    toast.success('Template downloaded!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Plus className="w-8 h-8" />
          Add Past Training Records
        </h2>
        <p className="text-purple-100">Import your historical training data to build a comprehensive library</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-white/10">
          <TabsTrigger value="manual" className="data-[state=active]:bg-blue-500/20">
            <FileText className="w-4 h-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-purple-500/20">
            <Upload className="w-4 h-4 mr-2" />
            Bulk CSV Upload
          </TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="mt-6">
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Company & Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Company Name *</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    required
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Contact Person *</Label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    required
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Mobile *</Label>
                  <Input
                    value={formData.contact_mobile}
                    onChange={(e) => handleInputChange('contact_mobile', e.target.value)}
                    required
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Training Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Course Name *</Label>
                  <Input
                    value={formData.course_name}
                    onChange={(e) => handleInputChange('course_name', e.target.value)}
                    required
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Training Date *</Label>
                  <Input
                    type="date"
                    value={formData.training_date}
                    onChange={(e) => handleInputChange('training_date', e.target.value)}
                    required
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Location *</Label>
                  <Input
                    value={formData.training_location}
                    onChange={(e) => handleInputChange('training_location', e.target.value)}
                    required
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Trainer Name *</Label>
                  <Input
                    value={formData.trainer_name}
                    onChange={(e) => handleInputChange('trainer_name', e.target.value)}
                    required
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Number of Participants *</Label>
                  <Input
                    type="number"
                    value={formData.participants_count}
                    onChange={(e) => handleInputChange('participants_count', e.target.value)}
                    required
                    min="1"
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Duration (Days)</Label>
                  <Input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => handleInputChange('duration_days', e.target.value)}
                    min="1"
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Certificate Issued</Label>
                  <Select value={formData.certificate_issued} onValueChange={(val) => handleInputChange('certificate_issued', val)}>
                    <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Status</Label>
                  <Select value={formData.status} onValueChange={(val) => handleInputChange('status', val)}>
                    <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Information (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Invoice Number</Label>
                  <Input
                    value={formData.invoice_number}
                    onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Invoice Amount (AED)</Label>
                  <Input
                    type="number"
                    value={formData.invoice_amount}
                    onChange={(e) => handleInputChange('invoice_amount', e.target.value)}
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Additional Notes</h3>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about this training..."
                className="bg-slate-800 border-white/10 text-white min-h-[100px]"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {loading ? 'Adding...' : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Add Training Record
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk" className="mt-6">
          <div className="space-y-6">
            <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">CSV Template</h3>
              <p className="text-slate-400 mb-4">
                Download our CSV template to see the required format. Fill in your historical training data and upload it below.
              </p>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="border-white/20 hover:bg-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>
            </div>

            <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upload CSV File</h3>
              
              {!bulkFile ? (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 mb-2">Drag and drop your CSV file here, or click to browse</p>
                  <p className="text-slate-500 text-sm mb-4">CSV files only, max 10MB</p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button asChild variant="outline" className="border-white/20 hover:bg-white">
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-white font-semibold">{bulkFile.name}</p>
                        <p className="text-slate-400 text-sm">{bulkData.length} training records loaded</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setBulkFile(null);
                        setBulkData([]);
                      }}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleBulkSubmit}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {loading ? 'Uploading...' : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload {bulkData.length} Records
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">Tips for Bulk Upload:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Ensure all required fields are filled: company_name, contact_person, contact_mobile, course_name, training_date, training_location, trainer_name</li>
                <li>• Use date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                <li>• Certificate issued: use "yes", "true", or "1" for issued certificates</li>
                <li>• Participants count should be a number</li>
                <li>• Status: use "completed" or "cancelled"</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddPastTraining;
