
import { Link } from 'react-router-dom';
import { Sparkle, BookOpen, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignInButton, SignUpButton, UserButton, UserProfile } from '@clerk/clerk-react';
const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-primary font-bold text-xl">StudySync</span>
          </div>
          <div className="flex items-center space-x-4">
            <>
              <Button variant="ghost" asChild>
                <SignInButton />
              </Button>
              <Button asChild>
                <SignUpButton />
              </Button>
            </>
            <UserButton />
          </div>
        </div>
      </header >

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 flex-1" >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                <Sparkle className="h-4 w-4 mr-2" />
                <span>AI-Powered Collaborative Learning</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                Study smarter, together with StudySync
              </h1>
              <p className="text-xl text-gray-600">
                The collaborative learning platform that combines real-time group study, AI assistance, and progress tracking to help you master any subject.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link to="/dashboard">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/explore">Explore Features</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 border border-gray-100 relative z-10 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Quantum Mechanics Review</h3>
                    <p className="text-sm text-gray-500">Physics 101 • Today at 3:00 PM</p>
                  </div>
                  <Button size="sm" className="bg-tertiary hover:bg-tertiary/90">Join Now</Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center p-3 rounded-lg bg-gray-50">
                    <div className="bg-primary/10 p-2 rounded mr-3">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">5 participants have joined</p>
                      <p className="text-xs text-gray-500">Alex, Maria, David and 2 others</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 rounded-lg bg-gray-50">
                    <div className="bg-primary/10 p-2 rounded mr-3">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">3 resources available</p>
                      <p className="text-xs text-gray-500">Lecture notes, practice problems, and more</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 rounded-lg bg-gray-50">
                    <div className="bg-tertiary/10 p-2 rounded mr-3">
                      <Sparkle className="h-4 w-4 text-tertiary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">AI Tutor is available</p>
                      <p className="text-xs text-gray-500">Get help and generate practice problems</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-1/2 right-5 transform translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full -z-10"></div>
              <div className="absolute bottom-5 left-10 transform -translate-x-1/2 translate-y-1/2 w-40 h-40 bg-secondary/5 rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </section >

      {/* Features Section */}
      <section className="py-16 bg-white" >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need for effective group study</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              StudySync combines the best collaborative tools with AI assistance to create the ultimate learning environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Collaborative Study Groups</h3>
                <p className="text-gray-600">
                  Create or join study groups based on subjects, connect with peers, and schedule interactive study sessions.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Create public or private groups', 'Invite classmates to join', 'Organize by subject or course'].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-tertiary mr-2" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-time Study Tools</h3>
                <p className="text-gray-600">
                  Collaborate with shared documents, interactive whiteboards, and group chat all in one unified platform.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Shared document editor', 'Interactive whiteboard', 'Real-time chat and discussions'].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-tertiary mr-2" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                  <Sparkle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Learning</h3>
                <p className="text-gray-600">
                  Get assistance from our AI tutor, generate practice problems, and receive personalized study recommendations.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Ask questions and get explanations', 'Generate custom practice problems', 'Track progress and identify weak areas'].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-tertiary mr-2" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section >

      {/* Call to Action */}
      <section className="py-16 bg-primary/5" >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform how you study?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Join thousands of students who are already using StudySync to improve their learning outcomes and study more effectively.
          </p>
          <Button size="lg" asChild>
            <Link to="/dashboard">Get Started Today</Link>
          </Button>
        </div>
      </section >

      {/* Footer */}
      <footer className="bg-white border-t py-8" >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-primary font-bold text-xl">StudySync</span>
              <p className="text-gray-500 text-sm mt-2">© 2025 StudySync. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/about" className="text-gray-500 hover:text-primary">About</Link>
              <Link to="/privacy" className="text-gray-500 hover:text-primary">Privacy</Link>
              <Link to="/terms" className="text-gray-500 hover:text-primary">Terms</Link>
              <Link to="/contact" className="text-gray-500 hover:text-primary">Contact</Link>
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
};

export default Index;
