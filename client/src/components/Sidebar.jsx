import React from 'react';
import {
  LayoutDashboard, Users, Calendar, Stethoscope, User,
  MessageSquare, Settings, Activity, ShieldCheck, HeartPulse,
  Clock, Award, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }) {
  const { user, isPatient, isDoctor, isAdmin } = useAuth();

  const patientNav = [
    { id: 'patient-dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'doctors', label: 'Find Doctors & Book', icon: Stethoscope, badge: 'Active' },
    { id: 'my-appointments', label: 'My Appointments', icon: Calendar },
    { id: 'patient-profile', label: 'Medical Profile & OTP', icon: User }
  ];

  const doctorNav = [
    { id: 'doctor-dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
    { id: 'doctor-appointments', label: 'Patient Queue & Visits', icon: Calendar },
    { id: 'doctor-profile', label: 'Practice & Schedule', icon: Stethoscope }
  ];

  const adminNav = [
    { id: 'admin-dashboard', label: 'System Analytics', icon: LayoutDashboard },
    { id: 'admin-doctors', label: 'Doctors Directory', icon: Stethoscope },
    { id: 'admin-patients', label: 'Patient Records', icon: Users },
    { id: 'admin-appointments', label: 'All Appointments', icon: Calendar },
    { id: 'communication-logs', label: 'Twilio & SMS Center', icon: MessageSquare, badge: 'Live' }
  ];

  let navItems = patientNav;
  if (isDoctor) navItems = doctorNav;
  if (isAdmin) navItems = adminNav;

  return (
    <aside
      className={`sidebar-container ${isOpen ? 'open' : ''}`}
      style={{
        width: '270px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--slate-200)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 18px',
        flexShrink: 0
      }}
    >
      <div>
        {/* Portal Header Indicator */}
        <div style={{
          padding: '0 12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--slate-400)'
          }}>
            {isPatient ? 'Patient Portal' : isDoctor ? 'Doctor Practice' : 'Administration'}
          </span>
          <span className="pulse-dot" title="System Online"></span>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                  color: isActive ? 'var(--primary-700)' : 'var(--slate-600)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? 'inset 3px 0 0 var(--primary-600)' : 'none',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon
                    size={20}
                    color={isActive ? 'var(--primary-600)' : 'var(--slate-400)'}
                    style={{ transition: 'color 0.15s ease' }}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isActive ? 'var(--primary-600)' : 'var(--slate-200)',
                    color: isActive ? '#ffffff' : 'var(--slate-700)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Hospital 24/7 Helpline Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
        border: '1px solid var(--primary-100)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        fontSize: '0.82rem',
        boxShadow: 'var(--shadow-xs)',
        marginTop: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: 'var(--primary-900)', marginBottom: '6px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <HeartPulse size={15} />
          </div>
          24/7 Emergency Line
        </div>
        <div style={{ color: 'var(--slate-700)', fontSize: '0.84rem' }}>
          Call: <strong style={{ color: 'var(--primary-800)' }}>1-800-MEDICARE</strong>
        </div>
        <div style={{ color: 'var(--slate-500)', fontSize: '0.72rem', marginTop: '6px' }}>
          Instant triage & ambulance dispatch.
        </div>
      </div>
    </aside>
  );
}
