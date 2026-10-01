import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, ShieldCheck, Heart, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PatientProfile({ onOpenOtpModal }) {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: 'O+',
    address: '',
    emergency_contact: '',
    medical_history: '',
    allergies: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getPatientProfile();
      if (res.success && res.patient) {
        setProfile(res.patient);
        setFormData({
          full_name: res.patient.full_name || '',
          phone_number: res.patient.phone_number || '',
          date_of_birth: res.patient.date_of_birth || '',
          gender: res.patient.gender || 'Male',
          blood_group: res.patient.blood_group || 'O+',
          address: res.patient.address || '',
          emergency_contact: res.patient.emergency_contact || '',
          medical_history: res.patient.medical_history || '',
          allergies: res.patient.allergies || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      const res = await api.updatePatientProfile(formData);
      if (res.success) {
        setSuccessMsg('Medical profile updated successfully!');
        await refreshUser();
        loadProfile();
      }
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-500)' }}>Loading profile...</div>;
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--slate-900)' }}>
          Patient Medical Profile
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '4px' }}>
          Keep your clinical data, emergency contacts, and contact information up-to-date.
        </p>
      </div>

      {successMsg && (
        <div className="alert-box alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Phone verification banner */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', backgroundColor: user?.is_phone_verified ? '#ecfdf5' : '#fffbeb', borderColor: user?.is_phone_verified ? '#a7f3d0' : '#fde68a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user?.is_phone_verified ? (
            <ShieldCheck size={26} color="#059669" />
          ) : (
            <AlertCircle size={26} color="#d97706" />
          )}
          <div>
            <div style={{ fontWeight: '800', color: user?.is_phone_verified ? '#065f46' : '#92400e', fontSize: '0.95rem' }}>
              {user?.is_phone_verified ? 'Phone Number Verified' : 'Phone Number Not Verified'}
            </div>
            <div style={{ fontSize: '0.82rem', color: user?.is_phone_verified ? '#047857' : '#b45309' }}>
              Current: <strong>{user?.phone_number}</strong> • Used for automatic Twilio appointment reminders & updates.
            </div>
          </div>
        </div>

        {!user?.is_phone_verified && (
          <button onClick={onOpenOtpModal} className="btn btn-primary btn-sm">
            Verify via Twilio OTP
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '18px' }}>
            <User size={18} color="var(--primary-600)" />
            Personal & Contact Information
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="full_name"
                className="form-input"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (Twilio SMS recipient)</label>
              <input
                type="text"
                name="phone_number"
                className="form-input"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-3">
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

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                name="address"
                className="form-input"
                placeholder="Street address, City, State"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact Name & Phone</label>
              <input
                type="text"
                name="emergency_contact"
                className="form-input"
                placeholder="e.g. Jane Doe (+1 555-987-6544)"
                value={formData.emergency_contact}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '18px' }}>
            <Heart size={18} color="var(--primary-600)" />
            Clinical History & Allergies
          </h3>

          <div className="form-group">
            <label className="form-label">Past Medical History / Chronic Conditions</label>
            <textarea
              name="medical_history"
              className="form-textarea"
              placeholder="e.g. Hypertension, asthma, diabetes, previous surgeries..."
              value={formData.medical_history}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Known Allergies (Medications / Food / Environmental)</label>
            <textarea
              name="allergies"
              className="form-textarea"
              placeholder="e.g. Penicillin allergy, peanuts, dust mites..."
              value={formData.allergies}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
