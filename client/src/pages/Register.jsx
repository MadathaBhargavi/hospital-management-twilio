import React, { useState } from 'react';
import { Activity, User, Mail, Lock, Phone, ArrowRight, AlertCircle, Calendar, Heart, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    date_of_birth: '1995-05-15',
    gender: 'Male',
    blood_group: 'O+',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const full_name = formData.full_name?.trim();
    const email = formData.email?.trim();
    const phone_number = formData.phone_number?.trim();
    const password = formData.password?.trim();

    if (!full_name || !email || !phone_number || !password) {
      setError('Please fill in all required fields (Full Name, Email, Phone Number, and Password).');
      setLoading(false);
      return;
    }

    try {
      await register({
        ...formData,
        full_name,
        email,
        phone_number,
        password,
        role: 'patient'
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
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
      padding: '28px',
      position: 'relative',
      background: 'radial-gradient(ellipse at top left, #ccfbf1 0%, #f0fdfa 40%, #f8fafc 80%)'
    }}>
      <div style={{
        maxWidth: '580px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: 'var(--shadow-xl)',
        padding: '40px',
        position: 'relative'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            marginBottom: '14px'
          }}>
            <Activity size={32} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: '800',
            color: 'var(--slate-900)',
            letterSpacing: '-0.03em'
          }}>
            New Patient Registration
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--slate-500)', marginTop: '4px' }}>
            Book appointments and receive automated Twilio SMS confirmations
          </p>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="full_name"
                className="form-input"
                placeholder="e.g. Sarah Jenkins"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="sarah@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Phone Number (For Twilio Alerts)</label>
              <input
                type="text"
                name="phone_number"
                className="form-input"
                placeholder="+15551234567"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-3" style={{ gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                className="form-input"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                className="form-select"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                name="blood_group"
                className="form-select"
                value={formData.blood_group}
                onChange={handleChange}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address (Optional)</label>
            <input
              type="text"
              name="address"
              className="form-input"
              placeholder="123 Health Ave, Springfield"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account & Initializing SMS...' : 'Register as Patient'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--slate-500)' }}>
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-600)',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
