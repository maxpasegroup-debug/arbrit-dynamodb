import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, User } from 'lucide-react';
import { toast } from 'sonner';

const CoordinatorCommunication = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    toast.info('Communication feature coming soon');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-white text-xl">Communication Center</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Communicate with trainers and clients</p>
        </CardHeader>
        <CardContent className="p-6">
          {/* Message List */}
          <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No messages yet</p>
                <p className="text-sm text-gray-500 mt-2">Start communicating with trainers and clients</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <Card key={index} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{msg.from}</h4>
                          <span className="text-xs text-gray-400">{msg.time}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="space-y-3">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white border-gray-300 text-white placeholder:text-gray-400 min-h-24"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSendMessage}
                className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoordinatorCommunication;
