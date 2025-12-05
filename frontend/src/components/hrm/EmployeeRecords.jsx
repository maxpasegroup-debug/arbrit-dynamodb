import { useEffect, useState } from 'react';
import { Upload, FileText, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeRecords = () => {
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [formData, setFormData] = useState({
    doc_type: '',
    file: null,
    expiry_date: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchAlerts();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDocumentsForEmployee = async (employeeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/employee-documents/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/employee-documents/alerts/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleEmployeeChange = (employeeId) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      fetchDocumentsForEmployee(employeeId);
    } else {
      setDocuments([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedEmployee || !formData.doc_type || !formData.file || !formData.expiry_date) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const fileData = await convertFileToBase64(formData.file);

      await axios.post(
        `${API}/hrm/employee-documents`,
        {
          employee_id: selectedEmployee,
          doc_type: formData.doc_type,
          file_name: formData.file.name,
          file_data: fileData,
          expiry_date: formData.expiry_date
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Document uploaded successfully');
      setShowDialog(false);
      setFormData({ doc_type: '', file: null, expiry_date: '' });
      fetchDocumentsForEmployee(selectedEmployee);
      fetchAlerts();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/hrm/employee-documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Document deleted successfully');
      fetchDocumentsForEmployee(selectedEmployee);
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Expiry Alerts */}
      {alerts.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-300 mb-2">Document Expiry Alerts</h4>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-center justify-between p-2 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div>
                      <p className="text-sm font-medium">
                        {alert.employee_name} - {alert.doc_type}
                      </p>
                      <p className="text-xs opacity-80">
                        Expires: {alert.expiry_date} ({alert.days_until_expiry} days remaining)
                      </p>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                      {alert.severity === 'critical' ? 'Urgent' : alert.severity === 'warning' ? 'Soon' : 'Upcoming'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Selection */}
      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <Label className="text-gray-300 mb-2 block">Select Employee</Label>
            <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
              <SelectTrigger data-testid="employee-select" className="bg-slate-900 border-white/20 text-white">
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} - {emp.branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            data-testid="upload-document-button"
            onClick={() => setShowDialog(true)}
            disabled={!selectedEmployee}
            style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
            className="text-[#0a1e3d] font-semibold"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Documents List */}
        {selectedEmployee && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Employee Documents</h4>
            {documents.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No documents uploaded yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const daysUntilExpiry = Math.floor((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={doc.id} className="bg-slate-900 border border-white/10 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="w-5 h-5 text-purple-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-white font-medium">{doc.doc_type}</p>
                            <p className="text-sm text-gray-400 mt-1">{doc.file_name}</p>
                            <p className="text-xs text-gray-500 mt-1">Expiry: {doc.expiry_date}</p>
                            {daysUntilExpiry <= 30 && (
                              <Badge className={`mt-2 ${getSeverityColor(daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 15 ? 'warning' : 'info')}`}>
                                {daysUntilExpiry} days remaining
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDelete(doc.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload Employee Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label className="text-gray-300">Document Type</Label>
              <Select value={formData.doc_type} onValueChange={(value) => setFormData({ ...formData, doc_type: value })}>
                <SelectTrigger data-testid="doc-type-select" className="bg-slate-900 border-white/20 text-white mt-1">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="Emirates ID">Emirates ID</SelectItem>
                  <SelectItem value="Work Permit">Work Permit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Upload File</Label>
              <Input
                data-testid="doc-file-input"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="bg-slate-900 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Expiry Date</Label>
              <Input
                data-testid="doc-expiry-input"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="bg-slate-900 border-white/20 text-white mt-1"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setFormData({ doc_type: '', file: null, expiry_date: '' });
                }}
                className="border-white/20 text-white hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-document-button"
                type="submit"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
                className="text-[#0a1e3d] font-semibold"
              >
                Upload Document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeRecords;