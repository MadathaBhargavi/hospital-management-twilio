import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Filter, RefreshCw, Send, XCircle, CheckCircle2, AlertTriangle, Eye, Sparkles, Activity } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function CommunicationLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [statusFilter, channelFilter, eventFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getCommunicationLogs({
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        trigger_event: eventFilter || undefined,
        search: searchTerm || undefined
      });
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs();
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Telephony Audit Trail
            </span>
            <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>
              {logs.length} Total Messages
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.95rem',
            fontWeight: '800',
            color: 'var(--slate-900)',
            letterSpacing: '-0.03em'
          }}>
            Twilio Telephony & Communication Logs
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.94rem', marginTop: '4px' }}>
            Audit log of SMS notifications, automated appointment reminders, and OTP verifications dispatched by the system.
          </p>
        </div>

        <button onClick={loadLogs} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} />
          Refresh Logs
        </button>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: '18px 24px', marginBottom: '24px', borderRadius: 'var(--radius-xl)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search by recipient phone, name, or message text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent / Delivered Live</option>
              <option value="not_configured">Dev Mode (Simulated)</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <select
              className="form-select"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="">All Channels</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div style={{ minWidth: '170px' }}>
            <select
              className="form-select"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="">All Trigger Events</option>
              <option value="booking">Appointment Booking</option>
              <option value="reminder">Automated Reminder</option>
              <option value="confirmation">Doctor Confirmation</option>
              <option value="cancellation">Cancellation</option>
              <option value="reschedule">Reschedule</option>
              <option value="otp">Phone OTP</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Apply Filters
          </button>
        </form>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Activity size={36} color="var(--primary-600)" style={{ animation: 'pulseDot 1.5s infinite', margin: '0 auto 12px' }} />
            <div style={{ color: 'var(--slate-600)', fontWeight: '600' }}>Loading communication logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '50px 24px', textAlign: 'center', color: 'var(--slate-400)' }}>
            <MessageSquare size={44} style={{ margin: '0 auto 14px', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--slate-800)', fontSize: '1.2rem', fontWeight: '800' }}>No communication logs match the filters</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Try resetting the search terms or event filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Recipient Phone & Name</th>
                  <th>Channel</th>
                  <th>Trigger Event</th>
                  <th>Message Snippet</th>
                  <th>Twilio SID</th>
                  <th>Status</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.82rem', color: 'var(--slate-600)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: '800', color: 'var(--slate-900)' }}>{log.recipient_name || 'Patient'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary-700)', fontWeight: '700' }}>{log.recipient_phone}</div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.76rem', fontWeight: '800', letterSpacing: '0.04em' }}>
                        {log.channel}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: '0.74rem' }}>
                        {log.trigger_event}
                      </span>
                    </td>
                    <td>
                      <div style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.84rem' }}>
                        {log.content}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: 'var(--slate-500)' }}>
                      {log.twilio_sid || 'Simulated'}
                    </td>
                    <td>
                      <StatusBadge status={log.status} type="notification" />
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-secondary btn-sm"
                        title="Inspect Full Message"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Inspection Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <MessageSquare size={22} color="var(--primary-600)" />
                Notification Payload Audit
              </h3>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>
                <XCircle size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--slate-200)' }}>
                <div><strong>Recipient:</strong> {selectedLog.recipient_name} ({selectedLog.recipient_phone})</div>
                <div style={{ marginTop: '4px' }}><strong>Channel:</strong> {selectedLog.channel?.toUpperCase()}</div>
                <div style={{ marginTop: '4px' }}><strong>Trigger Event:</strong> {selectedLog.trigger_event}</div>
                <div style={{ marginTop: '4px' }}><strong>Status:</strong> <StatusBadge status={selectedLog.status} type="notification" /></div>
                <div style={{ marginTop: '4px' }}><strong>Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString()}</div>
                <div style={{ marginTop: '4px' }}><strong>Twilio SID:</strong> {selectedLog.twilio_sid || 'None (Simulated in Dev Mode)'}</div>
                {selectedLog.error_message && (
                  <div style={{ color: '#b91c1c', marginTop: '6px' }}>
                    <strong>Note/Error:</strong> {selectedLog.error_message}
                  </div>
                )}
              </div>

              <div>
                <strong>Message Content Delivered:</strong>
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid var(--slate-200)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '8px',
                  fontSize: '0.92rem',
                  lineHeight: 1.55,
                  color: 'var(--slate-900)'
                }}>
                  "{selectedLog.content}"
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => setSelectedLog(null)}>
                Close Audit Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
