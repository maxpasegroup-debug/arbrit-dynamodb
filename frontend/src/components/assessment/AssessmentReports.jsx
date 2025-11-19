import { useState, useEffect } from 'react';
import { FileDown, Filter, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssessmentReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    form_id: '',
    trainer_id: '',
    branch: '',
    start_date: '',
    end_date: ''
  });
  const [forms, setForms] = useState([]);

  useEffect(() => {
    fetchForms();
    fetchReports();
  }, []);

  const fetchForms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/assessment/forms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForms(response.data);
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${API}/assessment/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.form_id) params.append('form_id', filters.form_id);
      if (filters.trainer_id) params.append('trainer_id', filters.trainer_id);

      const response = await axios.get(`${API}/assessment/reports/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Convert to CSV
      const csvData = response.data.data;
      if (!csvData || csvData.length === 0) {
        toast.error('No data to export');
        return;
      }

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => 
            JSON.stringify(row[header] || '')
          ).join(',')
        )
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-reports-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Assessment Reports & Analytics</h2>
        <Button onClick={exportToCSV}>
          <FileDown className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Form</Label>
              <select
                value={filters.form_id}
                onChange={(e) => setFilters({ ...filters, form_id: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2"
              >
                <option value="">All Forms</option>
                {forms.map(form => (
                  <option key={form.id} value={form.id}>{form.title}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Branch</Label>
              <select
                value={filters.branch}
                onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2"
              >
                <option value="">All Branches</option>
                <option value="Dubai">Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
              </select>
            </div>

            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  placeholder="Start"
                />
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  placeholder="End"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchReports} disabled={loading}>
              {loading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reports && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">{reports.total_responses}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Forms with Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">{reports.forms_summary?.length || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Average Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {reports.forms_summary?.length > 0 
                    ? Math.round(reports.total_responses / reports.forms_summary.length)
                    : 0
                  } per form
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Forms Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Form-wise Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.forms_summary && reports.forms_summary.length > 0 ? (
                <div className="space-y-4">
                  {reports.forms_summary.map((form) => (
                    <div key={form.form_id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{form.form_title}</h3>
                          <div className="text-sm text-slate-600 mt-1 space-y-1">
                            {form.course_name && <p>Course: {form.course_name}</p>}
                            {form.batch_name && <p>Batch: {form.batch_name}</p>}
                            {form.trainer_name && <p>Trainer: {form.trainer_name}</p>}
                          </div>
                        </div>
                        <Badge className="bg-blue-500">{form.response_count} responses</Badge>
                      </div>

                      {/* Average Ratings */}
                      {form.average_ratings && Object.keys(form.average_ratings).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-sm font-medium text-slate-700 mb-2">Average Ratings:</p>
                          <div className="space-y-2">
                            {Object.entries(form.average_ratings).map(([qId, avg]) => {
                              const question = form.responses[0]?.responses?.find(r => r.question_id === qId);
                              return (
                                <div key={qId} className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600">{question?.question_text || 'Question'}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} className={star <= avg ? 'text-yellow-500' : 'text-slate-300'}>★</span>
                                      ))}
                                    </div>
                                    <span className="font-semibold text-slate-900">{avg}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-slate-500">No data available for the selected filters</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!reports && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Apply filters to view reports</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssessmentReports;