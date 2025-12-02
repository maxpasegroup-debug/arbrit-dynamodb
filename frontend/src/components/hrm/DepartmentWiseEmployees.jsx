import { useEffect, useState } from 'react';
import { 
  Users, Building2, TrendingUp, GraduationCap, DollarSign, 
  Package, Briefcase, Search, ChevronDown, ChevronUp, 
  Mail, Phone, MapPin, Award, Crown, Star, Plus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEPARTMENT_CONFIG = {
  'Management': {
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: Crown,
    iconColor: 'text-amber-400',
    description: 'Executive Leadership'
  },
  'Sales': {
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: TrendingUp,
    iconColor: 'text-blue-400',
    description: 'Revenue & Business Development'
  },
  'Academic': {
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: GraduationCap,
    iconColor: 'text-purple-400',
    description: 'Training & Education'
  },
  'Accounts': {
    color: 'from-green-500 to-emerald-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: DollarSign,
    iconColor: 'text-green-400',
    description: 'Finance & Accounting'
  },
  'Dispatch': {
    color: 'from-orange-500 to-red-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: Package,
    iconColor: 'text-orange-400',
    description: 'Operations & Logistics'
  },
  'HR': {
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    icon: Users,
    iconColor: 'text-pink-400',
    description: 'Human Resources'
  },
  'Marketing': {
    color: 'from-indigo-500 to-purple-500',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    icon: Briefcase,
    iconColor: 'text-indigo-400',
    description: 'Brand & Communications'
  }
};

const DepartmentWiseEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDepts, setExpandedDepts] = useState({});
  const [selectedBranch, setSelectedBranch] = useState('all');

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
      
      // Expand all departments by default
      const allDepts = {};
      Object.keys(DEPARTMENT_CONFIG).forEach(dept => {
        allDepts[dept] = true;
      });
      setExpandedDepts(allDepts);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (dept) => {
    setExpandedDepts(prev => ({
      ...prev,
      [dept]: !prev[dept]
    }));
  };

  const groupByDepartment = () => {
    const grouped = {};
    
    employees.forEach(emp => {
      let dept = emp.department;
      
      // Special handling for management roles
      if (['MD', 'COO', 'CEO'].includes(emp.designation) || ['MD', 'COO', 'CEO'].includes(emp.role)) {
        dept = 'Management';
      }
      
      // Handle Sales Head
      if (!dept && (emp.designation === 'Sales Head' || emp.role === 'Sales Head')) {
        dept = 'Sales';
      }
      
      // Handle HR Manager
      if (!dept && (emp.designation?.includes('HR') || emp.role?.includes('HR'))) {
        dept = 'HR';
      }
      
      // Fallback to Other
      if (!dept) {
        dept = 'Other';
      }
      
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(emp);
    });

    return grouped;
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Branch filter
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(emp => emp.branch === selectedBranch);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.mobile?.includes(searchTerm) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const groupedEmployees = () => {
    const filtered = filterEmployees();
    const grouped = {};
    
    filtered.forEach(emp => {
      let dept = emp.department;
      
      // Special handling for management roles
      if (['MD', 'COO', 'CEO'].includes(emp.designation) || ['MD', 'COO', 'CEO'].includes(emp.role)) {
        dept = 'Management';
      }
      
      // Handle Sales Head
      if (!dept && (emp.designation === 'Sales Head' || emp.role === 'Sales Head')) {
        dept = 'Sales';
      }
      
      // Handle HR Manager
      if (!dept && (emp.designation?.includes('HR') || emp.role?.includes('HR'))) {
        dept = 'HR';
      }
      
      // Fallback to Other
      if (!dept) {
        dept = 'Other';
      }
      
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(emp);
    });

    return grouped;
  };

  const getBranches = () => {
    const branches = new Set(employees.map(emp => emp.branch).filter(Boolean));
    return Array.from(branches);
  };

  const getRoleIcon = (role) => {
    if (['MD', 'COO', 'CEO'].includes(role)) return Crown;
    if (role?.includes('Head')) return Star;
    return Award;
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">Loading employees...</p>
      </div>
    );
  }

  const grouped = groupedEmployees();
  const totalEmployees = filterEmployees().length;
  const branches = getBranches();

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-cyan-400" />
              Organization Structure
            </h2>
            <p className="text-slate-400 mt-1">
              {totalEmployees} employees across {Object.keys(grouped).length} departments
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-white/10 text-white"
              />
            </div>

            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-md text-white text-sm"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Department Cards */}
      <div className="space-y-4">
        {Object.keys(DEPARTMENT_CONFIG).map(deptName => {
          const deptEmployees = grouped[deptName] || [];
          if (deptEmployees.length === 0) return null;

          const config = DEPARTMENT_CONFIG[deptName];
          const Icon = config.icon;
          const isExpanded = expandedDepts[deptName];

          return (
            <Card key={deptName} className={`bg-white/5 ${config.border} border-2 hover:border-opacity-60 transition-all`}>
              <CardContent className="p-0">
                {/* Department Header */}
                <div
                  className={`${config.bg} p-6 cursor-pointer hover:bg-opacity-80 transition-all`}
                  onClick={() => toggleDepartment(deptName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-gradient-to-br ${config.color} rounded-xl`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          {deptName}
                          <Badge className="bg-white/20 text-white border-white/30">
                            {deptEmployees.length}
                          </Badge>
                        </h3>
                        <p className="text-slate-400 text-sm">{config.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Employee List */}
                {isExpanded && (
                  <div className="p-6 space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {deptEmployees.map((employee, idx) => {
                        const RoleIcon = getRoleIcon(employee.role);
                        const isManagement = ['MD', 'COO', 'CEO'].includes(employee.role);

                        return (
                          <Card
                            key={employee.id || idx}
                            className={`bg-white/5 border-white/10 hover:bg-white/10 transition-all ${
                              isManagement ? 'ring-2 ring-amber-500/30' : ''
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className={`p-3 rounded-full bg-gradient-to-br ${config.color} flex-shrink-0`}>
                                  <RoleIcon className="w-6 h-6 text-white" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1">
                                      <h4 className="text-lg font-bold text-white truncate">
                                        {employee.name}
                                      </h4>
                                      <p className={`text-sm font-semibold ${config.iconColor}`}>
                                        {employee.role || employee.designation || 'Employee'}
                                      </p>
                                    </div>
                                    {isManagement && (
                                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/50 flex-shrink-0">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Leadership
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Contact Info */}
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2 text-slate-400">
                                      <Phone className="w-3 h-3" />
                                      <span>{employee.mobile}</span>
                                    </div>
                                    {employee.email && (
                                      <div className="flex items-center gap-2 text-slate-400 truncate">
                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{employee.email}</span>
                                      </div>
                                    )}
                                    {employee.branch && (
                                      <div className="flex items-center gap-2 text-slate-400">
                                        <MapPin className="w-3 h-3" />
                                        <span>{employee.branch}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Additional Info */}
                                  {employee.badge_title && (
                                    <div className="mt-2">
                                      <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                                        {employee.badge_title}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {Object.keys(grouped).length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No employees found</p>
            {(searchTerm || selectedBranch !== 'all') && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBranch('all');
                }}
                variant="outline"
                className="mt-4 border-white/20 text-white hover:bg-white/10"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DepartmentWiseEmployees;
