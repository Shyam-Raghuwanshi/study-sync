import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

export const AITutorView = () => {
  const [userInput, setUserInput] = useState('');
  const [responses, setResponses] = useState([]);
  
  const askAITutor = useAction(api.aiTutor.ask);

  const handleAsk = async () => {
    if (!userInput.trim()) return;

    try {
      // Convert previous responses to chat history format
      const chatHistory = responses.flatMap(item => [
        {
          role: 'user',
          name: 'You_User', // Format names to meet OpenAI's requirements
          content: item.question
        },
        {
          role: 'assistant',
          name: 'AI_Tutor', // Format names to meet OpenAI's requirements
          content: item.answer
        }
      ]);
      
      // Send chat history for context
      const response = await askAITutor({ 
        question: userInput,
        chatHistory: chatHistory
      });
      
      setResponses((prev) => [...prev, { question: userInput, answer: response }]);
      setUserInput('');
    } catch (error) {
      toast.error('Failed to get response from AI Tutor');
      console.error('Error asking AI Tutor:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        {responses.map((item, index) => (
          <div key={index} className="border p-2 rounded-md">
            <p className="font-medium">You: {item.question}</p>
            <p className="text-gray-700">AI: {item.answer}</p>
          </div>
        ))}
      </div>
      <div className="flex mt-4">
        <Input
          placeholder="Ask your question..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleAsk} className="ml-2">Ask</Button>
      </div>
    </div>
  );
};
