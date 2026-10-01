import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Calendar, Heart, ShieldCheck, AlertCircle, FileText, XCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPatients();
      if (res.success) {
        setPatients(res.patients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter((p) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(s) ||
      p.email?.toLowerCase().includes(s) ||
      p.phone_number?.toLowerCase().includes(s) ||
      p.blood_group?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--slate-900)' }}>
          Registered Hospital Patients
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '4px' }}>
          Master directory of registered patients, clinical profiles, and Twilio phone status.
        </p>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search patients by name, email, phone, or blood group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-500)' }}>Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>No patients found.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Contact Phone & SMS Status</th>
                  <th>DOB & Gender</th>
                  <th>Blood Group</th>
                  <th>Total Visits</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--slate-900)' }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{p.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{p.phone_number}</span>
                        {p.is_phone_verified ? (
                          <span title="Twilio Verified"><ShieldCheck size={14} color="#059669" /></span>
                        ) : (
                          <span title="Unverified Phone"><AlertCircle size={14} color="#d97706" /></span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>{p.date_of_birth || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{p.gender || 'Not specified'}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontWeight: '700' }}>
                        {p.blood_group || 'O+'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700' }}>{p.appointment_count || 0}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      {p.registered_at ? new Date(p.registered_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="btn btn-secondary btn-sm"
                      >
                        <FileText size={14} />
                        Medical File
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Medical File Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <Users size={20} color="var(--primary-600)" />
                Patient Record - {selectedPatient.full_name}
              </h3>
              <button className="modal-close" onClick={() => setSelectedPatient(null)}>
                <XCircle size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              <div style={{ backgroundColor: 'var(--slate-50)', padding: '12px', borderRadius: '8px' }}>
                <div><strong>Email:</strong> {selectedPatient.email}</div>
                <div><strong>Phone Number:</strong> {selectedPatient.phone_number} ({selectedPatient.is_phone_verified ? 'Twilio Verified' : 'Unverified'})</div>
                <div><strong>Emergency Contact:</strong> {selectedPatient.emergency_contact || 'None registered'}</div>
                <div><strong>Address:</strong> {selectedPatient.address || 'None registered'}</div>
              </div>

              <div>
                <strong>Medical History & Chronic Conditions:</strong>
                <p style={{ backgroundColor: '#ffffff', border: '1px solid var(--slate-200)', padding: '10px', borderRadius: '6px', marginTop: '4px', color: 'var(--slate-700)' }}>
                  {selectedPatient.medical_history || 'No recorded history.'}
                </p>
              </div>

              <div>
                <strong>Known Allergies:</strong>
                <p style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px', marginTop: '4px', color: '#991b1b' }}>
                  {selectedPatient.allergies || 'No known allergies reported.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={() => setSelectedPatient(null)}>
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
