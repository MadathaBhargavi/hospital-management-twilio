import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MessageSquare, CheckCircle2, AlertCircle, Sparkles, User, MapPin, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BookAppointmentModal({ doctor, onClose, onBookingSuccess }) {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotData, setSlotData] = useState({ slots: [], isWorkingDay: true, message: '' });
  const [reason, setReason] = useState('Routine Health Checkup & Consultation');
  const [symptoms, setSymptoms] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (doctor && date) {
      loadDoctorSlots(date);
    }
  }, [doctor, date]);

  const loadDoctorSlots = async (targetDate) => {
    setSlotsLoading(true);
    setError(null);
    setSelectedSlot('');
    try {
      const res = await api.getDoctorSlots(doctor.id, targetDate);
      if (res.success) {
        setSlotData(res);
        if (res.availableSlots && res.availableSlots.length > 0) {
          setSelectedSlot(res.availableSlots[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching doctor slots:', err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available consultation time slot.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        doctor_id: doctor.id,
        appointment_date: date,
        appointment_time: selectedSlot,
        reason,
        symptoms
      };

      const res = await api.createAppointment(payload);
      if (res.success) {
        setBookingResult(res);
        if (onBookingSuccess) {
          onBookingSuccess(res.appointment);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ fontSize: '1.25rem' }}>
              <Calendar size={22} color="var(--primary-600)" />
              Book Medical Consultation
            </h3>
            <div style={{ fontSize: '0.84rem', color: 'var(--slate-500)', marginTop: '2px' }}>
              Confirm your appointment & receive real-time Twilio SMS confirmation
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {bookingResult ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              border: '2px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#059669',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: '800',
              color: 'var(--slate-900)'
            }}>
              Appointment Confirmed!
            </h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.92rem', marginTop: '6px' }}>
              Booking <strong>#{bookingResult.appointment?.appointment_number}</strong> with{' '}
              <strong>{doctor.full_name}</strong> is confirmed.
            </p>

            {/* Twilio SMS Status Notice */}
            <div className="alert-box alert-success" style={{ textAlign: 'left', marginTop: '20px' }}>
              <MessageSquare size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Twilio SMS Status: {bookingResult.smsStatus === 'sent' ? 'Sent Live' : 'Simulated (Dev Mode)'}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>
                  Confirmation notification dispatched to <strong>{user?.phone_number}</strong>.
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--slate-200)',
              padding: '18px',
              textAlign: 'left',
              fontSize: '0.88rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '16px'
            }}>
              <div><strong>Schedule:</strong> {bookingResult.appointment?.appointment_date} at {bookingResult.appointment?.appointment_time}</div>
              <div><strong>Location:</strong> {doctor.room_number || 'Room 101 - Main OPD Wing'}</div>
              <div><strong>Department:</strong> {doctor.department_name}</div>
              <div><strong>Consultation Fee:</strong> ${doctor.consultation_fee}</div>
            </div>

            <button
              onClick={onClose}
              className="btn btn-primary btn-lg"
              style={{ marginTop: '24px', width: '100%' }}
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Doctor Summary Header Card */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
              border: '1px solid var(--primary-100)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.15rem'
                }}>
                  {doctor.full_name?.replace('Dr. ', '').charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--slate-900)' }}>
                    {doctor.full_name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: '700' }}>
                    {doctor.specialization} • {doctor.department_name}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Fee</span>
                <span style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--slate-900)' }}>
                  ${doctor.consultation_fee}
                </span>
              </div>
            </div>

            {error && (
              <div className="alert-box alert-danger">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Date Selection */}
            <div className="form-group">
              <label className="form-label">
                <Calendar size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                Consultation Date
              </label>
              <input
                type="date"
                className="form-input"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Time Slot Picker */}
            <div className="form-group">
              <label className="form-label">
                <Clock size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                Available Time Slots ({date})
              </label>

              {slotsLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.88rem' }}>
                  Loading available time slots...
                </div>
              ) : !slotData.isWorkingDay ? (
                <div className="alert-box alert-warning" style={{ fontSize: '0.85rem' }}>
                  {slotData.message || 'Doctor is not available on this day of the week.'}
                </div>
              ) : slotData.slots?.length === 0 ? (
                <div className="alert-box alert-warning" style={{ fontSize: '0.85rem' }}>
                  No consultation slots configured for this doctor.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                  {slotData.slots.map((s) => {
                    const isSelected = selectedSlot === s.time;
                    return (
                      <button
                        type="button"
                        key={s.time}
                        disabled={!s.isAvailable}
                        onClick={() => setSelectedSlot(s.time)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          border: isSelected
                            ? '2px solid var(--primary-600)'
                            : '1.5px solid var(--slate-200)',
                          background: isSelected
                            ? 'var(--primary-50)'
                            : !s.isAvailable
                            ? '#f1f5f9'
                            : '#ffffff',
                          color: isSelected
                            ? 'var(--primary-800)'
                            : !s.isAvailable
                            ? '#94a3b8'
                            : 'var(--slate-800)',
                          cursor: s.isAvailable ? 'pointer' : 'not-allowed',
                          textDecoration: !s.isAvailable ? 'line-through' : 'none',
                          boxShadow: isSelected ? '0 2px 8px rgba(13, 148, 136, 0.2)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {s.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reason & Symptoms */}
            <div className="form-group">
              <label className="form-label">Reason for Consultation</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Chest pain evaluation, routine checkup..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Symptoms / Notes (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Describe any symptoms or specific concerns for the doctor..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
              />
            </div>

            {/* Twilio SMS Notification Preview */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '22px',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: 'var(--slate-800)', marginBottom: '4px' }}>
                <MessageSquare size={14} color="var(--primary-600)" />
                Twilio SMS Notification Preview
              </div>
              <div style={{ color: 'var(--slate-600)', fontStyle: 'italic', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--slate-200)' }}>
                "Hello {user?.full_name || 'Patient'}, your appointment with {doctor.full_name} ({doctor.department_name}) is confirmed for {date} at {selectedSlot || '...'}. Thank you for choosing MediCare."
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginTop: '4px' }}>
                Recipient: {user?.phone_number || '+1 555-xxx-xxxx'}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !selectedSlot || !slotData.isWorkingDay}
              >
                {submitting ? 'Booking & Sending SMS...' : 'Confirm & Book Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
