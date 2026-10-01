import React from 'react';
import { CheckCircle2, Clock, XCircle, RefreshCw, AlertTriangle, Send } from 'lucide-react';

export default function StatusBadge({ status, type = 'appointment' }) {
  if (!status) return null;

  const s = status.toLowerCase();

  if (type === 'appointment') {
    switch (s) {
      case 'confirmed':
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={13} />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning">
            <Clock size={13} />
            Pending
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-info">
            <CheckCircle2 size={13} />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge badge-danger">
            <XCircle size={13} />
            Cancelled
          </span>
        );
      case 'rescheduled':
        return (
          <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
            <RefreshCw size={13} />
            Rescheduled
          </span>
        );
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  }

  // Notification status
  if (type === 'notification') {
    switch (s) {
      case 'sent':
      case 'delivered':
        return (
          <span className="badge badge-success">
            <Send size={13} />
            {s === 'delivered' ? 'Delivered' : 'Sent Live'}
          </span>
        );
      case 'not_configured':
        return (
          <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
            <AlertTriangle size={13} />
            Dev Mode
          </span>
        );
      case 'failed':
        return (
          <span className="badge badge-danger">
            <XCircle size={13} />
            Failed
          </span>
        );
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  }

  return <span className="badge badge-neutral">{status}</span>;
}
