import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle2, XCircle, FileText, Search, Filter } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotesApt, setSelectedNotesApt] = useState(null);

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

  const filtered = appointments.filter((a) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      a.patient_name?.toLowerCase().includes(s) ||
      a.appointment_number?.toLowerCase().includes(s) ||
      a.patient_phone?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--slate-900)' }}>
          Patient Consultations Roster
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '4px' }}>
          Complete list of all patient appointments, clinical histories, and visit records.
        </p>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by patient name, phone, or appointment #..."
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

      {/* Table */}
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
                  <th>Appointment #</th>
                  <th>Patient Info</th>
                  <th>Date & Time</th>
                  <th>Reason / Symptoms</th>
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {a.patient_phone} • {a.patient_gender || 'Patient'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{a.appointment_date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{a.appointment_time}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.reason || 'General'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedNotesApt(a)}
                        className="btn btn-secondary btn-sm"
                      >
                        <FileText size={14} />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedNotesApt && (
        <div className="modal-overlay" onClick={() => setSelectedNotesApt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <FileText size={20} color="var(--primary-600)" />
                Appointment #{selectedNotesApt.appointment_number} Details
              </h3>
              <button className="modal-close" onClick={() => setSelectedNotesApt(null)}>
                <XCircle size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ backgroundColor: 'var(--slate-50)', padding: '12px', borderRadius: '8px' }}>
                <div><strong>Patient Name:</strong> {selectedNotesApt.patient_name}</div>
                <div><strong>Phone Number:</strong> {selectedNotesApt.patient_phone}</div>
                <div><strong>Date & Time:</strong> {selectedNotesApt.appointment_date} at {selectedNotesApt.appointment_time}</div>
                <div><strong>Status:</strong> <StatusBadge status={selectedNotesApt.status} /></div>
              </div>

              <div>
                <strong>Reason:</strong> {selectedNotesApt.reason || 'None stated'}
              </div>
              {selectedNotesApt.symptoms && (
                <div><strong>Symptoms:</strong> {selectedNotesApt.symptoms}</div>
              )}
              {selectedNotesApt.doctor_notes && (
                <div style={{ backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '6px', color: '#065f46' }}>
                  <strong>Doctor Notes:</strong> {selectedNotesApt.doctor_notes}
                </div>
              )}
              {selectedNotesApt.prescription && (
                <div style={{ backgroundColor: '#f0fdfa', padding: '10px', borderRadius: '6px', color: '#0f766e' }}>
                  <strong>Prescription:</strong> {selectedNotesApt.prescription}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={() => setSelectedNotesApt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
