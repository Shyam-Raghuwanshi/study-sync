import React, { useState } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const ConceptExplainer = ({ sessionId, userId }) => {
  const [query, setQuery] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const explainConcept = useAction(api.aiTutor.explainConcept);
  const saveAIInteraction = useMutation(api.internal.saveAIInteraction);
  const handleExplain = async () => {
    if (!query) return;

    setIsLoading(true);
    try {
      const response = await explainConcept({
        concept: query,
      });
      setExplanation(response);
      saveAIInteraction({
        sessionId: sessionId,
        userId: userId,
        interactionType: "conceptExplanation",
        content: query,
        response: response,
        timestamp: Date.now(),
      });
      toast.success('Explanation generated');
    } catch (error) {
      console.error('Error fetching explanation:', error);
      setExplanation('Failed to fetch explanation. Please try again.');
      toast.error('Failed to generate explanation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Concept Explainer</h2>
      <Input
        placeholder="Enter a concept to explain..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-2"
      />
      <Button onClick={handleExplain} disabled={!query || isLoading}>
        {isLoading ? 'Generating...' : 'Explain'}
      </Button>
      {explanation && (
        <div className="mt-4 p-2 border rounded bg-gray-100">
          <h3 className="font-medium">Explanation:</h3>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default ConceptExplainer;