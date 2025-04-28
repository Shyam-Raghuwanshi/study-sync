import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConceptExplainer from '../ai/ConceptExplainer';
import ProblemGenerator from '../ai/ProblemGenerator';
import { useUser } from '@clerk/clerk-react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

const AITutorView = ({ sessionId }: { sessionId?: string }) => {
  const { user } = useUser();
  const userId = user?.id || 'anonymous';

  // Chat state
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState('chat');

  // AI Tutor action
  const askAITutor = useAction(api.aiTutor.ask);
  const saveAIInteraction = useMutation(api.aiTutor.saveAIInteraction);

  const handleSendMessage = async () => {
    if (!query.trim()) return;

    // Create a user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    // Add user message to chat
    setChatMessages(prev => [...prev, userMessage]);

    // Create a temporary loading message
    const loadingMsgId = `loading-${Date.now()}`;
    const loadingMessage: ChatMessage = {
      id: loadingMsgId,
      role: 'assistant',
      content: 'Thinking...',
      timestamp: Date.now(),
    };
    setChatMessages(prev => [...prev, loadingMessage]);

    setIsLoading(true);
    setQuery('');

    try {
      // Format the chat history for the AI
      const chatHistory = chatMessages.map(msg => ({
        role: msg.role,
        name: msg.role === 'user' ? 'student' : 'tutor',
        content: msg.content,
      }));

      // Get AI response
      const response = await askAITutor({
        question: userMessage.content,
        chatHistory,
        interactionType: 'general'
      });

      await saveAIInteraction({
        sessionId: sessionId as any,
        interactionType: "ask",
        content: userMessage.content,
        response: response,
        timestamp: Date.now(),
      });

      // Replace loading message with actual response
      setChatMessages(prev => prev.filter(msg => msg.id !== loadingMsgId));

      // Add AI response to chat
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);


    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response');

      // Replace loading message with error
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMsgId
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-r from-red-50 to-purple-100 overflow-hidden relative">
      <div className="h-full w-full flex flex-col">
        {/* Header with title */}
        <div className="w-full text-center pt-8 pb-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text">
            AI Learning Assistant
          </h1>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 md:px-8">
          <Tabs defaultValue="chat" value={activeTab} className="w-full">
            <TabsList className="w-full flex justify-center mb-4 bg-transparent">
              <div className="grid grid-cols-3 w-full max-w-md rounded-md p-1">
                <TabsTrigger 
                  onClick={() => setActiveTab('chat')}
                  value="chat" 
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21.99 18L21.92 20.1C21.91 20.35 21.89 20.58 21.85 20.8C21.55 22.07 20.57 23.05 19.3 23.35C19.08 23.39 18.85 23.41 18.6 23.42L16.5 23.49C13.82 23.52 11.22 23.52 8.54 23.49L6.44 23.42C6.19 23.41 5.96 23.39 5.74 23.35C4.47 23.05 3.49 22.07 3.19 20.8C3.15 20.58 3.13 20.35 3.12 20.1L3.05 18C3.02 15.32 3.02 12.72 3.05 10.04L3.12 7.94C3.13 7.69 3.15 7.46 3.19 7.24C3.49 5.97 4.47 4.99 5.74 4.69C5.96 4.65 6.19 4.63 6.44 4.62L8.54 4.55C11.22 4.52 13.82 4.52 16.5 4.55L18.6 4.62C18.85 4.63 19.08 4.65 19.3 4.69C20.57 4.99 21.55 5.97 21.85 7.24C21.89 7.46 21.91 7.69 21.92 7.94L21.99 10.04" 
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">AI Chat</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  onClick={() => setActiveTab('explain')}
                  value="explain"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 17L12 22L22 17M2 12L12 17L22 12M2 7L12 12L22 7" stroke="currentColor" 
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">Concepts</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  onClick={() => setActiveTab('practice')}
                  value="practice"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" 
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.995 13.7H12.005M8.294 13.7H8.304M15.695 13.7H15.705M11.995 17.4H12.005M8.294 17.4H8.304M15.695 17.4H15.705" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">Practice</span>
                </TabsTrigger>
              </div>
            </TabsList>

            <div className="px-1 sm:px-4">
              {/* Tab Content */}
              <TabsContent value="chat" className="mt-0 focus-visible:outline-none focus-visible:ring-0 w-full">
                <div className="w-full max-w-4xl mx-auto">
                  <div className="h-[calc(100vh-220px)] flex flex-col">
                    <div className="flex-1 overflow-y-auto px-4">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
                            <span className="text-4xl">👋</span>
                          </div>
                          <h2 className="text-2xl font-semibold text-white mb-2">Welcome to AI Tutor!</h2>
                          <p className="text-gray-400 mb-8 max-w-md">
                            Ask anything to begin your learning journey with AI-powered personalized assistance
                          </p>
                          <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                            <button className="p-2 text-sm text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                              Explain quantum mechanics
                            </button>
                            <button className="p-2 text-sm text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                              Help with calculus problems
                            </button>
                            <button className="p-2 text-sm text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                              Summarize World War II
                            </button>
                            <button className="p-2 text-sm text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                              Grammar check my essay
                            </button>
                          </div>
                        </div>
                      ) : (
                        chatMessages.map(message => (
                          <div
                            key={message.id}
                            className={`mb-4 p-4 rounded-xl max-w-[85%] ${
                              message.role === 'user'
                                ? 'bg-blue-600 ml-auto text-white'
                                : 'bg-[#2A2867] mr-auto text-white'
                            }`}
                          >
                            <div className="text-sm leading-relaxed">
                              {message.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="relative">
                        <Input
                          placeholder="Ask any study question..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !isLoading && query.trim() && handleSendMessage()}
                          disabled={isLoading}
                          className="w-full py-6 px-4 pr-24 bg-[#2A2867] text-white border-none rounded-xl focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        />
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={isLoading || !query.trim()}
                          className="absolute right-2 top-2 h-[calc(100%-16px)] px-5 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg"
                        >
                          {isLoading ? 'Thinking...' : 'Send'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="explain" className="mt-0 w-full">
                <div className="max-w-4xl mx-auto">
                  <ConceptExplainer sessionId={sessionId} />
                </div>
              </TabsContent>

              <TabsContent value="practice" className="mt-0 w-full">
                <div className="max-w-4xl mx-auto">
                  <ProblemGenerator sessionId={sessionId} userId={userId} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AITutorView;
