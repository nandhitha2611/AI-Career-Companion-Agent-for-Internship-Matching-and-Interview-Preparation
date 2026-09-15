import React, { useState, useMemo } from 'react';
import rawData from "../../../data/internships.json";
import InternshipDetail from './InternshipDetail';

export default function Internships({ data }) {
  // Selected internship state for showing detailed view
  const [selectedInternship, setSelectedInternship] = useState(null);

  const dataset = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData?.default && Array.isArray(rawData.default)) return rawData.default;
    return [];
  }, [data]);

  // Filter States
  const [profileSearch, setProfileSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [workFromHome, setWorkFromHome] = useState(false);
  const [partTime, setPartTime] = useState(false);
  const [minStipend, setMinStipend] = useState(0);

  // Filter Logic
  const filteredInternships = useMemo(() => {
    return dataset.filter((item) => {
      if (!item) return false;

      const title = (item.role_title || item.title || item.profile || '').toString();
      const location = (item.location || '').toString();
      const mode = (item.mode || '').toString();
      const stipend = item.stipend_inr_per_month ?? item.stipend ?? 0;

      // Profile/Title matching
      const titleMatch = title.toLowerCase().includes(profileSearch.toLowerCase().trim());

      // Location matching
      const locMatch = location.toLowerCase().includes(locationSearch.toLowerCase().trim());

      // WFH check
      const wfhMatch = workFromHome
        ? location.toLowerCase().includes('remote') ||
          location.toLowerCase().includes('work from home') ||
          mode.toLowerCase().includes('remote') ||
          item.is_wfh === true
        : true;

      // Part-time check
      const partTimeMatch = partTime
        ? mode.toLowerCase().includes('part') || item.is_part_time === true
        : true;

      // Stipend matching
      const numericStipend = typeof stipend === 'number' ? stipend : parseInt(stipend, 10) || 0;
      const stipendMatch = numericStipend >= minStipend;

      return titleMatch && locMatch && wfhMatch && partTimeMatch && stipendMatch;
    });
  }, [dataset, profileSearch, locationSearch, workFromHome, partTime, minStipend]);

  const handleClearFilters = () => {
    setProfileSearch('');
    setLocationSearch('');
    setWorkFromHome(false);
    setPartTime(false);
    setMinStipend(0);
  };

  // Switch to detailed view if an internship is clicked (same logic as MatchInternships)
  if (selectedInternship) {
    return (
      <InternshipDetail
        internship={selectedInternship}
        onBack={() => setSelectedInternship(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar - Filters */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
            
            <div className="flex items-center gap-2 text-blue-600 font-medium text-xs bg-blue-50/80 p-3 rounded-xl mb-6 cursor-pointer hover:bg-blue-100/80 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Save this search as alert</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold mb-5 text-sm">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters</span>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Profile / Role</label>
              <input
                type="text"
                placeholder="e.g. Cybersecurity, Developer"
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-800 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
              <input
                type="text"
                placeholder="e.g. Pune, Remote"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-800 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2.5 mb-6">
              <label className="flex items-center gap-2.5 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={workFromHome}
                  onChange={(e) => setWorkFromHome(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                />
                <span>Include work from home / Remote</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={partTime}
                  onChange={(e) => setPartTime(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                />
                <span>Part-time</span>
              </label>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-600 mb-2 font-medium">
                <span>Desired minimum stipend (₹)</span>
              </div>
              <input
                type="range"
                min="0"
                max="20000"
                step="2000"
                value={minStipend}
                onChange={(e) => setMinStipend(Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                <span>0</span>
                <span>4K</span>
                <span>8K</span>
                <span>12K</span>
                <span>16K</span>
                <span>20K</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Clear all
              </button>
            </div>

          </div>
        </div>

        {/* Right Main Column - Internship List */}
        <div className="flex-1 space-y-4">
          <div className="text-xs font-medium text-gray-500 mb-2">
            Showing {filteredInternships.length} internship{filteredInternships.length !== 1 ? 's' : ''}
          </div>

          {filteredInternships.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">No internships found matching your criteria.</p>
            </div>
          ) : (
            filteredInternships.map((item, idx) => {
              const skills = Array.isArray(item.required_skills)
                ? item.required_skills
                : Array.isArray(item.skills)
                ? item.skills
                : [];

              const stipendVal = item.stipend_inr_per_month ?? item.stipend;
              const duration = item.duration_weeks ? `${item.duration_weeks} Weeks` : item.duration || 'N/A';

              return (
                <div
                  key={item.id || idx}
                  onClick={() => setSelectedInternship(item)}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative hover:border-blue-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-800 hover:text-blue-600 transition-colors">
                        {item.role_title || item.title || 'Internship Title'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-gray-500">
                          {item.company || 'Company Name'}
                        </span>
                        {item.domain && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                            {item.domain}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Actively hiring
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {item.mode && (
                        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-xl">
                          {item.mode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{item.location || 'Remote'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{stipendVal ? `₹ ${stipendVal} /month` : 'Unpaid'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{duration}</span>
                    </div>
                  </div>

                  {item.description && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 mb-4 line-clamp-2 bg-gray-50/50 p-2.5 rounded-xl border border-gray-50">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{item.description}</span>
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 bg-gray-100/70 hover:bg-gray-100 text-gray-600 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}