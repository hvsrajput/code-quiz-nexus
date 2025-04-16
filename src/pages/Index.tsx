import React, { useState, useEffect } from 'react';
import UserNameForm from '@/components/UserNameForm';
import CodeEntryForm from '@/components/CodeEntryForm';
import QuizCreator from '@/components/QuizCreator';
import QuizTaker from '@/components/QuizTaker';
import QuizResult from '@/components/QuizResult';
import DashboardTabs from '@/components/DashboardTabs';
import Navbar from '@/components/Navbar';

// Define the app states
type AppState = 'login' | 'dashboard' | 'create' | 'join' | 'take' | 'result';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('login');
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  
  // Check for saved user data on component mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedUserName = localStorage.getItem('userName');
    
    if (savedUserId && savedUserName) {
      setUserId(savedUserId);
      setUserName(savedUserName);
      setAppState('dashboard');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setUserId(null);
    setUserName(null);
    setAppState('login');
  };

  // Handle user creation/login
  const handleUserCreated = (userId: string, userName: string) => {
    setUserId(userId);
    setUserName(userName);
    
    // Save to local storage for persistence
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', userName);
    
    setAppState('dashboard');
  };

  // Handle quiz creation
  const handleQuizCreated = (quizId: string, accessCode: string) => {
    console.log(`Quiz created with ID: ${quizId}, Access Code: ${accessCode}`);
    setAppState('dashboard');
  };

  // Handle quiz found by code
  const handleQuizFound = (quizId: string) => {
    setQuizId(quizId);
    setAppState('take');
  };

  // Handle quiz completion
  const handleQuizCompleted = (attemptId: string) => {
    setAttemptId(attemptId);
    setAppState('result');
  };

  // Handle back to home
  const handleBackToHome = () => {
    setAppState('dashboard');
  };

  const renderContent = () => {
    switch (appState) {
      case 'login':
        return (
          <div className="my-8">
            <h1 className="text-3xl font-bold text-center mb-6">Welcome to Smart Quiz</h1>
            <p className="text-center text-muted-foreground mb-8">Please enter your name to continue</p>
            <UserNameForm onUserCreated={handleUserCreated} />
          </div>
        );
        
      case 'dashboard':
        return (
          <div className="my-8">
            <DashboardTabs 
              userId={userId!} 
              userName={userName!} 
              onCreateQuiz={() => setAppState('create')} 
              onJoinQuiz={() => setAppState('join')} 
              onViewQuizResult={(attemptId) => {
                setAttemptId(attemptId);
                setAppState('result');
              }} 
            />
          </div>
        );
        
      case 'create':
        return (
          <div className="my-8">
            <h1 className="text-3xl font-bold text-center mb-6">Create a New Quiz</h1>
            <p className="text-center text-muted-foreground mb-8">Design your quiz with custom questions and answers</p>
            <QuizCreator userId={userId!} onQuizCreated={handleQuizCreated} />
          </div>
        );
        
      case 'join':
        return (
          <div className="my-8">
            <h1 className="text-3xl font-bold text-center mb-6">Join a Quiz</h1>
            <p className="text-center text-muted-foreground mb-8">Enter the quiz code to start</p>
            <CodeEntryForm onQuizFound={handleQuizFound} />
          </div>
        );
        
      case 'take':
        return (
          <div className="my-8">
            <QuizTaker quizId={quizId!} userId={userId!} onQuizCompleted={handleQuizCompleted} />
          </div>
        );
        
      case 'result':
        return (
          <div className="my-8">
            <QuizResult attemptId={attemptId!} onBackToHome={handleBackToHome} />
          </div>
        );
        
      default:
        return <div>Something went wrong</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={userName} onLogout={handleLogout} />
      <div className="container mx-auto px-4 py-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
