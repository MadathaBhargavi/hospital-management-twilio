import React, { useState } from 'react';
import { X, ShieldCheck, KeyRound, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtpModal({ phone, onClose, onSuccess }) {
  const { user, refreshUser } = useAuth();
  const [targetPhone, setTargetPhone] = useState(phone || user?.phone_number || '');
  const [step, setStep] = useState('send'); // 'send' or 'verify'
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devCode, setDevCode] = useState(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!targetPhone) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.sendOtp(targetPhone);
      if (res.success) {
        setStep('verify');
        if (res.otpCode) {
          setDevCode(res.otpCode);
        }
      } else {
        setError(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyOtp({
        phone_number: targetPhone,
        code: otpCode
      });

      if (res.success) {
        setVerifiedSuccess(true);
        await refreshUser();
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Invalid verification code.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3 className="card-title">
            <ShieldCheck size={20} color="var(--primary-600)" />
            Twilio Phone Verification
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {verifiedSuccess ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              border: '2px solid #a7f3d0',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ fontWeight: '800', color: 'var(--slate-900)' }}>Phone Verified!</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '4px' }}>
              Your phone number <strong>{targetPhone}</strong> is now verified for all Twilio appointment alerts.
            </p>
            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '16px', width: '100%' }}>
              Continue
            </button>
          </div>
        ) : step === 'send' ? (
          <form onSubmit={handleSendOtp}>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '16px' }}>
              We will send a 6-digit secure verification code to your phone number via Twilio SMS / Verify.
            </p>

            {error && (
              <div className="alert-box alert-danger">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Phone Number (E.164 Format)</label>
              <input
                type="text"
                className="form-input"
                placeholder="+15551234567 or +919876543210"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !targetPhone}>
                {loading ? 'Sending Code...' : 'Send Verification OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '16px' }}>
              Enter the 6-digit verification code sent to <strong>{targetPhone}</strong>.
            </p>

            {devCode && (
              <div className="alert-box alert-warning" style={{ fontSize: '0.82rem' }}>
                <KeyRound size={16} />
                <div>
                  <strong>Dev Mode Code: </strong>
                  <span style={{ fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px', fontSize: '1rem' }}>
                    {devCode}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert-box alert-danger">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">6-Digit Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="123456"
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.25rem', fontWeight: '700' }}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setStep('send'); setDevCode(null); }}
              >
                Resend Code
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || otpCode.length < 4}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
