import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, X, Loader2, Mail } from 'lucide-react';
import { API_CONFIG } from '../constants';

const EmailVerifyPage: React.FC = () => {
  const { id, hash } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      // Get all query params from URL
      const queryString = searchParams.toString();
      const url = `${API_CONFIG.BASE_URL}/email/verify/${id}/${hash}${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');

        // Redirect to home after 3 seconds if user is logged in
        const authUser = localStorage.getItem('auth_user');
        if (authUser) {
          // Update the user's verification status in localStorage
          try {
            const user = JSON.parse(authUser);
            user.email_verified_at = new Date().toISOString();
            localStorage.setItem('auth_user', JSON.stringify(user));
          } catch (e) {
            console.error('Failed to update user data', e);
          }

          setTimeout(() => {
            navigate('/home');
          }, 3000);
        }
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed. The link may be invalid or expired.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred while verifying your email.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`p-10 flex justify-center items-center ${
            status === 'success' ? 'bg-green-500' :
            status === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white`}>
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {status === 'verifying' && <Loader2 size={40} className="animate-spin" />}
                {status === 'success' && <CheckCircle size={40} />}
                {status === 'error' && <X size={40} />}
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {status === 'verifying' && 'Verifying Email...'}
                {status === 'success' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-10 text-center space-y-6">
            <p className="text-lg text-slate-600 leading-relaxed">
              {message}
            </p>

            {status === 'success' && (
              <>
                <div className="p-6 bg-green-50 border-2 border-green-200 rounded-2xl">
                  <p className="text-sm text-green-800 font-bold">
                    🎉 Your account is now fully activated! You can now access all features of StudyGroupFinder.
                  </p>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Redirecting you to the home page in 3 seconds...
                </p>
              </>
            )}

            {status === 'error' && (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl space-y-4">
                <p className="text-sm text-red-800 font-bold">
                  This verification link may have expired or is invalid.
                </p>
                <p className="text-xs text-red-600">
                  If you're logged in, you can request a new verification email from your account settings.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-6 space-y-3">
              {status === 'success' ? (
                <Link
                  to="/home"
                  className="w-full px-8 py-4 bg-green-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-green-600 shadow-lg shadow-green-100 transition-all inline-block"
                >
                  Go to Home
                </Link>
              ) : status === 'error' ? (
                <>
                  <Link
                    to="/login"
                    className="w-full px-8 py-4 bg-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all inline-block"
                  >
                    Go to Login
                  </Link>
                  <Link
                    to="/"
                    className="block text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                  >
                    Back to Home
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 font-bold">
            StudyGroupFinder - Connect, Collaborate, Succeed
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerifyPage;
