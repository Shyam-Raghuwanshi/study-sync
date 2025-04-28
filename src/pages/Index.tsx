import { Link } from 'react-router-dom';
import { Sparkle, BookOpen, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UserProfile from '@/components/user-profile';
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
            <UserProfile />
          </div>
        </div>
      </header >

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-violet-50 to-white py-12 md:py-20 flex-1">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 text-violet-600 text-sm font-medium mb-2">
                <Sparkle className="h-4 w-4 mr-2" />
                <span>AI-Powered Collaborative Learning</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                Study smarter, together with StudySync
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
                The collaborative learning platform that combines real-time group study, AI assistance, and Video, Audio Call to help you master any subject.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700" asChild>
                  <Link to="/dashboard">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              {/* Background elements with updated colors */}
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-purple-300/15 rounded-full blur-xl -z-10 animate-pulse"></div>
              <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-cyan-300/15 rounded-full blur-2xl -z-10 animate-pulse delay-1000"></div>
              <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-orange-300/30 rounded-lg blur-lg -z-10 animate-pulse delay-500"></div>

              <div className="bg-gradient-to-br from-white to-violet-50 rounded-2xl shadow-2xl p-4 sm:p-8 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Interactive Feature Cards */}
                  <div className="group hover:scale-105 transition-transform duration-300 space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-violet-100">
                    <div className="bg-violet-100 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                      <Users className="h-6 w-6 text-violet-600 group-hover:animate-bounce" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Live Collaboration</h3>
                    <p className="text-sm text-slate-600">Study together in real-time with video, voice, and chat</p>
                  </div>

                  <div className="group hover:scale-105 transition-transform duration-300 space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-teal-100">
                    <div className="bg-teal-100 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                      <Sparkle className="h-6 w-6 text-teal-600 group-hover:animate-spin" />
                    </div>
                    <h3 className="font-semibold text-slate-900">AI Tutor</h3>
                    <p className="text-sm text-slate-600">Get instant help and personalized practice problems</p>
                  </div>

                  <div className="group hover:scale-105 transition-transform duration-300 space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-amber-100">
                    <div className="bg-amber-100 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-amber-600 group-hover:animate-pulse" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Smart Resources</h3>
                    <p className="text-sm text-slate-600">Access and share study materials seamlessly</p>
                  </div>

                  <div className="group hover:scale-105 transition-transform duration-300 space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-emerald-100">
                    <div className="bg-emerald-100 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 group-hover:animate-bounce" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Track Progress</h3>
                    <p className="text-sm text-slate-600">Monitor your learning journey with analytics</p>
                  </div>
                </div>
 
              </div>

              {/* Enhanced Decorative Elements with updated colors */}
              <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300/30 rounded-full blur-2xl -z-10 animate-pulse"></div>
              <div className="absolute bottom-0 left-10 transform -translate-x-1/2 translate-y-1/2 w-48 h-48 bg-emerald-300/30 rounded-full blur-xl -z-10 animate-pulse"></div>
              <div className="absolute top-10 left-0 transform -translate-x-1/2 w-24 h-24 bg-yellow-300/30 rounded-full blur-lg -z-10 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-slate-900">Everything you need for effective group study</h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              StudySync combines the best collaborative tools with AI assistance to create the ultimate learning environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-violet-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                  <Users className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900">Collaborative Study Groups</h3>
                <p className="text-slate-600">
                  Create or join study groups based on subjects, connect with peers, and schedule interactive study sessions.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Create public or private groups', 'Invite classmates to join', 'Organize by subject or course'].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 mr-2" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-teal-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                  <BookOpen className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900">Real-time Study Tools</h3>
                <p className="text-slate-600">
                  Collaborate with shared documents, interactive whiteboards, and group chat all in one unified platform.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Shared document editor', 'Interactive whiteboard', 'Real-time chat and discussions'].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 mr-2" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-amber-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                  <Sparkle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900">AI-Powered Learning</h3>
                <p className="text-slate-600">
                  Get assistance from our AI tutor, generate practice problems, and receive personalized study recommendations.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Ask questions and get explanations', 'Generate custom practice problems', 'Track progress and identify weak areas'].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 mr-2" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 md:py-16 bg-violet-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6 text-slate-900">Ready to transform how you study?</h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-6 md:mb-8">
            Join thousands of students who are already using StudySync to improve their learning outcomes and study more effectively.
          </p>
          <Button size="lg" className="bg-violet-600 hover:bg-violet-700" asChild>
            <Link to="/dashboard">Get Started Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-violet-600 font-bold text-xl">StudySync</span>
              <p className="text-slate-500 text-sm mt-2">© 2025 StudySync. All rights reserved.</p>
            </div>
            {/* Added Footer Links */}
            <div className="flex space-x-4">
              <Link to="/privacy" className="text-sm text-slate-500 hover:text-slate-700">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-slate-500 hover:text-slate-700">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
};

export default Index;
