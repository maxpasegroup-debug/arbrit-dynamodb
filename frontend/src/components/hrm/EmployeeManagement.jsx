import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    branch: '',
    email: '',
    designation: '',
    department: '',
    badge_title: '',
    sales_type: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setEditMode(true);
      setCurrentEmployee(employee);
      setFormData({
        name: employee.name,
        mobile: employee.mobile,
        branch: employee.branch,
        email: employee.email || '',
        designation: employee.designation || '',
        department: employee.department || '',
        badge_title: employee.badge_title || '',
        sales_type: employee.sales_type || ''
      });
    } else {
      setEditMode(false);
      setCurrentEmployee(null);
      setFormData({
        name: '',
        mobile: '',
        branch: '',
        email: '',
        designation: '',
        department: '',
        badge_title: '',
        sales_type: ''
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditMode(false);
    setCurrentEmployee(null);
    setFormData({
      name: '',
      mobile: '',
      branch: '',
      email: '',
      designation: '',
      department: '',
      badge_title: '',
      sales_type: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.mobile || !formData.branch) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (editMode) {
        await axios.put(
          `${API}/hrm/employees/${currentEmployee.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Employee updated successfully');
      } else {
        await axios.post(
          `${API}/hrm/employees`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Employee added successfully');
      }
      
      handleCloseDialog();
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/hrm/employees/${employee.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      emp.name.toLowerCase().includes(search) ||
      emp.mobile.includes(search) ||
      emp.branch.toLowerCase().includes(search) ||
      (emp.email && emp.email.toLowerCase().includes(search)) ||
      (emp.designation && emp.designation.toLowerCase().includes(search))
    );
    
    const matchesBranch = !filterBranch || filterBranch === 'all' || emp.branch === filterBranch;
    const matchesDepartment = !filterDepartment || filterDepartment === 'all' || emp.department === filterDepartment;
    
    return matchesSearch && matchesBranch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-300 text-sm mb-2 block">Branch</Label>
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger data-testid="filter-branch" className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="Dubai">Dubai</SelectItem>
                <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-300 text-sm mb-2 block">Department</Label>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger data-testid="filter-department" className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Accounts">Accounts</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Dispatch">Dispatch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            {(filterBranch || filterDepartment) && (
              <Button
                onClick={() => {
                  setFilterBranch('');
                  setFilterDepartment('');
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 w-full"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            data-testid="search-employee"
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>
        <Button
          data-testid="add-employee-button"
          onClick={() => handleOpenDialog()}
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
          className="text-[#0a1e3d] font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Employee Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-gray-300">Name</TableHead>
              <TableHead className="text-gray-300">Mobile</TableHead>
              <TableHead className="text-gray-300">Designation</TableHead>
              <TableHead className="text-gray-300">Branch</TableHead>
              <TableHead className="text-gray-300">Department</TableHead>
              <TableHead className="text-gray-300">Sales Type</TableHead>
              <TableHead className="text-gray-300">Badge</TableHead>
              <TableHead className="text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  {searchTerm ? 'No employees found matching your search' : 'No employees added yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="border-white/10 hover:bg-white/5" data-testid={`employee-row-${employee.id}`}>
                  <TableCell className="text-white font-medium">{employee.name}</TableCell>
                  <TableCell className="text-gray-300">{employee.mobile}</TableCell>
                  <TableCell className="text-gray-300">{employee.designation || '-'}</TableCell>
                  <TableCell className="text-gray-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                      {employee.branch}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300">{employee.department || '-'}</TableCell>
                  <TableCell className="text-gray-300">
                    {employee.sales_type ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.sales_type === 'tele' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                      }`}>
                        {employee.sales_type === 'tele' ? 'Tele Sales' : employee.sales_type === 'field' ? 'Field Sales' : '-'}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-gray-300">{employee.badge_title || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        data-testid={`edit-employee-${employee.id}`}
                        onClick={() => handleOpenDialog(employee)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        data-testid={`delete-employee-${employee.id}`}
                        onClick={() => handleDelete(employee)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editMode ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Name *</Label>
              <Input
                id="name"
                data-testid="employee-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mobile" className="text-gray-300">Mobile *</Label>
              <Input
                id="mobile"
                data-testid="employee-mobile-input"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="branch" className="text-gray-300">Branch *</Label>
              <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value })}>
                <SelectTrigger data-testid="employee-branch-select" className="bg-white/5 border-white/20 text-white mt-1">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  <SelectItem value="Dubai">Dubai</SelectItem>
                  <SelectItem value="Saudi">Saudi</SelectItem>
                  <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                data-testid="employee-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="designation" className="text-gray-300">Designation</Label>
              <Input
                id="designation"
                data-testid="employee-designation-input"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="department" className="text-gray-300">Department</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger data-testid="employee-department-select" className="bg-white/5 border-white/20 text-white mt-1">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Accounts">Accounts</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Dispatch">Dispatch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.department === 'Sales' && (
              <>
                <div>
                  <Label htmlFor="sales_type" className="text-gray-300">Sales Type *</Label>
                  <Select value={formData.sales_type} onValueChange={(value) => setFormData({ ...formData, sales_type: value })}>
                    <SelectTrigger data-testid="employee-salestype-select" className="bg-white/5 border-white/20 text-white mt-1">
                      <SelectValue placeholder="Select sales type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                      <SelectItem value="tele">Tele Sales</SelectItem>
                      <SelectItem value="field">Field Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="badge_title" className="text-gray-300">Badge Title</Label>
                  <Select value={formData.badge_title} onValueChange={(value) => setFormData({ ...formData, badge_title: value })}>
                    <SelectTrigger data-testid="employee-badge-select" className="bg-white/5 border-white/20 text-white mt-1">
                      <SelectValue placeholder="Select badge" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                      <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                      <SelectItem value="Assistant Sales Manager">Assistant Sales Manager</SelectItem>
                      <SelectItem value="Team Leader">Team Leader</SelectItem>
                      <SelectItem value="Business Development Executive">Business Development Executive</SelectItem>
                      <SelectItem value="Sales Executive">Sales Executive</SelectItem>
                      <SelectItem value="Tele Caller Executive">Tele Caller Executive</SelectItem>
                      <SelectItem value="Marketing Executive">Marketing Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-employee-button"
                type="submit"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
                className="text-[#0a1e3d] font-semibold"
              >
                {editMode ? 'Update' : 'Add'} Employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;