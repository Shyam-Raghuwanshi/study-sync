import React, { useState } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MCQProblem = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const ProblemGenerator = ({ sessionId, userId }) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('math');
  const [difficulty, setDifficulty] = useState(1);
  const [count, setCount] = useState(3);
  const [generatedProblems, setGeneratedProblems] = useState<MCQProblem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const generateProblems = useAction(api.problems.create);

  const handleGenerate = async () => {
    if (!topic || !sessionId || !userId) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    setGeneratedProblems([]);
    setCurrentProblemIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);

    try {
      const problems = await generateProblems({
        sessionId: sessionId as any,
        difficulty: difficulty,
        topic: topic,
        subject: subject,
        count: count,
      });
      setGeneratedProblems(problems);
      toast.success('Problems generated successfully');
    } catch (error) {
      console.error('Error generating problems:', error);
      toast.error('Failed to generate problems');
    } finally {
      setLoading(false);
    }
  };

  const handleNextProblem = () => {
    if (currentProblemIndex < generatedProblems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handlePrevProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleSelectAnswer = (option: string) => {
    setSelectedAnswer(option);
    setShowExplanation(true);
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['Easy', 'Medium', 'Hard', 'Advanced', 'Expert'];
    return labels[level - 1] || 'Custom';
  };

  const handleStartOver = () => {
    setGeneratedProblems([]);
    setCurrentProblemIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  return (
    <div className="h-[calc(100vh-220px)] flex flex-col border-none outline-none">
      {!generatedProblems.length ? (
        <div className="flex flex-col p-4">
          <div className="p-6 rounded-xl text-black mb-6">
            <h3 className="text-xl font-medium text-black mb-4">Generate Practice Problems</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm mb-1 block">Subject</label>
                  <Input
                    placeholder="Enter subject (e.g., Programming, Mathematics, Physics)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="border-white/10 text-black focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm  mb-1 block">Topic</label>
                  <Input
                    placeholder="Enter topic (e.g., Calculus, Quantum Physics)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="border-white/10 text-black focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm mb-1 block">
                    Difficulty: <span className="text-yellow-600">{getDifficultyLabel(difficulty)}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm  mb-1 block">Number of Questions</label>
                  <Select value={count.toString()} onValueChange={(value) => setCount(Number(value))}>
                    <SelectTrigger className="text-black focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent defaultValue={"1"} className="text-black">
                      <SelectItem value="1">1 question</SelectItem>
                      <SelectItem value="3">3 questions</SelectItem>
                      <SelectItem value="5">5 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="w-full mt-4 py-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating problems...
                  </div>
                ) : 'Generate Problems'}
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-black mb-2">Ready for Practice?</h2>
            <p className="text-gray-400 max-w-md">
              Generate customized practice problems for any subject to test your knowledge and improve your understanding
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col p-4 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-xs text-white font-bold">
                {currentProblemIndex + 1}
              </span>
              <span className="text-white/70">of {generatedProblems.length}</span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePrevProblem}
                disabled={currentProblemIndex === 0}
                variant="outline"
                className="px-2 py-1 bg-[#1E1B4B]/50 border border-white/10 hover:bg-[#1E1B4B]"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextProblem}
                disabled={currentProblemIndex === generatedProblems.length - 1}
                variant="outline"
                className="px-2 py-1 bg-[#1E1B4B]/50 border border-white/10 hover:bg-[#1E1B4B]"
                size="sm"
              >
                Next
              </Button>
              <Button
                onClick={handleStartOver}
                variant="outline"
                className="px-2 py-1 bg-red-600/50 border border-white/10 hover:bg-red-600/70"
                size="sm"
              >
                Start Over
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 rounded-xl bg-[#2A2867] mb-6">
              <h3 className="text-xl font-medium text-white mb-4">
                {generatedProblems[currentProblemIndex].question}
              </h3>

              <div className="space-y-3">
                {generatedProblems[currentProblemIndex].options.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => handleSelectAnswer(option)}
                    className={`w-full p-4 rounded-lg text-left border transition-colors ${selectedAnswer === option
                      ? option.startsWith(generatedProblems[currentProblemIndex].correctAnswer)
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-red-500 bg-red-900/20'
                      : 'border-white/10 bg-[#1E1B4B] hover:bg-[#1E1B4B]/80'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center ${selectedAnswer === option
                        ? option.startsWith(generatedProblems[currentProblemIndex].correctAnswer)
                          ? 'border-green-500 text-green-500'
                          : 'border-red-500 text-red-500'
                        : 'border-white/30 text-white/70'
                        }`}>
                        {String.fromCharCode(65 + optIndex)}
                      </div>
                      <div className="text-white">{option.substring(3)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {showExplanation && (
              <div className="p-6 rounded-xl bg-[#2A2867] mb-6">
                <h3 className="text-xl font-medium text-white mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                      fill="currentColor" />
                  </svg>
                  Explanation
                </h3>
                <div className="text-gray-300">
                  {generatedProblems[currentProblemIndex].explanation}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                  <div className="text-sm text-white/70">
                    {currentProblemIndex + 1} of {generatedProblems.length} questions
                  </div>
                  <Button
                    onClick={currentProblemIndex < generatedProblems.length - 1 ? handleNextProblem : handleStartOver}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {currentProblemIndex < generatedProblems.length - 1 ? 'Next Question' : 'Start Over'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemGenerator;