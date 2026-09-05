// src/components/LandingHero.jsx
import React from 'react';

export default function LandingHero({ onGetStarted }) {
  return (
    <div className="w-full bg-gradient-to-b from-blue-50/80 via-slate-50 to-white border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: Main Text & CTA */}
        <div className="lg:col-span-6 space-y-6 text-left">
          
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Your AI Internship Agent: <br />
              <span className="text-blue-600">Find. Match. Apply.</span>
            </h1>

            <h2 className="text-lg sm:text-xl font-bold text-slate-700 tracking-tight">
              Turn your resume into your personal internship search assistant.
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
            Upload your resume and let AI understand your skills, projects, education, and experience. Discover internships that actually match your profile, get personalized recommendations, and generate tailored cover letters in seconds.
          </p>

          {/* CTA & Subtext */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-xl shadow-md transition-all duration-200 transform hover:-translate-y-0.5 inline-flex items-center gap-2 group"
            >
              <span>Find My Internships</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <p className="text-[11px] font-medium text-slate-400">
              Free to get started • AI-powered • Personalized recommendations
            </p>
          </div>

          {/* Badge Tags */}
          <div className="pt-4 border-t border-slate-200/60 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-blue-600">✨</span>
              <span>AI-Powered Matching</span>
            </div>
            
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-blue-600">✉️</span>
              <span>Personalized Cover Letters</span>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-blue-600">📊</span>
              <span>Smart Resume Analysis</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive AI Dashboard Mockup */}
        <div className="lg:col-span-6 relative">
          
          {/* Decorative Glow Effect behind the card */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-3xl opacity-20 blur-xl"></div>

          {/* UI Mockup Window */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 text-xs font-sans">
            
            {/* Window Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                <span className="ml-2 font-bold text-slate-700 text-[11px]">AI Agent Workspace</span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                Live Scan Active
              </span>
            </div>

            {/* Resume Analysis Summary Bar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  📄
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">Resume_Updated.pdf</p>
                  <p className="text-[11px] text-slate-500">Extracted: React, Python, PostgreSQL, AWS</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                94% Match Score
              </span>
            </div>

            {/* Sample Matched Internship Cards */}
            <div className="space-y-2.5">
              <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-sm flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Top Recommendation
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs">Full Stack Developer Intern</h4>
                  <p className="text-[11px] text-slate-500">TechCorp Solutions • Remote • ₹25,000/mo</p>
                </div>
                <button className="bg-blue-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow">
                  Auto-Apply
                </button>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex justify-between items-center opacity-80">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-xs">Cloud Engineering Intern</h4>
                  <p className="text-[11px] text-slate-500">CloudScale Systems • Hybrid • ₹30,000/mo</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                  88% Match
                </span>
              </div>
            </div>

            {/* AI Generated Cover Letter Preview snippet */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Cover Letter Generator</span>
                <span className="text-[10px] text-blue-600 font-semibold">Generated in 1.2s</span>
              </div>
              <p className="text-[11px] text-slate-600 italic line-clamp-2">
                "Dear Hiring Manager, I am excited to apply for the Full Stack Developer Intern position. My hands-on experience with React, AWS, and REST APIs aligns seamlessly..."
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}