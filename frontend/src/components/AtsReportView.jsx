// src/components/AtsReportView.jsx
import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Award, 
  Wrench, 
  FileText 
} from 'lucide-react';

export default function AtsReportView({ data }) {
  if (!data) return null;

  const {
    overall_ats_score,
    ats_readability_label,
    detected_skills_count,
    categories,
    strengths,
    improvements
  } = data;

  // Determine badge color based on overall score
  const getScoreBadge = (score) => {
    if (score >= 80) return { bg: 'bg-green-100 text-green-800 border-green-300', ring: 'stroke-green-500' };
    if (score >= 60) return { bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', ring: 'stroke-yellow-500' };
    return { bg: 'bg-red-100 text-red-800 border-red-300', ring: 'stroke-red-500' };
  };

  const badgeStyle = getScoreBadge(overall_ats_score);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Top Banner & Circular Score */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyle.bg}`}>
            {ats_readability_label}
          </span>
          <h2 className="text-2xl font-bold text-slate-800">ATS Resume Health Score</h2>
          <p className="text-slate-500 text-sm">
            Detected <span className="font-semibold text-slate-700">{detected_skills_count} skills</span> across your profile.
          </p>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100 stroke-current"
              strokeWidth="3.5"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${badgeStyle.ring} stroke-current transition-all duration-1000 ease-out`}
              strokeDasharray={`${overall_ats_score}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-extrabold text-slate-800">{overall_ats_score}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Detailed Category Breakdown
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          {categories.map((cat, idx) => {
            const percentage = Math.round((cat.score / cat.max) * 100);
            return (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-700">{cat.name}</span>
                  <span className="font-bold text-slate-800">
                    {cat.score} <span className="text-slate-400 font-normal">/ {cat.max}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  {cat.feedback}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Actionable Improvements */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Strengths Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Key Strengths
          </h3>
          {strengths.length > 0 ? (
            <ul className="space-y-3">
              {strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">No primary strengths detected yet. Address the improvements below to boost your score.</p>
          )}
        </div>

        {/* Actionable Improvements Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Top Recommendations
          </h3>
          <ul className="space-y-3">
            {improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
}