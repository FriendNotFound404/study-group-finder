import React, { useState, useEffect } from 'react';
import { Mail, X, Loader2, CheckCircle } from 'lucide-react';
import { apiService } from '../services/apiService';

const EmailVerificationBanner: React.FC = () => {
  const [isVerified, setIsVerified] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const status = await apiService.checkVerificationStatus();
      setIsVerified(status.verified);
      setUserEmail(status.email);
    } catch (err) {
      console.error('Failed to check verification status', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');
    try {
      const response = await apiService.resendVerification();
      setMessage(response.message || 'Verification email sent!');
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to resend email');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsResending(false);
    }
  };

  // Don't show banner if verified, dismissed, or still loading
  if (isLoading || isVerified || !showBanner) return null;

  return (
    <div className="bg-amber-50 border-b-2 border-amber-200 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0">
              <Mail size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-amber-900 text-sm">Verify Your Email</h4>
                {message && (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                    <CheckCircle size={14} />
                    {message}
                  </span>
                )}
              </div>
              <p className="text-sm text-amber-700">
                We sent a verification email to <span className="font-bold">{userEmail}</span>.
                Please check your inbox and click the verification link to access all features.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isResending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Email'
              )}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-2 text-amber-400 hover:text-amber-600 transition-colors"
              title="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
