import { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssessmentFormBuilder = ({ onBack, onFormCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_name: '',
    batch_name: '',
    trainer_id: '',
    trainer_name: '',
    session_date: '',
    branch: 'Dubai',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'rating',
    options: [''],
    required: true
  });

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      toast.error('Please enter question text');
      return;
    }

    const newQuestion = {
      id: `q_${Date.now()}`,
      question_text: currentQuestion.question_text,
      question_type: currentQuestion.question_type,
      options: currentQuestion.question_type === 'multiple_choice' 
        ? currentQuestion.options.filter(opt => opt.trim()) 
        : null,
      required: currentQuestion.required
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    setCurrentQuestion({
      question_text: '',
      question_type: 'rating',
      options: [''],
      required: true
    });

    toast.success('Question added');
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    toast.success('Question removed');
  };

  const handleSaveForm = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter form title');
      return;
    }

    if (formData.questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/assessment/forms`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Assessment form created successfully!');
      if (onFormCreated) onFormCreated(response.data);
      if (onBack) onBack();
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error(error.response?.data?.detail || 'Failed to create assessment form');
    }
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">Create Assessment Form</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="border-white/20 hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSaveForm} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Save Form
          </Button>
        </div>
      </div>

      {/* Form Details */}
      <div className="bg-slate-9000 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Form Details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-slate-300">Form Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Training Feedback Form"
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="course_name" className="text-slate-300">Course Name</Label>
              <Input
                id="course_name"
                value={formData.course_name}
                onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2 min-h-[80px]"
              placeholder="Brief description of the assessment..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="batch_name" className="text-slate-300">Batch Name</Label>
              <Input
                id="batch_name"
                value={formData.batch_name}
                onChange={(e) => setFormData({...formData, batch_name: e.target.value})}
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="session_date" className="text-slate-300">Session Date</Label>
              <Input
                id="session_date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="branch" className="text-slate-300">Branch</Label>
              <select
                id="branch"
                value={formData.branch}
                onChange={(e) => setFormData({...formData, branch: e.target.value})}
                className="w-full bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2"
              >
                <option value="Dubai">Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Sharjah">Sharjah</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Add Question */}
      <div className="bg-slate-9000 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Add Question</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="question_text" className="text-slate-300">Question Text *</Label>
            <Input
              id="question_text"
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
              placeholder="Enter your question..."
              className="bg-slate-800 border-white/10 text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="question_type" className="text-slate-300">Question Type</Label>
              <select
                id="question_type"
                value={currentQuestion.question_type}
                onChange={(e) => setCurrentQuestion({...currentQuestion, question_type: e.target.value})}
                className="w-full bg-slate-800 border border-white/10 text-slate-100 rounded-md p-2"
              >
                <option value="rating">Rating (1-5)</option>
                <option value="text">Text Answer</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="yes_no">Yes/No</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={currentQuestion.required}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, required: e.target.checked})}
                  className="w-4 h-4"
                />
                Required Question
              </label>
            </div>
          </div>

          {currentQuestion.question_type === 'multiple_choice' && (
            <div>
              <Label className="text-slate-300">Options</Label>
              <div className="space-y-2 mt-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="bg-slate-800 border-white/10 text-slate-100"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={currentQuestion.options.length === 1}
                      className="border-white/20 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="border-white/20 hover:bg-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <Button onClick={addQuestion} className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Question to Form
          </Button>
        </div>
      </div>

      {/* Questions List */}
      {formData.questions.length > 0 && (
        <div className="bg-slate-9000 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Questions ({formData.questions.length})</h3>
          <div className="space-y-3">
            {formData.questions.map((question, index) => (
              <div key={question.id} className="bg-slate-900 border border-white/10 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-slate-100">
                      {index + 1}. {question.question_text}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Type: {question.question_type} {question.required && '• Required'}
                    </p>
                    {question.options && (
                      <div className="mt-2 text-sm text-slate-300">
                        Options: {question.options.join(', ')}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                    className="border-white/20 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentFormBuilder;