import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loginUser, registerUser } from '../api';

export default function AuthForm({ initialMode = 'login', onLogin }) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/profile/', {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });
      // Reads first_name directly from your Swagger response schema
      return response.data?.first_name || response.data?.full_name || '';
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await registerUser(formData);
      }

      // 1. Authenticate user and obtain access token
      const response = await loginUser(formData.email, formData.password);
      const token = response.data?.access_token || response.data?.token;

      if (token) {
        localStorage.setItem('token', token);

        // 2. Fetch profile using the /profile/ endpoint
        const fetchedName = await fetchUserProfile(token);

        // 3. Set display name priority: fetched name -> state name -> email prefix
        const displayName =
          fetchedName.trim() ||
          formData.full_name.trim() ||
          formData.email.split('@')[0];

        onLogin({ token, name: displayName });
      } else {
        setError('No access token returned from backend.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail?.[0]?.msg ||
        err.response?.data?.detail ||
        'Authentication failed. Check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center p-4 md:p-8">
      {/* Outer Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[520px]">
        
        {/* Left Hero Panel */}
        <div className="relative md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-8 md:p-12 text-white flex flex-col justify-between overflow-hidden">
          {/* Decorative Background Circles */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-400/30 rounded-full blur-sm pointer-events-none" />
          <div className="absolute -bottom-16 -right-12 w-64 h-64 bg-blue-500/40 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 right-4 w-32 h-32 bg-blue-300/20 rounded-full pointer-events-none" />

          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest font-semibold text-blue-200">
              AI Internship Agent
            </span>
          </div>

          <div className="relative z-10 my-auto py-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              {isSignUp ? 'Join Us Today!' : 'WELCOME'}
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
              {isSignUp
                ? 'Create an account to start matching your resume with top internship opportunities effortlessly.'
                : 'Accelerate your career journey with automated application agent tools.'}
            </p>
          </div>

          <div className="relative z-10 text-xs text-blue-200/80">
            © {new Date().getFullYear()} AI Application Agent
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {isSignUp ? 'Create Account' : 'Sign in'}
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              {isSignUp ? 'Use your details to register below' : 'Enter your credentials to access your dashboard'}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl mb-4">
                {typeof error === 'string' ? error : 'Authentication error.'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      placeholder="Full Name"
                      className="w-full bg-gray-100/80 border border-transparent focus:border-blue-500 focus:bg-white text-gray-800 text-sm rounded-xl py-3 pl-10 pr-4 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="User Name or Email"
                    className="w-full bg-gray-100/80 border border-transparent focus:border-blue-500 focus:bg-white text-gray-800 text-sm rounded-xl py-3 pl-10 pr-4 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Password"
                    className="w-full bg-gray-100/80 border border-transparent focus:border-blue-500 focus:bg-white text-gray-800 text-sm rounded-xl py-3 pl-10 pr-16 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setIsSignUp(!isSignUp);
                }}
                className="text-blue-600 font-semibold hover:underline ml-1"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}