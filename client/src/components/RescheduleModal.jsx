import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

export default function RescheduleModal({ appointment, onClose, onSuccess }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [newDate, setNewDate] = useState(appointment.appointment_date || todayStr);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotData, setSlotData] = useState({ slots: [], isWorkingDay: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (appointment && newDate) {
      loadSlots(newDate);
    }
  }, [appointment, newDate]);

  const loadSlots = async (date) => {
    setSlotsLoading(true);
    setError(null);
    setSelectedSlot('');
    try {
      const res = await api.getDoctorSlots(appointment.doctor_id, date);
      if (res.success) {
        setSlotData(res);
        if (res.availableSlots?.length > 0) {
          setSelectedSlot(res.availableSlots[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.updateAppointmentStatus(appointment.id, {
        status: 'rescheduled',
        new_date: newDate,
        new_time: selectedSlot
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.appointment);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to reschedule appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="card-title">
            <RefreshCw size={20} color="var(--primary-600)" />
            Reschedule Appointment
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          backgroundColor: 'var(--slate-50)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          border: '1px solid var(--slate-200)',
          marginBottom: '16px',
          fontSize: '0.85rem'
        }}>
          <div><strong>Appointment:</strong> #{appointment.appointment_number}</div>
          <div><strong>Doctor:</strong> {appointment.doctor_name} ({appointment.department_name})</div>
          <div><strong>Current Schedule:</strong> {appointment.appointment_date} at {appointment.appointment_time}</div>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReschedule}>
          <div className="form-group">
            <label className="form-label">Select New Date</label>
            <input
              type="date"
              className="form-input"
              min={todayStr}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select New Time Slot</label>
            {slotsLoading ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', padding: '12px' }}>Loading slots...</div>
            ) : !slotData.isWorkingDay ? (
              <div className="alert-box alert-warning">Doctor not available on this day.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                {slotData.slots?.map((s) => (
                  <button
                    type="button"
                    key={s.time}
                    disabled={!s.isAvailable}
                    onClick={() => setSelectedSlot(s.time)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      border: selectedSlot === s.time ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                      backgroundColor: selectedSlot === s.time ? 'var(--primary-50)' : s.isAvailable ? '#ffffff' : '#f1f5f9',
                      color: selectedSlot === s.time ? 'var(--primary-800)' : s.isAvailable ? 'var(--slate-800)' : '#94a3b8',
                      cursor: s.isAvailable ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="alert-box alert-info" style={{ fontSize: '0.8rem' }}>
            <MessageSquare size={16} />
            <span>An automated Twilio SMS with the rescheduled appointment details will be dispatched upon confirmation.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !selectedSlot}>
              {submitting ? 'Rescheduling...' : 'Confirm New Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
