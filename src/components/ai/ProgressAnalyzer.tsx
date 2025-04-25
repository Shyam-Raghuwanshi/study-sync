import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

const ProgressAnalyzer = ({ userId, sessionId }) => {
  const [progressData, setProgressData] = useState(null);
  const userProgress = useQuery(api.progress.getByUser, userId ? { userId } : 'skip');
  
  useEffect(() => {
    if (userProgress) {
      const analyzedData = analyzeProgress(userProgress);
      setProgressData(analyzedData);
    }
  }, [userProgress]);

  const analyzeProgress = (progress) => {
    // Analyze the user's progress and identify knowledge gaps
    const totalProblems = progress.problemsSolved;
    const totalAttempts = progress.attempts;
    const successRate = totalAttempts > 0 ? (totalProblems / totalAttempts) * 100 : 0;

    // Suggest topics for review based on performance
    const suggestedTopics = totalProblems < 5 ? ['Basic Concepts', 'Foundational Topics'] : [];

    return {
      successRate,
      suggestedTopics,
    };
  };

  const handleFeedbackRequest = async () => {
    try {
      // Logic to request personalized feedback from the AI Tutor
      await api.aiTutor.requestFeedback({ userId, sessionId });
      toast.success('Feedback requested successfully!');
    } catch (error) {
      toast.error('Failed to request feedback');
      console.error('Error requesting feedback:', error);
    }
  };

  return (
    <div className="progress-analyzer">
      <h2>User Progress Analysis</h2>
      {progressData ? (
        <div>
          <p>Success Rate: {progressData.successRate.toFixed(2)}%</p>
          {progressData.suggestedTopics.length > 0 && (
            <div>
              <h3>Suggested Topics for Review:</h3>
              <ul>
                {progressData.suggestedTopics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={handleFeedbackRequest}>Request Feedback</button>
        </div>
      ) : (
        <p>Loading progress data...</p>
      )}
    </div>
  );
};

export default ProgressAnalyzer;