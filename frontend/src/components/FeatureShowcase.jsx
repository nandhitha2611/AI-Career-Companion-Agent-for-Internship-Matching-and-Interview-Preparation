// src/components/FeatureShowcase.jsx
import React from 'react';

export default function FeatureShowcase() {
  return (
    <section className="w-full bg-white text-slate-900 py-20 px-6 lg:px-12 border-t border-slate-100">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* SECTION HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Smarter Searching
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Why Match Internships By Skills?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Traditional job portals waste hours scrolling through generic titles. Our AI agent extracts your actual tech stack to surface roles you are qualified for.
          </p>
        </div>

        {/* 3 BENEFIT CARDS (WHITE THEME) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-600 font-bold mb-4">
              🎯
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Precision Filtering</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Filter out roles requiring years of experience you don't have. See only student and entry-ready internship positions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-600 font-bold mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Save 10+ Hours Weekly</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Stop manually scanning job descriptions. The AI agent cross-references requirements against your resume automatically.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-600 font-bold mb-4">
              📈
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Higher Response Rates</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Applying to positions with high skill overlap increases interview callback odds significantly over blind cold applying.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}