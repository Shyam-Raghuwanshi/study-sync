import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@clerk/clerk-react';
import { Id } from '../../convex/_generated/dataModel';

const useAITutor = (sessionId: Id<"studySessions"> | undefined) => {
  const [aiResponses, setAiResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  
  // Query for generating practice problems
  const generateProblemsQuery = useQuery(
    api.aiTutor.generatePracticeProblems, 
    userId && sessionId ? { userId, sessionId } : 'skip'
  );
  
  // Mutation for providing feedback on solutions
  const provideFeedback = useMutation(api.aiTutor.provideFeedback);
  
  // Mutation for tracking user progress
  const trackProgress = useMutation(api.aiTutor.trackProgress);
  
  // Mutation for monitoring discussions
  const monitorDiscussion = useMutation(api.aiTutor.monitorDiscussion);

  const sendMessageToAI = async (message: string) => {
    if (!userId || !sessionId) return;
    
    setLoading(true);
    try {
      // Use monitorDiscussion mutation to send message
      await monitorDiscussion({ 
        sessionId, 
        userId, 
        message 
      });
      
      // Add the user message to the responses
      setAiResponses((prev) => [...prev, { 
        type: 'user',
        content: message,
        timestamp: Date.now()
      }]);
      
      // The AI response would typically come from the server
      // For now we'll use the practice problems as a response
      if (generateProblemsQuery) {
        setAiResponses((prev) => [...prev, {
          type: 'ai',
          content: generateProblemsQuery,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestFeedback = async (problemId: Id<"problems">, userSolution: string) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const feedback = await provideFeedback({ 
        userId, 
        problemId, 
        userSolution 
      });
      
      setAiResponses((prev) => [...prev, {
        type: 'feedback',
        content: feedback,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('Error getting feedback from AI:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (solvedProblems: Id<"problems">[]) => {
    if (!userId || !sessionId) return;
    
    setLoading(true);
    try {
      await trackProgress({
        userId,
        sessionId,
        solvedProblems
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    aiResponses,
    loading,
    sendMessageToAI,
    requestFeedback,
    updateProgress,
    practiceProblems: generateProblemsQuery
  };
};

export default useAITutor;