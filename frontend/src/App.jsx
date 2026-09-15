// frontend/src/App.jsx
import React, { useState } from 'react';
import Header from './components/Header';
import LandingHero from './components/LandingHero';
import FeatureShowcase from './components/FeatureShowCase';
import AuthForm from './components/Authform';
import Internships from './components/Internships';
import MatchInternships from './components/MatchInternships';
import UserProfile from './components/UserProfile';
import ChatWidget from './components/ChatWidget';
import AtsCheckerPage from './components/AtsCheckerPage';
import InterviewPreparation from './components/InterviewPreparation';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');

  const handleAuthClick = (type) => {
    if (type === 'login' || type === 'signup') {
      setAuthMode(type);
      setActiveTab('auth');
    }
  };

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased relative">
      {activeTab !== 'auth' && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAuthenticated={isAuthenticated}
          user={user}
          onAuthClick={handleAuthClick}
        />
      )}

      {/* FULL-SCREEN AUTH VIEW */}
      {activeTab === 'auth' && (
        <div className="min-h-screen w-full bg-blue-600 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl flex justify-center">
            <AuthForm 
              initialMode={authMode} 
              onLogin={handleLoginSuccess}
            />
          </div>
        </div>
      )}

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <main className="w-full bg-white">
          <LandingHero onGetStarted={() => handleAuthClick('signup')} />
          <FeatureShowcase />
        </main>
      )}

      {/* INTERNSHIPS TAB */}
      {activeTab === 'internships' && (
        <main className="w-full">
          <Internships />
        </main>
      )}

      {/* ATS SCORE TAB */}
      {activeTab === 'ats-score' && (
        <main className="w-full">
          <AtsCheckerPage initialResumeId={user?.resume_id} />
        </main>
      )}

      {/* MATCH INTERNSHIPS TAB */}
      {activeTab === 'match-internships' && (
        <main className="w-full">
          <MatchInternships />
        </main>
      )}

      {/* INTERVIEW PREP TAB */}
      {activeTab === 'interview-prep' && (
        <main className="w-full">
          <InterviewPreparation />
        </main>
      )}

      {/* USER PROFILE TAB */}
      {activeTab === 'profile' && (
        <main className="w-full">
          <UserProfile />
        </main>
      )}

      {/* RENDER CHATBOT FLOATING WIDGET GLOBALLY */}
      <ChatWidget userId={user?.id} />
    </div>
  );
}