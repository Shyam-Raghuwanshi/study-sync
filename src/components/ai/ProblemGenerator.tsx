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

  const generateProblems = useAction(api.problems.create);

  const handleGenerate = async () => {
    if (!topic || !sessionId || !userId) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const problems = await generateProblems({
        sessionId: sessionId as any,
        difficulty: difficulty,
        topic: topic,
        subject: subject,
        count: count,
      });

      console.log('Generated problems:', problems);
      setGeneratedProblems(problems);
      toast.success('Problems generated successfully');
    } catch (error) {
      console.error('Error generating problems:', error);
      toast.error('Failed to generate problems');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="problem-generator space-y-4">
      <h2 className="text-xl font-semibold">Generate Practice Problems</h2>
      
      <div className="space-y-3">
        <div className="grid gap-2">
          <label htmlFor="subject" className="text-sm font-medium">Subject</label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="math">Mathematics</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="history">History</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="computer_science">Computer Science</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <label htmlFor="topic" className="text-sm font-medium">Topic</label>
          <Input
            id="topic"
            placeholder="Enter topic (e.g., Calculus, Quantum Physics)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label htmlFor="difficulty" className="text-sm font-medium">Difficulty</label>
            <Select value={difficulty.toString()} onValueChange={(value) => setDifficulty(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Easy</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">Hard</SelectItem>
                <SelectItem value="4">Advanced</SelectItem>
                <SelectItem value="5">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="count" className="text-sm font-medium">Number of Questions</label>
            <Select value={count.toString()} onValueChange={(value) => setCount(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Number of questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 question</SelectItem>
                <SelectItem value="3">3 questions</SelectItem>
                <SelectItem value="5">5 questions</SelectItem>
                <SelectItem value="10">10 questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleGenerate} 
          disabled={loading} 
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate Problems'}
        </Button>
      </div>

      {generatedProblems.length > 0 && (
        <div className="mt-6 border rounded-md p-4 bg-slate-50">
          <h3 className="text-lg font-semibold mb-4">Generated Problems</h3>
          <div className="space-y-6">
            {generatedProblems.map((problem, index) => (
              <div key={index} className="border rounded-md p-4 bg-white shadow-sm">
                <h4 className="font-medium mb-3">Question {index + 1}: {problem.question}</h4>
                <ul className="space-y-2 mb-4">
                  {problem.options.map((option, optIndex) => (
                    <li 
                      key={optIndex} 
                      className={`p-2 rounded-md ${option.startsWith(problem.correctAnswer) ? 'bg-green-100 border-green-200 border' : 'bg-gray-50'}`}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="font-medium text-sm">Explanation:</p>
                  <p className="text-sm text-gray-700">{problem.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemGenerator;