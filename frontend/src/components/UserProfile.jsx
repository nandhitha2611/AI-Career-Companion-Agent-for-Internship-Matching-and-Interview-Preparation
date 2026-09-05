import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'http://localhost:8000';

const initialProfileState = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  github: '',
  summary: '',
  education: [],
  work_experience: [],
  projects: [],
  internships: [],
  certifications: [],
  technical_skills: [],
  soft_skills: [],
  languages: [],
  achievements: [],
};

// Normalize string, array, or JSON object into a consistent array for cards
const normalizeToArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return [data];
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return normalizeToArray(parsed);
    } catch {
      return data
        .split(/,|\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((text) => ({ title: text }));
    }
  }
  return [];
};

// Deduplicate items based on title/name normalization
const deduplicateByTitle = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const rawTitle = item.title || item.name || '';
    const key = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

    const isSpeechTherapy = key.includes('speechtherapy');
    if (isSpeechTherapy) {
      if (seen.has('speechtherapy')) return false;
      seen.add('speechtherapy');
      return true;
    }

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Interactive Tag Input for Skills
const TagInput = ({ label, tags, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const tagList = Array.isArray(tags)
    ? tags
    : (tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

  const addTag = (tag) => {
    const cleanTag = tag.trim();
    if (cleanTag && !tagList.includes(cleanTag)) {
      onChange([...tagList, cleanTag]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove) => {
    onChange(tagList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</label>
      <div className="min-h-[70px] p-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus-within:bg-white focus-within:border-blue-500 transition-all flex flex-wrap items-center gap-1.5">
        {tagList.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="hover:bg-blue-200 text-blue-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder={tagList.length === 0 ? placeholder : 'Type and press Enter...'}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-800 outline-none py-1 px-1"
        />
      </div>
    </div>
  );
};

// Reusable Card Component matching LinkedIn Section UI
const ProfileSectionCard = ({ title, count, items, renderItem, onAdd }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <span className="text-gray-500 text-sm font-normal">({count})</span>
          )}
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Add entry"
        >
          <span className="text-lg font-bold leading-none">+</span>
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 py-3 italic">No details provided yet.</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-start">
              {renderItem(item, idx)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(initialProfileState);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const resumeUploadRef = useRef(null);

  // Consolidated mount loading logic to prevent race conditions
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        let token = localStorage.getItem('token') || localStorage.getItem('access_token');
        if (token && (token.startsWith('{') || token.startsWith('"'))) {
          try {
            const parsed = JSON.parse(token);
            token = typeof parsed === 'object' ? parsed.access_token || parsed.token : parsed;
          } catch {
            token = token.replace(/"/g, '');
          }
        }

        if (!token) {
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token.trim()}` };

        // 1. Fetch Auth User Info
        const userRes = await fetch(`${API_BASE_URL}/auth/me`, { headers });
        if (userRes.ok && isMounted) {
          const userData = await userRes.json();
          setUser(userData);
        }

        // 2. Fetch Profile from Backend
        const profileRes = await fetch(`${API_BASE_URL}/profile/`, { headers });
        if (profileRes.ok && isMounted) {
          const data = await profileRes.json();
          if (data) {
            const parseArray = (field) => {
              if (Array.isArray(field)) return field;
              if (typeof field === 'string' && field.trim().startsWith('[')) {
                try { return JSON.parse(field); } catch { return []; }
              }
              if (typeof field === 'string' && field.trim()) {
                return field.split(',').map((s) => s.trim()).filter(Boolean);
              }
              return [];
            };

            setProfile((prev) => ({
              ...prev,
              full_name:
  data.full_name ||
  `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
  prev.full_name,
              email: data.email || prev.email,
              phone: data.phone || data.phone_number || prev.phone,
              address: data.address || data.location || prev.address,
              linkedin: data.linkedin || data.linkedin_profile || prev.linkedin,
              github: data.github || data.github_profile || prev.github,
              summary: data.summary || data.bio || data.professional_summary || prev.summary,
              technical_skills: parseArray(data.technical_skills || data.skills),
              soft_skills: parseArray(data.soft_skills),
              education: parseArray(data.education),
              work_experience: parseArray(data.work_experience),
              projects: deduplicateByTitle(parseArray(data.projects)),
              internships: parseArray(data.internships),
              certifications: parseArray(data.certifications),
            }));
          }
        }
      } catch (err) {
        console.error('Error loading initial profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (customPayload = null) => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      let token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (token && (token.startsWith('{') || token.startsWith('"'))) {
        try {
          const parsed = JSON.parse(token);
          token = typeof parsed === 'object' ? parsed.access_token || parsed.token : parsed;
        } catch {
          token = token.replace(/"/g, '');
        }
      }

      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }

      const targetData = customPayload || profile;
      const { first_name, last_name, ...cleanProfilePayload } = targetData;

      const response = await fetch(`${API_BASE_URL}/profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(cleanProfilePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to save profile (Status ${response.status})`);
      }

      setMessage({ type: 'success', text: 'Profile changes saved successfully!' });
    } catch (err) {
      console.error('Save Profile Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error saving profile details.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeParseUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token && (token.startsWith('{') || token.startsWith('"'))) {
      try {
        const parsed = JSON.parse(token);
        token = typeof parsed === 'object' ? parsed.access_token || parsed.token : parsed;
      } catch {
        token = token.replace(/"/g, '');
      }
    }

    if (!token || token === 'undefined' || token === 'null') {
      setMessage({ type: 'error', text: 'Authentication token missing. Please log in again.' });
      return;
    }

    setParsing(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.trim()}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed (Status ${uploadRes.status})`);
      }

      const uploadData = await uploadRes.json();
      const parsed = uploadData.parsed_data || {};

      const rawProjects = parsed.projects || profile.projects || [];
      const deduplicatedProjects = deduplicateByTitle(normalizeToArray(rawProjects));

      const updatedProfile = {
        ...profile,
        full_name: parsed.full_name || profile.full_name,
        email: parsed.email || profile.email,
        phone: parsed.phone_number || parsed.phone || profile.phone,
        address: parsed.address || profile.address,
        linkedin: parsed.linkedin_profile || parsed.linkedin || profile.linkedin,
        github: parsed.github_profile || parsed.github || profile.github,
        summary: parsed.professional_summary || parsed.summary || profile.summary,
        technical_skills: parsed.technical_skills || parsed.skills || profile.technical_skills,
        soft_skills: parsed.soft_skills || profile.soft_skills,
        education: parsed.education || profile.education,
        work_experience: parsed.work_experience || profile.work_experience,
        projects: deduplicatedProjects,
        internships: parsed.internships || profile.internships,
        certifications: parsed.certifications || profile.certifications,
        languages: parsed.languages || profile.languages,
        achievements: parsed.achievements || profile.achievements,
      };

      setProfile(updatedProfile);
      await handleSaveProfile(updatedProfile);
      setMessage({ type: 'success', text: 'Resume parsed and profile saved successfully!' });
    } catch (err) {
      console.error('Resume Parse Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error parsing and saving resume data.' });
    } finally {
      setParsing(false);
      if (e.target) e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-xs font-semibold text-gray-500 animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  const displayName = profile.full_name || user?.name || user?.email?.split('@')[0] || 'User Profile';
  const displayEmail = profile.email || user?.email || 'user@example.com';

  const experienceItems = normalizeToArray(
    profile.internships?.length ? profile.internships : profile.work_experience
  );
  const educationItems = normalizeToArray(profile.education);
  const projectItems = deduplicateByTitle(normalizeToArray(profile.projects));
  const certItems = normalizeToArray(profile.certifications);

  return (
    <div className="min-h-screen bg-gray-100/60 pb-16">
      <div className="bg-white border-b border-gray-200 py-6 px-4 sm:px-8 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              <p className="text-xs text-gray-500">{displayEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={resumeUploadRef}
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleResumeParseUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={parsing}
              onClick={() => resumeUploadRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {parsing ? 'Parsing...' : '⚡ Upload & Parse Resume'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveProfile()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {message.text && (
          <div
            className={`mb-6 p-3 rounded-xl text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-2 shadow-sm space-y-1 sticky top-6">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                👤 Profile Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('resumes')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'resumes' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📄 My Resumes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('applications')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'applications' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                💼 My Applications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'profile' && (
              <>
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Basic Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="full_name"
                        value={profile.full_name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handleInputChange}
                        placeholder="+1 234 567 890"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Address / Location</label>
                      <input
                        type="text"
                        name="address"
                        value={profile.address}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">LinkedIn Profile</label>
                      <input
                        type="text"
                        name="linkedin"
                        value={profile.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">GitHub Profile</label>
                      <input
                        type="text"
                        name="github"
                        value={profile.github}
                        onChange={handleInputChange}
                        placeholder="https://github.com/username"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Professional Summary</label>
                    <textarea
                      rows="3"
                      name="summary"
                      value={profile.summary}
                      onChange={handleInputChange}
                      placeholder="Brief overview of your background and career goals..."
                      className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:border-blue-500 outline-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TagInput
                      label="Technical Skills"
                      tags={profile.technical_skills}
                      onChange={(newSkills) => setProfile((p) => ({ ...p, technical_skills: newSkills }))}
                      placeholder="React, Node.js, Python..."
                    />
                    <TagInput
                      label="Soft Skills"
                      tags={profile.soft_skills}
                      onChange={(newSkills) => setProfile((p) => ({ ...p, soft_skills: newSkills }))}
                      placeholder="Problem Solving, Communication..."
                    />
                  </div>
                </div>

                <ProfileSectionCard
                  title="Experience"
                  items={experienceItems}
                  renderItem={(exp) => (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-xl">
                        🏢
                      </div>
                      <div className="space-y-1 flex-1">
                        <h3 className="font-bold text-gray-900 text-base">{exp.title || exp.role || 'Position Title'}</h3>
                        <p className="text-sm text-gray-700 font-medium">{exp.company || 'Company Name'}</p>
                        {(exp.duration || exp.dates || exp.year) && (
                          <p className="text-xs text-gray-500">{exp.duration || exp.dates || exp.year}</p>
                        )}
                        {exp.description && <p className="text-sm text-gray-700 mt-2">{exp.description}</p>}
                      </div>
                    </>
                  )}
                />

                <ProfileSectionCard
                  title="Education"
                  items={educationItems}
                  renderItem={(edu) => (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-xl">
                        🎓
                      </div>
                      <div className="space-y-1 flex-1">
                        <h3 className="font-bold text-gray-900 text-base">{edu.institution || edu.school || 'College / University'}</h3>
                        <p className="text-sm text-gray-700">{edu.degree || edu.field_of_study}</p>
                        {edu.year && <p className="text-xs text-gray-500">{edu.year}</p>}
                      </div>
                    </>
                  )}
                />

                <ProfileSectionCard
                  title="Projects"
                  count={projectItems.length}
                  items={projectItems}
                  renderItem={(proj, idx) => (
                    <div className="flex items-start justify-between w-full gap-4">
                      <div className="flex gap-4 items-start flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-xl">
                          💻
                        </div>
                        <div className="space-y-1 flex-1">
                          <h3 className="font-bold text-gray-900 text-base">
                            {proj.title || proj.name || 'Project Name'}
                          </h3>
                          {proj.description && <p className="text-sm text-gray-700">{proj.description}</p>}
                          {proj.tech_stack && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              Tech Stack:{' '}
                              {Array.isArray(proj.tech_stack)
                                ? proj.tech_stack.join(', ')
                                : proj.tech_stack}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updatedProjects = projectItems.filter((_, i) => i !== idx);
                          setProfile((prev) => ({ ...prev, projects: updatedProjects }));
                        }}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove entry"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                />

                <ProfileSectionCard
                  title="Licenses & Certifications"
                  count={certItems.length}
                  items={certItems}
                  renderItem={(cert) => {
                    const certName = typeof cert === 'string' ? cert : cert.name || cert.title;
                    const issuer = cert.issuer || 'Issuing Organization';
                    return (
                      <>
                        <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xl shrink-0">
                          📜
                        </div>
                        <div className="space-y-1 flex-1">
                          <h3 className="font-bold text-gray-900 text-base">{certName}</h3>
                          <p className="text-sm text-gray-700">{issuer}</p>
                        </div>
                      </>
                    );
                  }}
                />
              </>
            )}

            {activeTab === 'resumes' && (
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 text-xs text-gray-500">
                <h2 className="text-sm font-bold text-gray-800 mb-2">My Resumes</h2>
                <p>Manage uploaded resume versions.</p>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 text-xs text-gray-500">
                <h2 className="text-sm font-bold text-gray-800 mb-2">My Applications</h2>
                <p>View internship application status track.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 text-xs text-gray-500">
                <h2 className="text-sm font-bold text-gray-800 mb-2">Settings</h2>
                <p>Manage security and account configuration.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}