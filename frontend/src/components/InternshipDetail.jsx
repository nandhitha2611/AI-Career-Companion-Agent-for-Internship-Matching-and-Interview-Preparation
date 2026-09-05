import React, { useState, useRef } from 'react';

const API_BASE_URL = 'http://localhost:8000';

export default function InternshipDetail({ internship, onBack, selectedFile }) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetterOption, setCoverLetterOption] = useState('none'); // 'none' | 'ai' | 'custom'
  const [coverLetterText, setCoverLetterText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);

  // Resume state management inside modal
  const [activeResumeFile, setActiveResumeFile] = useState(selectedFile || null);
  const fileInputRef = useRef(null);

  if (!internship) return null;

  const roleTitle = internship.role_title || internship.title || 'Internship Position';
  const company = internship.company || 'Company';
  const location = internship.location || 'Remote';
  const workMode = internship.work_mode || (location.toLowerCase().includes('remote') ? 'Remote' : 'In-Office');
  const stipend = internship.stipend_inr_per_month ?? internship.stipend;
  const matchedSkills = internship.matched_skills || internship.matching_skills || internship.required_skills || [];
  const missingSkills = internship.missing_skills || internship.skill_gaps || [];

  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setActiveResumeFile(e.target.files[0]);
    }
  };

  const handleGenerateAICoverLetter = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE_URL}/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          internship_id: internship.id,
          role_title: roleTitle,
          company_name: company,
          description: internship.description || '',
          required_skills: matchedSkills.concat(missingSkills),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter.');
      }

      const data = await response.json();
      setCoverLetterText(data.cover_letter || data.result || data.text || '');
    } catch (err) {
      console.error('Cover Letter API Error:', err);
      setError('Could not generate AI cover letter. You can still submit without one or paste custom text.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionChange = (option) => {
    setCoverLetterOption(option);
    setError(null);
    if (option === 'ai' && !coverLetterText) {
      handleGenerateAICoverLetter();
    }
  };

  const handleFinalSubmit = () => {
    setApplied(true);
    setShowApplyModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      {/* Back Link */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
      >
        ← Back to Matches
      </button>

      {/* Main Detail Header Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 mb-2">
              Actively Hiring
            </span>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{roleTitle}</h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {company} • {workMode} ({location}) • {stipend ? `₹ ${stipend}/month` : 'Unpaid'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowApplyModal(true)}
            disabled={applied}
            className={`px-6 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-sm ${
              applied
                ? 'bg-emerald-600 cursor-default'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {applied ? '✓ Application Submitted' : 'Apply Now'}
          </button>
        </div>

        {/* Skill Breakdown */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <h3 className="text-xs font-bold text-gray-700">Required Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((s, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg text-[11px] font-medium">
                ✓ {s}
              </span>
            ))}
            {missingSkills.map((s, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-lg text-[11px] font-medium">
                + {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Role Description */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-800">About the Role & Responsibilities</h2>
        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
          {internship.description || `Build and ship user-facing features for our web application platforms, working closely with engineering teams on performance, accessibility, and UI component design.`}
        </p>
      </div>

      {/* Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden space-y-5 p-6">
            
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Review Application Details</h2>
                <p className="text-xs text-gray-500">Confirm details before submitting your application to {company}.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Application Overview Box */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Role & Company:</span>
                <span className="font-semibold text-gray-800">{roleTitle} @ {company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Work Setup:</span>
                <span className="font-semibold text-gray-800">{workMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location Details:</span>
                <span className="font-semibold text-gray-800">{location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stipend:</span>
                <span className="font-semibold text-gray-800">{stipend ? `₹ ${stipend}/month` : 'Unpaid'}</span>
              </div>

              {/* Dynamic Resume Picker */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                <span className="text-gray-500">Selected Resume:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600 truncate max-w-[180px]">
                    📄 {activeResumeFile ? activeResumeFile.name : 'Parsed Profile Data'}
                  </span>
                  
                  {/* File Input trigger */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleResumeChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-gray-500 hover:text-blue-600 font-bold underline px-1"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            {/* Cover Letter Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-800">Cover Letter Option</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleOptionChange('none')}
                  className={`p-2.5 rounded-xl border text-[11px] font-semibold transition-all ${
                    coverLetterOption === 'none'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Skip Letter
                </button>
                <button
                  type="button"
                  onClick={() => handleOptionChange('ai')}
                  className={`p-2.5 rounded-xl border text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                    coverLetterOption === 'ai'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  ✨ AI Cover Letter
                </button>
                <button
                  type="button"
                  onClick={() => handleOptionChange('custom')}
                  className={`p-2.5 rounded-xl border text-[11px] font-semibold transition-all ${
                    coverLetterOption === 'custom'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Paste Custom
                </button>
              </div>

              {coverLetterOption === 'ai' && (
                <div className="space-y-2 pt-1">
                  {isGenerating ? (
                    <div className="p-4 bg-blue-50/50 rounded-xl text-center text-xs text-blue-600 font-medium">
                      Generating tailored cover letter with AI...
                    </div>
                  ) : (
                    <textarea
                      rows="5"
                      value={coverLetterText}
                      onChange={(e) => setCoverLetterText(e.target.value)}
                      placeholder="AI generated cover letter will appear here..."
                      className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:border-blue-500 outline-none"
                    />
                  )}
                </div>
              )}

              {coverLetterOption === 'custom' && (
                <div className="pt-1">
                  <textarea
                    rows="5"
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    placeholder="Paste your cover letter here..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isGenerating}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Confirm & Submit Application
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}