import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'teal', trend }) {
  const colorSchemes = {
    teal: {
      bg: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
      iconColor: '#0d9488',
      border: '#99f6e4',
      glow: 'rgba(13, 148, 136, 0.15)'
    },
    blue: {
      bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      iconColor: '#0284c7',
      border: '#bae6fd',
      glow: 'rgba(2, 132, 199, 0.15)'
    },
    indigo: {
      bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      iconColor: '#4f46e5',
      border: '#c7d2fe',
      glow: 'rgba(79, 70, 229, 0.15)'
    },
    amber: {
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      iconColor: '#d97706',
      border: '#fde68a',
      glow: 'rgba(217, 119, 6, 0.15)'
    },
    emerald: {
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      iconColor: '#059669',
      border: '#a7f3d0',
      glow: 'rgba(5, 150, 105, 0.15)'
    },
    rose: {
      bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      iconColor: '#e11d48',
      border: '#fecdd3',
      glow: 'rgba(225, 29, 72, 0.15)'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.teal;

  return (
    <div
      className="card card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: '700',
            color: 'var(--slate-500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {title}
          </span>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--slate-900)',
            marginTop: '6px',
            letterSpacing: '-0.03em',
            lineHeight: 1.1
          }}>
            {value}
          </div>
        </div>

        {Icon && (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: scheme.bg,
            border: `1px solid ${scheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 14px ${scheme.glow}`
          }}>
            <Icon size={24} color={scheme.iconColor} />
          </div>
        )}
      </div>

      {subtitle && (
        <div style={{
          marginTop: '18px',
          paddingTop: '12px',
          borderTop: '1px solid var(--slate-100)',
          fontSize: '0.82rem',
          color: 'var(--slate-500)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {trend && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: trend > 0 ? '#ecfdf5' : '#fef2f2',
              color: trend > 0 ? '#059669' : '#dc2626',
              fontWeight: '700',
              fontSize: '0.74rem'
            }}>
              {trend > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trend > 0 ? `+${trend}` : trend}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
