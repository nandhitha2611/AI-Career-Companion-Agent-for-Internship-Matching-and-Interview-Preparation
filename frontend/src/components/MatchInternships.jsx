import React, { useState } from 'react';
import InternshipDetail from './InternshipDetail';

const API_BASE_URL = 'http://localhost:8000';

export default function MatchInternships() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [matchedInternships, setMatchedInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [error, setError] = useState(null);

  // If user clicked an internship, switch to detailed view
  if (selectedInternship) {
    return (
      <InternshipDetail
        internship={selectedInternship}
        onBack={() => setSelectedInternship(null)}
      />
    );
  }

  if (selectedInternship) {
  return (
    <InternshipDetail
      internship={selectedInternship}
      selectedFile={selectedFile}
      onBack={() => setSelectedInternship(null)}
    />
  );
}

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setResumeText('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleMatch = async () => {
    if (!selectedFile && !resumeText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

      let resumeId = null;

      setStatusMessage('Parsing resume via backend service...');
      const formData = new FormData();
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        const textBlob = new Blob([resumeText], { type: 'text/plain' });
        formData.append('file', textBlob, 'resume.txt');
      }

      const uploadRes = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
      });

      if (!uploadRes.ok) {
        if (uploadRes.status === 401) {
          throw new Error('Authentication required. Please log in to run matching.');
        }
        throw new Error('Failed to process resume file on backend.');
      }

      const uploadData = await uploadRes.json();
      resumeId = uploadData.id || uploadData.resume_id;

      if (!resumeId) {
        throw new Error('Backend did not return a valid resume ID.');
      }

      setStatusMessage('Matching against internship database...');
      
      const matchRes = await fetch(`${API_BASE_URL}/internships/match/${resumeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (!matchRes.ok) {
        throw new Error('Error executing backend internship matcher.');
      }

      const matchData = await matchRes.json();
      const results = Array.isArray(matchData) ? matchData : (matchData.matches || matchData.results || []);
      setMatchedInternships(results);

    } catch (err) {
      console.error('Match Pipeline Error:', err);
      setError(err.message || 'Failed to connect to backend matching service.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Match Internships with Your Resume
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            Upload your resume or paste profile skills to view instant ATS match scores and missing skill gaps.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-3xl mx-auto space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
            }`}
          >
            <p className="text-xs font-semibold text-gray-700 mb-1">
              {selectedFile ? `Selected File: ${selectedFile.name}` : 'Drag & drop your resume file here'}
            </p>
            <p className="text-[11px] text-gray-400 mb-3">Supports .pdf, .docx, .txt</p>

            <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium cursor-pointer transition-colors shadow-sm">
              Browse File
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          <div className="relative text-center">
            <span className="bg-white px-3 text-[11px] text-gray-400 uppercase font-medium">
              OR PASTE RESUME TEXT BELOW
            </span>
          </div>

          <textarea
            rows="4"
            placeholder="Paste raw resume text here..."
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              if (e.target.value.trim()) setSelectedFile(null);
            }}
            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:border-blue-500 outline-none transition-all"
          />

          <div className="flex justify-between items-center pt-2">
            {(selectedFile || resumeText) ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setResumeText('');
                  setMatchedInternships([]);
                }}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Clear Selection
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleMatch}
              disabled={(!selectedFile && !resumeText.trim()) || isLoading}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-sm ${
                (!selectedFile && !resumeText.trim()) || isLoading
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? (statusMessage || 'Matching...') : 'Match Internships'}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium text-center">
            {error}
          </div>
        )}

        {/* Matched Cards Output */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {matchedInternships.length > 0 && (
            <h2 className="text-sm font-bold text-gray-800">
              Matched Roles ({matchedInternships.length})
            </h2>
          )}

          <div className="grid grid-cols-1 gap-4">
            {matchedInternships.map((item, idx) => {
              const rawScore = item.matchScore ?? item.match_score ?? item.score;
              const score = typeof rawScore === 'number' && rawScore <= 1 ? Math.round(rawScore * 100) : rawScore;
              
              const matchedSkills = item.matched_skills || item.matching_skills || item.required_skills || item.skills || [];
              const missingSkills = item.missing_skills || item.skill_gaps || [];
              const stipendVal = item.stipend_inr_per_month ?? item.stipend;

              return (
                <div
                  key={item.id || idx}
                  onClick={() => setSelectedInternship(item)}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-800 hover:text-blue-600 transition-colors">
                        {item.role_title || item.title || 'Internship Title'}
                      </h3>
                      {item.domain && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                          {item.domain}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      {item.company || 'Company'} • {item.location || 'Remote'} • {stipendVal ? `₹ ${stipendVal}/month` : 'Unpaid'}
                    </p>

                    <div className="space-y-2 pt-1">
                      {matchedSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Matched:</span>
                          {matchedSkills.map((skill, sIdx) => (
                            <span key={sIdx} className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-[11px] font-medium">
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {missingSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Missing:</span>
                          {missingSkills.map((skill, mIdx) => (
                            <span key={mIdx} className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-md text-[11px] font-medium">
                              + {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {score !== undefined && (
                    <div className="w-full md:w-32 flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50/50 border border-blue-100/80 self-center">
                      <span className="text-2xl font-black text-blue-600">{score}%</span>
                      <span className="text-[10px] font-semibold text-gray-500">Match Score</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}