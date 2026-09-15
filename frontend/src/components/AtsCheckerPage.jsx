// src/pages/AtsCheckerPage.jsx
import React, { useState, useEffect } from 'react';
import AtsReportView from '../components/AtsReportView';
import { Upload, FileText, RefreshCw } from 'lucide-react';

export default function AtsCheckerPage() {
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [error, setError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Fetch user's saved resumes on component load
  useEffect(() => {
    fetchSavedResumes();
  }, []);

  const fetchSavedResumes = async () => {
    setFetchingList(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/resume/', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedResumes(data);
        if (data.length > 0) {
          setSelectedResumeId(data[0].id || data[0].resume_id);
        }
      }
    } catch (err) {
      console.error("Failed to load saved resumes", err);
    } finally {
      setFetchingList(false);
    }
  };

  // 2. Handle analyzing an existing saved resume
  const handleAnalyzeSaved = async () => {
    if (!selectedResumeId) {
      setError('Please select a saved resume');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ resume_id: selectedResumeId }),
      });

      if (!response.ok) throw new Error(`Error ${response.status}: Failed to analyze resume`);
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle uploading a new PDF/DOCX resume file
  const handleFileUploadAndAnalyze = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      // Step A: Upload file to the existing resume endpoint
      const uploadRes = await fetch('http://127.0.0.1:8000/resume/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file.');
      const uploadData = await uploadRes.json();
      const newResumeId = uploadData.id || uploadData.resume_id;

      // Step B: Trigger ATS analysis with newly returned resume ID
      const atsRes = await fetch('http://127.0.0.1:8000/api/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ resume_id: newResumeId }),
      });

      if (!atsRes.ok) throw new Error('Failed to run ATS analysis on uploaded file.');
      
      const reportData = await atsRes.json();
      setReport(reportData);
      
      // Refresh list so newly uploaded file appears in dropdown
      fetchSavedResumes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Selector & Upload Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ATS Resume Checker</h1>
          <p className="text-sm text-slate-500 mt-1">Select an existing resume or upload a new file to analyze ATS optimization.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Option A: Pick Saved Resume */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Saved Resume
              </label>
              {fetchingList ? (
                <div className="text-sm text-slate-400 py-2">Loading resumes...</div>
              ) : savedResumes.length > 0 ? (
                <select
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                >
                  {savedResumes.map((res) => (
                    <option key={res.id || res.resume_id} value={res.id || res.resume_id}>
                      {res.original_filename}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-400 py-2">No saved resumes found.</p>
              )}
            </div>

            <button
              onClick={handleAnalyzeSaved}
              disabled={loading || !selectedResumeId}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {loading ? 'Analyzing...' : 'Check Saved Resume'}
            </button>
          </div>

          {/* Option B: Upload New File */}
          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3 relative hover:bg-slate-50 transition">
            <Upload className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {file ? file.name : 'Upload New Resume'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">PDF or DOCX (Max 5MB)</p>
            </div>
            
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUploadAndAnalyze}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
      </div>

      {/* Render ATS Report */}
      {report && <AtsReportView data={report} />}
    </div>
  );
}