import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const ConceptExplainer = () => {
  const [query, setQuery] = useState('');
  const [explanation, setExplanation] = useState('');
  
  const handleExplain = async () => {
    if (!query) return;

    try {
      const response = await useQuery(api.aiTutor.explainConcept();
      setExplanation(response);
    } catch (error) {
      console.error('Error fetching explanation:', error);
      setExplanation('Failed to fetch explanation. Please try again.');
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
      <Button onClick={handleExplain} disabled={!query}>
        Explain
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