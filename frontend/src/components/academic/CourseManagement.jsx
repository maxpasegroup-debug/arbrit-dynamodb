import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Safety Training',
    duration: '1 Day',
    base_fee: '',
    pricing_tiers: {
      individual: '',
      group_5_10: '',
      group_10_plus: '',
      corporate: 'negotiable'
    },
    prerequisites: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle the response format - courses are in response.data.items
      setCourses(response.data.items || response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (course = null) => {
    if (course) {
      setEditMode(true);
      setSelectedCourse(course);
      setFormData({
        name: course.name,
        description: course.description || '',
        category: course.category || 'Safety Training',
        duration: course.duration || '1 Day',
        base_fee: course.base_fee,
        pricing_tiers: course.pricing_tiers || {
          individual: course.base_fee,
          group_5_10: Math.round(course.base_fee * 0.9),
          group_10_plus: Math.round(course.base_fee * 0.8),
          corporate: 'negotiable'
        },
        prerequisites: course.prerequisites || ''
      });
    } else {
      setEditMode(false);
      setSelectedCourse(null);
      setFormData({
        name: '',
        description: '',
        category: 'Safety Training',
        duration: '1 Day',
        base_fee: '',
        pricing_tiers: {
          individual: '',
          group_5_10: '',
          group_10_plus: '',
          corporate: 'negotiable'
        },
        prerequisites: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.base_fee) {
      toast.error('Please fill in course name and base fee');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = editMode ? `${API}/courses/${selectedCourse.id}` : `${API}/courses`;
      const method = editMode ? 'put' : 'post';

      await axios[method](endpoint, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Course ${editMode ? 'updated' : 'created'} successfully!`);
      setDialogOpen(false);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.detail || 'Failed to save course');
    }
  };

  const handleDelete = async (course) => {
    if (!window.confirm(`Are you sure you want to archive "${course.name}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/courses/${course.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Course archived successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to archive course');
    }
  };

  const handleBaseFeeChange = (value) => {
    const baseFee = parseFloat(value) || 0;
    setFormData({
      ...formData,
      base_fee: value,
      pricing_tiers: {
        individual: value,
        group_5_10: Math.round(baseFee * 0.9).toString(),
        group_10_plus: Math.round(baseFee * 0.8).toString(),
        corporate: 'negotiable'
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Course Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage training courses and pricing</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Courses Grid */}
      <div className="bg-white0 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
        {loading ? (
          <p className="text-center py-8 text-slate-400">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="text-center py-8 text-slate-400">No courses yet. Add your first course!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-white transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-100 text-lg">{course.name}</h3>
                    <Badge className="mt-1 bg-blue-500/20 text-blue-300 border-blue-400/50">
                      {course.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(course)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(course)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                  {course.description || 'No description'}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Duration:</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-semibold">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Base Fee:
                    </span>
                    <span>{course.base_fee} AED</span>
                  </div>
                  {course.pricing_tiers && (
                    <div className="pt-2 border-t border-gray-200 text-xs text-slate-400">
                      <div>Group (5-10): {course.pricing_tiers.group_5_10} AED</div>
                      <div>Group (10+): {course.pricing_tiers.group_10_plus} AED</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editMode ? 'Edit Course' : 'Add New Course'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editMode ? 'Update course details and pricing' : 'Create a new training course'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name" className="text-gray-700">Course Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fire Safety Training"
                  className="bg-gray-50 border-gray-200 text-slate-100"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-gray-700">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-100 rounded-md p-2"
                >
                  <option value="Safety Training">Safety Training</option>
                  <option value="First Aid">First Aid</option>
                  <option value="HSE">HSE</option>
                  <option value="Fire Safety">Fire Safety</option>
                  <option value="Driving">Driving</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <Label htmlFor="duration" className="text-gray-700">Duration</Label>
                <select
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-100 rounded-md p-2"
                >
                  <option value="Half Day">Half Day</option>
                  <option value="1 Day">1 Day</option>
                  <option value="2 Days">2 Days</option>
                  <option value="3 Days">3 Days</option>
                  <option value="1 Week">1 Week</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="description" className="text-gray-700">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-100 rounded-md p-2 min-h-[80px]"
                  placeholder="Course description..."
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="base_fee" className="text-gray-700">Base Fee (AED) *</Label>
                <Input
                  id="base_fee"
                  type="number"
                  value={formData.base_fee}
                  onChange={(e) => handleBaseFeeChange(e.target.value)}
                  placeholder="500"
                  className="bg-gray-50 border-gray-200 text-slate-100"
                  required
                />
              </div>

              <div className="col-span-2 bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-slate-200 mb-2">Pricing Tiers (Auto-calculated)</h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Individual:</span>
                    <span className="font-medium">{formData.pricing_tiers.individual} AED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Group (5-10 people):</span>
                    <span className="font-medium">{formData.pricing_tiers.group_5_10} AED (-10%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Group (10+ people):</span>
                    <span className="font-medium">{formData.pricing_tiers.group_10_plus} AED (-20%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Corporate Package:</span>
                    <span className="font-medium italic">Negotiable</span>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <Label htmlFor="prerequisites" className="text-gray-700">Prerequisites (Optional)</Label>
                <Input
                  id="prerequisites"
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                  placeholder="e.g., Basic safety awareness"
                  className="bg-gray-50 border-gray-200 text-slate-100"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 border-gray-300 hover:bg-white"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                {editMode ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManagement;
