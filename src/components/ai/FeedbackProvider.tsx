import React, { createContext, useContext, useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [feedback, setFeedback] = useState([]);
  const provideFeedback = useMutation(api.aiTutor.provideFeedback);

  const analyzeResponse = async (userId, problemId, userResponse) => {
    try {
      const result = await provideFeedback({ userId, problemId, userResponse });
      setFeedback((prev) => [...prev, result]);
      toast.success('Feedback provided successfully');
    } catch (error) {
      console.error('Error providing feedback:', error);
      toast.error('Failed to provide feedback');
    }
  };

  return (
    <FeedbackContext.Provider value={{ feedback, analyzeResponse }}>
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  return useContext(FeedbackContext);
};