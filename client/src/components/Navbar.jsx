import React, { useState, useEffect } from 'react';
import {
  Activity, Bell, User, LogOut, Shield, Stethoscope, UserCheck,
  CheckCircle2, AlertCircle, Phone, Menu, X, ChevronDown, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Navbar({ onToggleSidebar, onOpenOtpModal }) {
  const { user, logout, quickLogin, isPatient } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      // ignore
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield size={13} color="#ef4444" />;
      case 'doctor': return <Stethoscope size={13} color="#0d9488" />;
      default: return <UserCheck size={13} color="#0284c7" />;
    }
  };

  return (
    <header style={{
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      padding: '0 28px',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 900,
      boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
    }}>
      {/* Left: Brand & Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            color: 'var(--slate-700)'
          }}
          className="mobile-menu-btn"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)',
            position: 'relative'
          }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.28rem',
              fontWeight: '800',
              color: 'var(--slate-900)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1
            }}>
              Medi<span style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Care</span>
            </div>
            <div style={{
              fontSize: '0.68rem',
              color: 'var(--slate-500)',
              fontWeight: '700',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              Healthcare & Twilio SMS
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Quick Demo Role Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'var(--slate-100)',
        padding: '5px 8px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--slate-200)'
      }}>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: '700',
          color: 'var(--slate-500)',
          padding: '0 6px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Sparkles size={12} color="var(--primary-600)" />
          Role:
        </span>
        <button
          onClick={() => quickLogin('patient')}
          className={`btn btn-sm ${user?.role === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '4px 12px',
            fontSize: '0.76rem',
            borderRadius: 'var(--radius-full)'
          }}
          title="Switch to Demo Patient"
        >
          Patient
        </button>
        <button
          onClick={() => quickLogin('doctor')}
          className={`btn btn-sm ${user?.role === 'doctor' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '4px 12px',
            fontSize: '0.76rem',
            borderRadius: 'var(--radius-full)'
          }}
          title="Switch to Demo Doctor"
        >
          Doctor
        </button>
        <button
          onClick={() => quickLogin('admin')}
          className={`btn btn-sm ${user?.role === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '4px 12px',
            fontSize: '0.76rem',
            borderRadius: 'var(--radius-full)'
          }}
          title="Switch to Demo Admin"
        >
          Admin
        </button>
      </div>

      {/* Right: Notifications, User Profile, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Notification Bell Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              border: '1px solid var(--slate-200)',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-xs)'
            }}
            title="View SMS Alerts"
          >
            <Bell size={19} color="var(--slate-600)" />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                fontSize: '0.66rem',
                fontWeight: '800',
                width: '19px',
                height: '19px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}>
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '52px',
              width: '360px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--slate-200)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--slate-100)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--slate-50)'
              }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                  Twilio & SMS Notifications
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                  {notifications.length} recent
                </span>
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
                    No recent notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--slate-100)',
                      fontSize: '0.84rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      transition: 'background-color 0.15s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: 'var(--slate-800)', textTransform: 'capitalize' }}>
                          {n.trigger_event?.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: 'var(--slate-600)', margin: 0, lineHeight: 1.45 }}>{n.content}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>
                          To: {n.recipient_phone}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          color: n.status === 'sent' ? '#059669' : n.status === 'failed' ? '#dc2626' : '#d97706'
                        }}>
                          {n.status === 'sent' ? '✓ Sent Live' : n.status === 'failed' ? '✗ Failed' : '⚡ Dev Log'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card & Dropdown */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--slate-50)',
            padding: '6px 10px 6px 6px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ccfbf1 0%, #e0f2fe 100%)',
              border: '1px solid var(--primary-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-800)',
              fontWeight: '800',
              fontSize: '0.95rem'
            }}>
              {user.full_name?.charAt(0) || 'U'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--slate-900)' }}>
                  {user.full_name}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: user.role === 'admin' ? '#fee2e2' : user.role === 'doctor' ? '#ccfbf1' : '#e0f2fe',
                  color: user.role === 'admin' ? '#b91c1c' : user.role === 'doctor' ? '#0f766e' : '#0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  {getRoleIcon(user.role)}
                  {user.role}
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
                {user.phone_number} {user.is_phone_verified ? '• ✓ Verified' : ''}
              </span>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 8px', borderRadius: '8px' }}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
