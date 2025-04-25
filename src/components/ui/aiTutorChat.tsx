import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

const AITutorChat = ({ sessionId }: { sessionId: any }) => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);

  const sendMessage = useMutation(api.messages.send);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const newMessage = {
      userId: 'User',
      content: userInput,
      isAIGenerated: false,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setUserInput('');

    try {
      const aiResponse = await sendMessage({
        sessionId,
        userId: 'AI Tutor',
        content: userInput,
        isAIGenerated: true,
      });

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      toast.error('Failed to send message to AI Tutor');
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="ai-tutor-chat">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isAIGenerated ? 'ai' : 'user'}`}>
            <strong>{msg.userId}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <Input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask your AI Tutor..."
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
};

export default AITutorChat;