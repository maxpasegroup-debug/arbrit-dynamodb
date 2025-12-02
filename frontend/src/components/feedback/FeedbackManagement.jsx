import { useState, useEffect } from 'react';
import { MessageSquare, Star, ThumbsUp, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, positive: 0 });

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      // Try to fetch work orders which may contain feedback
      const response = await axios.get(`${API}/academic/work-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data || [];
      const feedbackData = data.filter(item => item.feedback_rating || item.feedback);
      
      setFeedbacks(feedbackData);
      
      // Calculate stats
      const total = feedbackData.length;
      const avgRating = feedbackData.reduce((sum, f) => sum + (parseFloat(f.feedback_rating) || 0), 0) / (total || 1);
      const positive = feedbackData.filter(f => parseFloat(f.feedback_rating) >= 4).length;
      
      setStats({ total, avgRating: avgRating.toFixed(1), positive });
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      // Don't show error toast - just show empty state
      setFeedbacks([]);
      setStats({ total: 0, avgRating: 0, positive: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    const r = parseFloat(rating);
    if (r >= 4.5) return 'text-green-400';
    if (r >= 3.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">Loading feedbacks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-purple-400" />
          Training Feedback & Reviews
        </h2>
        <p className="text-slate-400 mt-1">Monitor and analyze training feedback from participants</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-white/5 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">Total Feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-bold text-yellow-400">{stats.avgRating}</p>
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">Positive Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-bold text-green-400">{stats.positive}</p>
              <ThumbsUp className="w-6 h-6 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No feedback received yet</p>
            </CardContent>
          </Card>
        ) : (
          feedbacks.map((feedback, idx) => (
            <Card key={idx} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-full">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{feedback.client_name || 'Anonymous'}</h4>
                      <p className="text-slate-400 text-sm">{feedback.course_name || 'Training Course'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getRatingColor(feedback.feedback_rating)}`}>
                      {feedback.feedback_rating || 'N/A'}
                    </span>
                    <Star className={`w-5 h-5 ${getRatingColor(feedback.feedback_rating)} fill-current`} />
                  </div>
                </div>
                
                {feedback.feedback && (
                  <p className="text-slate-300 mb-3">{feedback.feedback}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {feedback.completion_date || 'Recent'}
                  </div>
                  {feedback.status && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">
                      {feedback.status}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;