import { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Eye, Calendar, Users, MapPin, Award, FileText, TrendingUp, BarChart3, Grid3x3, List, Clock } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainingLibrary = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchRecords();
    fetchStats();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, courseFilter, statusFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/training-library`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching training library:', error);
      toast.error('Failed to load training library');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/training-library/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        (record.company_name || '').toLowerCase().includes(search) ||
        (record.contact_person || '').toLowerCase().includes(search) ||
        (record.contact_mobile || '').toLowerCase().includes(search) ||
        (record.course_name || '').toLowerCase().includes(search) ||
        (record.trainer_name || '').toLowerCase().includes(search)
      );
    }

    if (courseFilter !== 'all') {
      filtered = filtered.filter(record => record.course_name === courseFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const exportToCSV = () => {
    const csv = [
      ['Company', 'Contact', 'Mobile', 'Course', 'Date', 'Location', 'Trainer', 'Participants', 'Status'].join(','),
      ...filteredRecords.map(r => [
        r.company_name,
        r.contact_person,
        r.contact_mobile,
        r.course_name,
        r.training_date,
        r.training_location,
        r.trainer_name,
        r.participants_count,
        r.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training_library_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported to CSV!');
  };

  const getUniqueCourses = () => {
    const courses = [...new Set(records.map(r => r.course_name).filter(Boolean))];
    return courses.sort();
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Training History Library
            </h2>
            <p className="text-blue-100 mt-1">Complete archive of all trainings conducted by Arbrit</p>
          </div>
          <Button
            onClick={() => window.location.href = '#add-training'}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Past Training
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5" />
                <p className="text-sm text-blue-100">Total Trainings</p>
              </div>
              <p className="text-3xl font-bold">{stats.total_trainings}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <p className="text-sm text-blue-100">Participants</p>
              </div>
              <p className="text-3xl font-bold">{stats.total_participants}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <p className="text-sm text-blue-100">Companies</p>
              </div>
              <p className="text-3xl font-bold">{stats.unique_companies}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5" />
                <p className="text-sm text-blue-100">Courses</p>
              </div>
              <p className="text-3xl font-bold">{stats.unique_courses}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5" />
                <p className="text-sm text-blue-100">Certificates</p>
              </div>
              <p className="text-3xl font-bold">{stats.certificates_issued}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company, contact person, mobile, course, or trainer..."
                className="pl-10 bg-slate-800 border-white/10 text-slate-100"
              />
            </div>
          </div>

          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[200px] bg-slate-800 border-white/10 text-slate-100">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="all">All Courses</SelectItem>
              {getUniqueCourses().map(course => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800 border-white/10 text-slate-100">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="border-white/20"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="border-white/20"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={exportToCSV}
            className="border-white/20 hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <p>Showing {filteredRecords.length} of {records.length} training records</p>
      </div>

      {/* Training Records Grid/List */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        {loading ? (
          <p className="text-center py-12 text-slate-400">Loading training library...</p>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {searchTerm || courseFilter !== 'all' || statusFilter !== 'all' 
                ? 'No training records match your filters' 
                : 'No training records yet'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => handleViewDetails(record)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg mb-1">
                      {record.company_name}
                    </h3>
                    <p className="text-sm text-slate-400">{record.contact_person}</p>
                  </div>
                  <Badge className={`${
                    record.status === 'completed' 
                      ? 'bg-green-500/20 text-green-300 border-green-400/50' 
                      : 'bg-red-500/20 text-red-300 border-red-400/50'
                  }`}>
                    {record.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="font-medium">{record.course_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(record.training_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span>{record.training_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{record.participants_count} Participants</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-blue-400/50 hover:bg-blue-500/20 text-blue-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(record);
                  }}
                >
                  <Eye className="w-3 h-3 mr-2" />
                  View Details
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between"
                onClick={() => handleViewDetails(record)}
              >
                <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="font-semibold text-white">{record.company_name}</p>
                    <p className="text-sm text-slate-400">{record.contact_person}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">{record.course_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{new Date(record.training_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{record.participants_count} pax</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${
                      record.status === 'completed' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {record.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(record);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              Training Record Details
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete information about this training session
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6 mt-4">
              {/* Company Information */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Company Name</p>
                    <p className="text-white font-medium">{selectedRecord.company_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Contact Person</p>
                    <p className="text-white">{selectedRecord.contact_person}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Mobile</p>
                    <p className="text-white">{selectedRecord.contact_mobile}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Email</p>
                    <p className="text-white">{selectedRecord.contact_email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Training Details */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Training Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Course Name</p>
                    <p className="text-white font-medium">{selectedRecord.course_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Training Date</p>
                    <p className="text-white">{new Date(selectedRecord.training_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Location</p>
                    <p className="text-white">{selectedRecord.training_location}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Duration</p>
                    <p className="text-white">{selectedRecord.duration_days} day(s)</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Trainer</p>
                    <p className="text-white">{selectedRecord.trainer_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Participants</p>
                    <p className="text-white font-semibold">{selectedRecord.participants_count} persons</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Certificate Issued</p>
                    <Badge className={selectedRecord.certificate_issued ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                      {selectedRecord.certificate_issued ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <Badge className={`${
                      selectedRecord.status === 'completed' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {selectedRecord.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {selectedRecord.invoice_number && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Invoice Number</p>
                      <p className="text-white font-medium">{selectedRecord.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Amount</p>
                      <p className="text-green-400 font-semibold text-lg">{selectedRecord.invoice_amount} AED</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Payment Status</p>
                      <Badge className="bg-green-500/20 text-green-300">{selectedRecord.payment_status}</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                  <p className="text-slate-300 text-sm">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingLibrary;
