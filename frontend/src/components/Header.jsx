// src/components/Header.jsx
import React from 'react';

export default function Header({ activeTab, setActiveTab, isAuthenticated, user, onAuthClick }) {
  const navTabs = ['home', 'internships', 'ats-score', 'match-internships', 'interview-prep'];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 text-base tracking-tight leading-none">
              AI Internship Agent
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
              Find. Match. Apply.
            </span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-2">
          {navTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>

        {/* AUTH ACTION / USER PROFILE */}
        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => onAuthClick('login')}
                className="text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => onAuthClick('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all"
              >
                Get Started
              </button>
            </>
          ) : (
            <div 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 border px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-slate-100/80 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-bold text-slate-800">
                {user?.name || 'User Profile'}
              </span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}