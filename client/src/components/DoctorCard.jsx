import React from 'react';
import { Star, MapPin, Calendar, Clock, DollarSign, Award, ArrowRight, ShieldCheck } from 'lucide-react';

export default function DoctorCard({ doctor, onBook }) {
  const rating = Number(doctor.rating) || 4.9;

  return (
    <div
      className="card card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(226, 232, 240, 0.9)'
      }}
    >
      <div>
        {/* Top Doctor Avatar & Header */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontFamily: 'var(--font-display)',
            fontWeight: '800',
            flexShrink: 0,
            boxShadow: '0 6px 16px rgba(13, 148, 136, 0.3)',
            border: '2px solid #ffffff'
          }}>
            {doctor.full_name?.replace('Dr. ', '').charAt(0) || 'D'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '800',
                color: 'var(--slate-900)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {doctor.full_name}
              </h3>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: '#fffbeb',
                color: '#b45309',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: '800',
                border: '1px solid #fde68a'
              }}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <span>{rating.toFixed(1)}</span>
              </div>
            </div>

            <div style={{
              fontSize: '0.86rem',
              fontWeight: '700',
              color: 'var(--primary-700)',
              marginTop: '2px'
            }}>
              {doctor.specialization}
            </div>

            <div style={{ marginTop: '6px' }}>
              <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                {doctor.department_name}
              </span>
            </div>
          </div>
        </div>

        {/* Qualification & Experience */}
        <div style={{
          fontSize: '0.82rem',
          color: 'var(--slate-600)',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--slate-50)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)'
        }}>
          <Award size={15} color="var(--primary-600)" />
          <span style={{ fontWeight: '600' }}>{doctor.qualification}</span>
          <span style={{ color: 'var(--slate-300)' }}>|</span>
          <span>{doctor.experience_years} yrs exp</span>
        </div>

        {doctor.bio && (
          <p style={{
            fontSize: '0.84rem',
            color: 'var(--slate-600)',
            lineHeight: 1.5,
            marginBottom: '16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {doctor.bio}
          </p>
        )}

        {/* Schedule & Room */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--slate-100)',
          padding: '12px',
          fontSize: '0.8rem',
          color: 'var(--slate-700)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={14} color="var(--primary-600)" />
            <span>
              <strong>Available: </strong>
              {Array.isArray(doctor.available_days) ? doctor.available_days.join(', ') : 'Mon - Fri'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={14} color="var(--primary-600)" />
            <span>{doctor.room_number || 'OPD Room 101 - Main Clinic'}</span>
          </div>
        </div>
      </div>

      {/* Footer / Consultation Fee & CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid var(--slate-100)'
      }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)', fontWeight: '600', textTransform: 'uppercase', display: 'block' }}>
            Consultation Fee
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            fontWeight: '800',
            color: 'var(--slate-900)'
          }}>
            ${doctor.consultation_fee || 120}
          </span>
        </div>

        <button
          onClick={() => onBook(doctor)}
          className="btn btn-primary"
          style={{ padding: '8px 18px', fontSize: '0.88rem' }}
        >
          Book Visit
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
