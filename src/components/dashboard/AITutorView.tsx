import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConceptExplainer from '../ai/ConceptExplainer';
import ProblemGenerator from '../ai/ProblemGenerator';
import ProgressAnalyzer from '../ai/ProgressAnalyzer';
import { useUser } from '@clerk/clerk-react';
import { useAction } from 'convex/react';
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
  
  // AI Tutor action
  const askAITutor = useAction(api.aiTutor.ask);
  
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
    <div className="container p-4">
      <h1 className="text-2xl font-bold mb-6">AI Learning Assistant</h1>
      
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="explain">Concept Explainer</TabsTrigger>
          <TabsTrigger value="practice">Practice Problems</TabsTrigger>
          <TabsTrigger value="progress">Progress Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>AI Tutor Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chat-container h-[400px] overflow-y-auto border rounded p-4 mb-4 flex flex-col gap-2">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 my-auto">
                    Start a conversation with your AI tutor!
                  </div>
                ) : (
                  chatMessages.map(message => (
                    <div 
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-100 ml-auto max-w-[80%]' 
                          : 'bg-gray-100 mr-auto max-w-[80%]'
                      }`}
                    >
                      <div className="font-semibold mb-1">
                        {message.role === 'user' ? 'You' : 'AI Tutor'}
                      </div>
                      <div>{message.content}</div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ask any study question..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <Button onClick={handleSendMessage} disabled={isLoading || !query.trim()}>
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="explain">
          <Card>
            <CardHeader>
              <CardTitle>Concept Explainer</CardTitle>
            </CardHeader>
            <CardContent>
              <ConceptExplainer sessionId={sessionId} userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="practice">
          <Card>
            <CardHeader>
              <CardTitle>Practice Problem Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <ProblemGenerator sessionId={sessionId} userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressAnalyzer sessionId={sessionId} userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AITutorView;
