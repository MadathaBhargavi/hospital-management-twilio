import React, { useState, useEffect } from 'react';
import { Search, Filter, Stethoscope, Sparkles, AlertCircle, Activity, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import DoctorCard from '../components/DoctorCard';
import BookAppointmentModal from '../components/BookAppointmentModal';

export default function DoctorsCatalog({ onBookingSuccess }) {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadDoctors();
  }, [selectedDept, selectedDay]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.getDoctors({
        department_id: selectedDept || undefined,
        day: selectedDay || undefined
      });
      if (res.success) {
        setDoctors(res.doctors || []);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter by local search term
  const filteredDoctors = doctors.filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.full_name?.toLowerCase().includes(term) ||
      doc.specialization?.toLowerCase().includes(term) ||
      doc.department_name?.toLowerCase().includes(term) ||
      doc.qualification?.toLowerCase().includes(term)
    );
  });

  const departmentPills = [
    { id: '', name: 'All Specialties' },
    { id: 'dept-cardio', name: 'Cardiology' },
    { id: 'dept-neuro', name: 'Neurology' },
    { id: 'dept-ortho', name: 'Orthopedics' },
    { id: 'dept-pedia', name: 'Pediatrics' },
    { id: 'dept-derma', name: 'Dermatology' },
    { id: 'dept-genmed', name: 'General Medicine' }
  ];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Physician Directory
          </span>
          <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>
            {filteredDoctors.length} Doctors Available
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.95rem',
          fontWeight: '800',
          color: 'var(--slate-900)',
          letterSpacing: '-0.03em'
        }}>
          Find Medical Specialists & Book Consultation
        </h1>
        <p style={{ color: 'var(--slate-600)', fontSize: '0.94rem', marginTop: '4px' }}>
          Browse accredited doctors, review credentials and consultation fees, and schedule an appointment with SMS alerts.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '28px', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '42px' }}
              placeholder="Search doctor, medical specialty, or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Day Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              <option value="">Any Available Day</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Department Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--slate-100)'
        }}>
          {departmentPills.map((dept) => {
            const isSelected = selectedDept === dept.id;
            return (
              <button
                key={dept.id || 'all'}
                onClick={() => setSelectedDept(dept.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.84rem',
                  fontWeight: isSelected ? '700' : '600',
                  border: isSelected ? '1px solid var(--primary-600)' : '1px solid var(--slate-200)',
                  background: isSelected ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--slate-700)',
                  boxShadow: isSelected ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {dept.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Doctor Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Activity size={36} color="var(--primary-600)" style={{ animation: 'pulseDot 1.5s infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--slate-600)', fontWeight: '600' }}>Loading available physicians...</div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="card" style={{ padding: '50px 24px', textAlign: 'center', color: 'var(--slate-400)', borderRadius: 'var(--radius-xl)' }}>
          <Stethoscope size={44} style={{ margin: '0 auto 14px', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--slate-800)', fontSize: '1.2rem', fontWeight: '800' }}>No doctors matched your criteria</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Try resetting department or day filters.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onBook={(d) => setSelectedDoctorForBooking(d)}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctorForBooking && (
        <BookAppointmentModal
          doctor={selectedDoctorForBooking}
          onClose={() => setSelectedDoctorForBooking(null)}
          onBookingSuccess={(apt) => {
            if (onBookingSuccess) onBookingSuccess(apt);
          }}
        />
      )}
    </div>
  );
}
