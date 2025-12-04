import { useState, useEffect } from 'react';
import { MessageCircle, Bell, Star, Clock, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FeedbackMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchFeedbackMessages();
  }, []);

  const fetchFeedbackMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      // Try to fetch from backend first
      const response = await axios.get(`${BACKEND_URL}/api/sales/feedback-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      // Show empty state if API fails
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const toggleStar = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, starred: !msg.starred } : msg
    ));
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'appreciation': return <Star className="w-4 h-4" />;
      case 'announcement': return <Bell className="w-4 h-4" />;
      case 'client_feedback': return <MessageCircle className="w-4 h-4" />;
      case 'achievement': return <CheckCircle className="w-4 h-4" />;
      case 'reminder': return <Clock className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'appreciation': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'announcement': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'client_feedback': return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
      case 'achievement': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'reminder': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Messages & Feedback
          </h3>
          <p className="text-slate-400">
            Communication and feedback from higher management
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500/20 text-red-400 border-red-400/30">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-blue-400 font-semibold">Total Messages</p>
                <p className="text-xl font-bold text-blue-300">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-400 font-semibold">Unread</p>
                <p className="text-xl font-bold text-red-300">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-semibold">Starred</p>
                <p className="text-xl font-bold text-yellow-300">
                  {messages.filter(msg => msg.starred).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Appreciation</p>
                <p className="text-xl font-bold text-green-300">
                  {messages.filter(msg => msg.type === 'appreciation').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.map((message) => (
          <Card 
            key={message.id} 
            className={`border-white/10 transition-all ${
              message.read 
                ? 'bg-slate-900/30' 
                : 'bg-slate-900/70 border-blue-400/30'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getMessageTypeColor(message.type)}>
                      {getMessageTypeIcon(message.type)}
                      {message.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    {message.priority === 'high' && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-400/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        High Priority
                      </Badge>
                    )}
                    {!message.read && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                        New
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className={`text-lg mb-2 ${message.read ? 'text-slate-300' : 'text-white'}`}>
                    {message.title}
                  </CardTitle>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {message.from} ({message.fromRole})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {message.date}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStar(message.id)}
                    className={message.starred ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-400 hover:text-slate-300'}
                  >
                    <Star className={`w-4 h-4 ${message.starred ? 'fill-current' : ''}`} />
                  </Button>
                  {!message.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(message.id)}
                      className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <p className={`leading-relaxed ${message.read ? 'text-slate-400' : 'text-slate-300'}`}>
                {message.message}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {messages.length === 0 && (
        <Card className="bg-slate-800/30 border-white/10">
          <CardContent className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-slate-300 text-lg font-semibold mb-2">
              No Messages Yet
            </h3>
            <p className="text-slate-400">
              Messages and feedback from management will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeedbackMessages;