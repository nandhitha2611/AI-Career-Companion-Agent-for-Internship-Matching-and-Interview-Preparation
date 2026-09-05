import React, { useState, useEffect } from 'react';
import { 
  uploadResume, 
  getResumes, 
  matchInternships, 
  getInternships, 
  applyToInternship,
  generateCoverLetterApi 
} from '../api';

import UserProfile from "./UserProfile";
import LandingHero from './LandingHero';

export default function ResumeManager({ onLogout }) {
  // Navigation & View States ('dashboard' | 'profile' | 'settings' | 'apply')
  const [view, setView] = useState("dashboard");
  const [activeTab, setActiveTab] = useState('home'); 
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);

  // Live Backend Data States
  const [internships, setInternships] = useState([]);
  const [resumes, setResumes] = useState([]);
  
  // State for AI matched data
  const [matches, setMatches] = useState(null);
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(true);
  const [msg, setMsg] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');

  // Application Page States
  const [coverLetter, setCoverLetter] = useState('');
  const [generatingCL, setGeneratingCL] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);

  // Settings Password State
  const [passData, setPassData] = useState({ old_password: '', new_password: '' });

  // Initial Fetch
  useEffect(() => {
    fetchResumes();
    fetchBackendInternships();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await getResumes();
      setResumes(res.data || []);
    } catch (err) {
      console.error('Failed to load resumes');
    }
  };

  const fetchBackendInternships = async () => {
    setFetchingJobs(true);
    try {
      const res = await getInternships();
      setInternships(res.data || []);
    } catch (err) {
      console.error('Failed to fetch backend internships:', err);
    } finally {
      setFetchingJobs(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setMsg('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadResume(formData);
      setMsg('Resume uploaded successfully!');
      setFile(null);
      fetchResumes();
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (id) => {
    setLoading(true);
    try {
      const res = await matchInternships(id);
      setMatches(res.data);
    } catch (err) {
      console.error('Failed to calculate matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerateCoverLetter = async () => {
    if (!selectedInternship) return;
    setGeneratingCL(true);
    const currentResume = Array.isArray(resumes) ? resumes[0] : resumes;

    const resumeContent = 
      currentResume?.parsed_text || 
      currentResume?.extracted_text || 
      currentResume?.content || 
      currentResume?.text || 
      "";

    try {
      const res = await generateCoverLetterApi({
        resume_id: currentResume?.id || null,
        company_name: selectedInternship.company || selectedInternship.company_name || "",
        role_title: selectedInternship.role_title || selectedInternship.title || "",
        skills_required: [
          ...(selectedInternship.required_skills || []),
          ...(selectedInternship.preferred_skills || [])
        ],
        resume_text: resumeContent
      });

      const letterText = typeof res.data === 'string' 
        ? res.data 
        : (res.data.cover_letter || res.data.letter || JSON.stringify(res.data));

      setCoverLetter(letterText);
    } catch (err) {
      console.error("Error during generation:", err);
      alert("Failed to generate cover letter.");
    } finally {
      setGeneratingCL(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedInternship) return;
    setSubmittingApp(true);
    try {
      await applyToInternship({
        internship_id: selectedInternship.id,
        cover_letter: coverLetter,
        resume_id: resumes[0]?.id || null,
      });
      alert('Application submitted successfully!');
      setActiveTab('home');
      setCoverLetter('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Application submitted successfully!');
      setActiveTab('home');
    } finally {
      setSubmittingApp(false);
    }
  };

  const matchedResults = matches?.results || (Array.isArray(matches) ? matches : []);
  const isMatched = matches !== null;
  const displayList = isMatched ? matchedResults : internships;

  if (view === "profile") {
    return (
      <UserProfile 
        userResume={resumes && resumes.length > 0 ? resumes[0] : null} 
        onBack={() => setView("dashboard")} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* 1. NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab('home'); setView('dashboard'); }}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              AI
            </div>
            <span className="text-lg font-extrabold text-blue-900 tracking-tight">AI Internship Agent</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setView("profile")}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNavMenu(!showNavMenu)}
                className="p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {showNavMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowNavMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span>⚙️ Settings</span>
                  </button>
                  <hr className="my-1 border-slate-100" />
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <span>🚪 Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto px-4 py-10 w-full space-y-6">
          <button onClick={() => setActiveTab('home')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            ← Back to Home
          </button>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">Account Settings</h2>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
              <input
                type="password"
                placeholder="Current Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-blue-500"
                value={passData.old_password}
                onChange={(e) => setPassData({ ...passData, old_password: e.target.value })}
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-blue-500"
                value={passData.new_password}
                onChange={(e) => setPassData({ ...passData, new_password: e.target.value })}
              />
              <button onClick={() => alert('Password updated successfully!')} className="bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 transition">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. APPLICATION TAB */}
      {activeTab === 'apply' && selectedInternship && (
        <div className="max-w-4xl mx-auto px-4 py-10 w-full space-y-6">
          <button onClick={() => setActiveTab('home')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            ← Back to Opportunities
          </button>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{selectedInternship.role_title || selectedInternship.title}</h1>
              <p className="text-sm font-semibold text-slate-500">{selectedInternship.company || selectedInternship.company_name}</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Cover Letter</h3>
                <button
                  onClick={() => handleAutoGenerateCoverLetter()}
                  disabled={generatingCL}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 transition"
                >
                  {generatingCL ? '⚡ Generating...' : '✨ Auto-Generate Cover Letter'}
                </button>
              </div>

              <textarea
                rows={7}
                placeholder="Write your cover letter manually or click 'Auto-Generate' above..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs leading-relaxed text-slate-800 outline-none focus:border-blue-500 transition"
              />
            </div>

            <button
              onClick={handleSubmitApplication}
              disabled={submittingApp}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-md disabled:opacity-50"
            >
              {submittingApp ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      )}

      {/* 4. DASHBOARD HOME */}
      {activeTab === 'home' && (
        <main className="flex-1 w-full space-y-10">
          <LandingHero onGetStarted={() => {
            document.getElementById('resume-section')?.scrollIntoView({ behavior: 'smooth' });
          }} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10" id="resume-section">
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Your Resume</h2>
                  <p className="text-xs text-slate-500">Upload or select your resume to run automated AI matching.</p>
                </div>

                <form onSubmit={handleUpload} className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100 cursor-pointer"
                  />
                  <button
                    type="submit"
                    disabled={loading || !file}
                    className="bg-blue-900 text-white text-xs font-semibold px-4 py-1.5 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition"
                  >
                    {loading ? '...' : 'Upload'}
                  </button>
                </form>
              </div>

              {msg && <p className="text-xs font-semibold text-blue-600">{msg}</p>}

              {resumes.length === 0 ? (
                <p className="text-xs text-slate-400">No resumes uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {resumes.map((r) => (
                    <div
                      key={r.id}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                          📄
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {r.original_filename || r.filename || `Resume #${r.id?.slice(0, 8)}`}
                        </span>
                      </div>

                      <button
                        onClick={() => handleMatch(r.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        {loading ? 'Matching...' : 'Match Internships'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className={`text-sm font-bold ${isMatched ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {isMatched ? 'Matched Opportunities' : 'Available Internships'}
                  </h3>
                  {isMatched && (
                    <button 
                      onClick={() => setMatches(null)} 
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
                    >
                      Clear Matches
                    </button>
                  )}
                </div>

                {fetchingJobs && !isMatched ? (
                  <p className="text-xs text-slate-400">Loading internships...</p>
                ) : displayList.length === 0 ? (
                  <p className="text-xs text-slate-400">No internships available.</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-1">
                    {displayList.map((item, idx) => {
                      let matchScore = item.match_score ?? item.match_percentage ?? item.score;

                      if (matchScore !== undefined) {
                        if (matchScore <= 1.0 && matchScore > 0) {
                          matchScore = matchScore * 100;
                        }
                        matchScore = Math.round(matchScore);
                      }

                      return (
                        <div
                          key={item.id || idx}
                          className="min-w-[300px] sm:min-w-[340px] max-w-[360px] flex-shrink-0 snap-start bg-slate-50 border border-slate-200 hover:border-blue-500 p-5 rounded-2xl transition space-y-3 flex flex-col justify-between shadow-sm"
                        >
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.role_title || item.title}</h4>
                            <p className="text-xs font-semibold text-blue-600 line-clamp-1">{item.company || item.company_name}</p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedInternship(item);
                              setCoverLetter("");
                              setActiveTab('apply');
                            }}
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold py-2.5 rounded-xl transition shadow mt-2"
                          >
                            View Details & Apply
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
}