import React, { useState } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';

const ConceptExplainer = ({ sessionId }) => {
  const [query, setQuery] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const explainConcept = useAction(api.aiTutor.explainConcept);
  const saveAIInteraction = useMutation(api.aiTutor.saveAIInteraction);
  const handleExplain = async () => {
    if (!query) return;

    setIsLoading(true);
    try {
      const response = await explainConcept({
        concept: query,
      });
      setExplanation(response);
      await saveAIInteraction({
        sessionId: sessionId,
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
    <div className="h-[calc(100vh-220px)] flex flex-col">
      <div className="p-4">
        <div className="relative">
          <Input
            placeholder="Enter any concept to explore..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && query.trim() && handleExplain()}
            className="w-full py-6 px-4 pr-32 bg-gray-300 text-black border-none rounded-xl focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <Button
            onClick={handleExplain}
            disabled={!query || isLoading}
            className="absolute right-2 top-2 h-[calc(100%-16px)] px-5 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg"
          >
            {isLoading ? 'Exploring...' : 'Explore'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {explanation && (
          <div className="p-6 rounded-xl bg-[#2A2867] mb-6">
            <h3 className="text-xl font-medium text-white mb-3">
              {query}
            </h3>
            <div className="text-gray-200 whitespace-pre-wrap">
              {explanation}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 17L12 22L22 17M2 12L12 17L22 12M2 7L12 12L22 7" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-black mb-2">Explore Concepts</h2>
          <p className="text-gray-400 mb-4 max-w-md">
            Enter any concept or topic to get a detailed explanation
          </p>
          <div className="grid grid-cols-2 gap-2 w-full max-w-md">
            <Badge
              onClick={() => setQuery('Quantum entanglement')}
              className="p-2 text-sm text-left rounded-lg bg-black flex justify-center items-center border border-white/10 transition-colors hover:bg-black/70"
            >
              Explain Quantum entanglement
            </Badge>
            <Badge
              onClick={() => setQuery('Machine learning')}
              className="p-2 text-sm text-left rounded-lg bg-black flex justify-center items-center border border-white/10 transition-colors hover:bg-black/70" >
              Explain Machine learning
            </Badge>
            <Badge
              onClick={() => setQuery('Photosynthesis')}
              className="p-2 text-sm text-left rounded-lg bg-black flex justify-center items-center border border-white/10 transition-colors hover:bg-black/70"  >
              Explain Photosynthesis
            </Badge>
            <Badge
              onClick={() => setQuery('Black holes')}
              className="p-2 text-sm text-left rounded-lg bg-black flex justify-center items-center border border-white/10 transition-colors hover:bg-black/70"   >
              Explain Black holes
            </Badge>
          </div>
        </div>



      </div>
    </div>
  );
};

export default ConceptExplainer;