import React, { useState } from 'react';
import { Activity, Lock, Mail, User, Shield, Stethoscope, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitchToRegister }) {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role) => {
    setLoading(true);
    setError(null);
    try {
      await quickLogin(role);
    } catch (err) {
      setError(err.message || 'Failed to login with demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      background: 'radial-gradient(ellipse at top left, #ccfbf1 0%, #f0fdfa 40%, #f8fafc 80%)'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: 'var(--shadow-xl)',
        padding: '40px',
        position: 'relative'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(13, 148, 136, 0.35)',
            marginBottom: '16px'
          }}>
            <Activity size={32} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.85rem',
            fontWeight: '800',
            color: 'var(--slate-900)',
            letterSpacing: '-0.03em'
          }}>
            Medi<span style={{ color: 'var(--primary-600)' }}>Care</span> Portal
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '6px' }}>
            Hospital Management & Real-time Twilio Patient Alerts
          </p>
        </div>

        {/* 1-Click Instant Demo Login Box */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--primary-100)',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{
            fontSize: '0.74rem',
            fontWeight: '800',
            color: 'var(--primary-800)',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={14} color="var(--primary-600)" />
            Instant 1-Click Demo Accounts:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuick('patient')}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.8rem',
                padding: '8px 4px',
                fontWeight: '700',
                borderColor: 'var(--slate-200)',
                backgroundColor: '#ffffff'
              }}
            >
              🧑 Patient
            </button>
            <button
              type="button"
              onClick={() => handleQuick('doctor')}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.8rem',
                padding: '8px 4px',
                fontWeight: '700',
                borderColor: 'var(--slate-200)',
                backgroundColor: '#ffffff'
              }}
            >
              🩺 Doctor
            </button>
            <button
              type="button"
              onClick={() => handleQuick('admin')}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.8rem',
                padding: '8px 4px',
                fontWeight: '700',
                borderColor: 'var(--slate-200)',
                backgroundColor: '#ffffff'
              }}
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. patient@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--slate-500)' }}>
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-600)',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Register as a Patient
          </button>
        </div>
      </div>
    </div>
  );
}
