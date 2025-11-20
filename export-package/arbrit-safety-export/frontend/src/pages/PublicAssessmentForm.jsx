import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PublicAssessmentForm = () => {
  const { form_id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [studentInfo, setStudentInfo] = useState({ name: '', contact: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [form_id]);

  const fetchForm = async () => {
    try {
      const response = await axios.get(`${API}/assessment/forms/${form_id}`);
      setForm(response.data);
      
      // Initialize responses
      const initialResponses = {};
      response.data.questions?.forEach(q => {
        initialResponses[q.id] = '';
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load assessment form');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required questions are answered
    const unansweredRequired = form.questions.filter(q => 
      q.required && (!responses[q.id] || responses[q.id] === '')
    );
    
    if (unansweredRequired.length > 0) {
      toast.error('Please answer all required questions');
      return;
    }

    setSubmitting(true);
    
    try {
      // Format responses for submission
      const formattedResponses = form.questions.map(q => ({
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        answer: responses[q.id]
      }));

      await axios.post(`${API}/assessment/submit`, {
        form_id: form.id,
        responses: formattedResponses,
        student_name: studentInfo.name || 'Anonymous',
        student_contact: studentInfo.contact || null
      });

      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">Assessment form not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900">Thank You!</h2>
            <p className="text-slate-600">
              Your feedback has been submitted successfully.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mb-4">
              <img src="/arbrit-logo.png" alt="Arbrit Safety" className="h-12 mx-auto" onError={(e) => e.target.style.display = 'none'} />
            </div>
            <CardTitle className="text-2xl text-slate-900">{form.title}</CardTitle>
            {form.description && (
              <p className="text-slate-600 mt-2">{form.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-slate-700 space-y-1">
              {form.course_name && <p><strong>Course:</strong> {form.course_name}</p>}
              {form.batch_name && <p><strong>Batch:</strong> {form.batch_name}</p>}
              {form.trainer_name && <p><strong>Trainer:</strong> {form.trainer_name}</p>}
              {form.session_date && <p><strong>Date:</strong> {new Date(form.session_date).toLocaleDateString()}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Info (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Information (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input
                  value={studentInfo.contact}
                  onChange={(e) => setStudentInfo({ ...studentInfo, contact: e.target.value })}
                  placeholder="Your contact number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          {form.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  {index + 1}. {question.question_text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.question_type === 'rating' && (
                  <div className="flex gap-3 justify-center">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setResponses({ ...responses, [question.id]: rating.toString() })}
                        className={`w-14 h-14 rounded-lg border-2 font-semibold transition-all ${
                          responses[question.id] === rating.toString()
                            ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}

                {question.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {question.options?.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={responses[question.id] === option}
                          onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-slate-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.question_type === 'free_text' && (
                  <textarea
                    value={responses[question.id]}
                    onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your answer..."
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {/* Submit Button */}
          <Card>
            <CardContent className="py-6">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
              >
                {submitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>Powered by Arbrit Safety Training</p>
        </div>
      </div>
    </div>
  );
};

export default PublicAssessmentForm;