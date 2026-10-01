import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Trash2, CheckCircle2, Clock, MapPin, XCircle } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [filterStatus]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.getAppointments({ status: filterStatus || undefined });
      if (res.success) {
        setAppointments(res.appointments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, aptNumber) => {
    if (!window.confirm(`Are you sure you want to remove appointment #${aptNumber}?`)) return;

    try {
      const res = await api.deleteAppointment(id);
      if (res.success) {
        setSuccessMsg(`Appointment #${aptNumber} deleted.`);
        loadAppointments();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete appointment');
    }
  };

  const filtered = appointments.filter((a) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      a.appointment_number?.toLowerCase().includes(s) ||
      a.patient_name?.toLowerCase().includes(s) ||
      a.doctor_name?.toLowerCase().includes(s) ||
      a.department_name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--slate-900)' }}>
          Hospital Master Appointments
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '4px' }}>
          Real-time oversight of all scheduled, completed, and cancelled consultations across departments.
        </p>
      </div>

      {successMsg && (
        <div className="alert-box alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by appointment #, patient, doctor, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-500)' }}>Loading appointments...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>No appointments found.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Appt #</th>
                  <th>Patient</th>
                  <th>Doctor & Dept</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '700', color: 'var(--slate-900)' }}>
                      #{a.appointment_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{a.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{a.patient_phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{a.doctor_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)' }}>{a.department_name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{a.appointment_date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{a.appointment_time}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.reason || 'General'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(a.id, a.appointment_number)}
                        className="btn btn-outline-danger btn-sm"
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
