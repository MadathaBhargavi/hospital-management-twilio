import React, { useState, useEffect } from 'react';
import { Stethoscope, DollarSign, Calendar, Clock, MapPin, Award, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DoctorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    specialization: '',
    qualification: '',
    experience_years: 5,
    consultation_fee: 100,
    room_number: '',
    bio: '',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    available_time_slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
  });

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const standardSlots = [
    '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  useEffect(() => {
    loadDoctor();
  }, []);

  const loadDoctor = async () => {
    setLoading(true);
    try {
      const res = await api.getDoctorById(user.id);
      if (res.success && res.doctor) {
        setProfile(res.doctor);
        setFormData({
          specialization: res.doctor.specialization || '',
          qualification: res.doctor.qualification || '',
          experience_years: res.doctor.experience_years || 5,
          consultation_fee: res.doctor.consultation_fee || 100,
          room_number: res.doctor.room_number || '',
          bio: res.doctor.bio || '',
          available_days: Array.isArray(res.doctor.available_days) ? res.doctor.available_days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          available_time_slots: Array.isArray(res.doctor.available_time_slots) ? res.doctor.available_time_slots : ['09:00 AM', '10:00 AM', '11:00 AM']
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    const days = [...formData.available_days];
    if (days.includes(day)) {
      setFormData({ ...formData, available_days: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, available_days: [...days, day] });
    }
  };

  const toggleSlot = (slot) => {
    const slots = [...formData.available_time_slots];
    if (slots.includes(slot)) {
      setFormData({ ...formData, available_time_slots: slots.filter(s => s !== slot) });
    } else {
      setFormData({ ...formData, available_time_slots: [...slots, slot] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await api.updateDoctorProfile(formData);
      if (res.success) {
        setSuccessMsg('Doctor practice profile updated successfully!');
        loadDoctor();
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
          Physician Practice & Schedule Settings
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '4px' }}>
          Configure consultation fees, available appointment time slots, and clinical bio.
        </p>
      </div>

      {successMsg && (
        <div className="alert-box alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '18px' }}>
            <Award size={18} color="var(--primary-600)" />
            Clinical Qualifications & Fees
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input
                type="text"
                className="form-input"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Qualifications</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. MD, FACC, FAAP"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input
                type="number"
                className="form-input"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Consultation Fee ($ USD)</label>
              <input
                type="number"
                className="form-input"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Room / Clinic Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="Room 301 - Tower A"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Doctor Biography</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>
        </div>

        {/* Schedule & Days */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '18px' }}>
            <Calendar size={18} color="var(--primary-600)" />
            Available Working Days
          </h3>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {allDays.map((day) => {
              const active = formData.available_days.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    border: active ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                    backgroundColor: active ? 'var(--primary-50)' : '#ffffff',
                    color: active ? 'var(--primary-800)' : 'var(--slate-600)',
                    cursor: 'pointer'
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <h3 className="card-title" style={{ marginBottom: '14px', fontSize: '1rem' }}>
            <Clock size={16} color="var(--primary-600)" />
            Consultation Time Slots
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
            {standardSlots.map((slot) => {
              const active = formData.available_time_slots.includes(slot);
              return (
                <button
                  type="button"
                  key={slot}
                  onClick={() => toggleSlot(slot)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    border: active ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                    backgroundColor: active ? 'var(--primary-600)' : '#ffffff',
                    color: active ? '#ffffff' : 'var(--slate-700)',
                    cursor: 'pointer'
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Update Practice Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
