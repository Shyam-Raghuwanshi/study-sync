import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

const AITutorPanel = () => {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  
  const askAITutor = useAction(api.aiTutor.ask);

  const handleAsk = async () => {
    if (!userInput.trim()) return;

    try {
      const result = await askAITutor({ question: userInput });
      setResponse(result);
      setUserInput('');
    } catch (error) {
      toast.error('Failed to get response from AI Tutor');
      console.error('Error asking AI Tutor:', error);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-2">AI Tutor Interaction</h2>
      <Input
        placeholder="Ask your question..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        className="mb-2"
      />
      <Button onClick={handleAsk} disabled={!userInput.trim()}>
        Ask AI Tutor
      </Button>
      {response && (
        <div className="mt-4 p-2 border rounded bg-gray-100">
          <h3 className="font-medium">AI Tutor Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default AITutorPanel;