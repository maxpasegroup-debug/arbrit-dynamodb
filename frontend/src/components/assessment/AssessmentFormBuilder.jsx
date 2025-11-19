import { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    // Reset current question
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
      if (onFormCreated) {
        onFormCreated(response.data);
      }
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error(error.response?.data?.detail || 'Failed to create form');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">Create Assessment Form</h2>
        </div>
        <Button onClick={handleSaveForm} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Form
        </Button>
      </div>

      {/* Form Details */}
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Form Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Fire Safety Training Feedback"
              />
            </div>
            <div>
              <Label>Course Name</Label>
              <Input
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                placeholder="e.g., Fire Safety Level 1"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this assessment"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Batch Name</Label>
              <Input
                value={formData.batch_name}
                onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                placeholder="e.g., Batch A"
              />
            </div>
            <div>
              <Label>Trainer Name</Label>
              <Input
                value={formData.trainer_name}
                onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                placeholder="Trainer's name"
              />
            </div>
            <div>
              <Label>Session Date</Label>
              <Input
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Branch</Label>
            <select
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full border border-slate-300 rounded-md p-2"
            >
              <option value="Dubai">Dubai</option>
              <option value="Abu Dhabi">Abu Dhabi</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Add Question Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Question Text *</Label>
            <Input
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
              placeholder="Enter your question"
            />
          </div>

          <div>
            <Label>Question Type</Label>
            <select
              value={currentQuestion.question_type}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_type: e.target.value, options: e.target.value === 'multiple_choice' ? [''] : [] })}
              className="w-full border border-slate-300 rounded-md p-2"
            >
              <option value="rating">Rating (1-5)</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="free_text">Free Text</option>
            </select>
          </div>

          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-2">
              <Label>Options</Label>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {currentQuestion.options.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          )}

          <Button onClick={addQuestion} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      {formData.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questions ({formData.questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.questions.map((question, index) => (
                <div key={question.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {index + 1}. {question.question_text}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Type: {question.question_type === 'rating' ? 'Rating (1-5)' : question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Free Text'}
                    </p>
                    {question.options && (
                      <div className="mt-2 text-sm text-slate-600">
                        Options: {question.options.join(', ')}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssessmentFormBuilder;