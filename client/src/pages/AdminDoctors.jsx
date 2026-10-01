import React, { useState, useEffect } from 'react';
import { Stethoscope, PlusCircle, Search, Star, DollarSign, Award, XCircle, CheckCircle2, User } from 'lucide-react';
import { api } from '../services/api';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: 'Password123!',
    phone_number: '+1555',
    department_id: '',
    specialization: '',
    qualification: 'MD, MBBS',
    experience_years: 5,
    consultation_fee: 120,
    room_number: 'Room 201 - Tower A'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, deptRes] = await Promise.all([
        api.getAdminDoctors(),
        api.getAdminDepartments()
      ]);
      if (docRes.success) setDoctors(docRes.doctors || []);
      if (deptRes.success) {
        setDepartments(deptRes.departments || []);
        if (deptRes.departments?.length > 0) {
          setFormData((f) => ({ ...f, department_id: deptRes.departments[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.createDoctor(formData);
      if (res.success) {
        setSuccessMsg('Doctor created successfully!');
        setShowAddModal(false);
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create doctor');
    } finally {
      setSaving(false);
    }
  };

  const filtered = doctors.filter((d) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      d.full_name?.toLowerCase().includes(s) ||
      d.specialization?.toLowerCase().includes(s) ||
      d.department_name?.toLowerCase().includes(s) ||
      d.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--slate-900)' }}>
            Hospital Medical Staff & Doctors
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage active physicians, department assignments, and consultation pricing.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <PlusCircle size={16} />
          Add New Physician
        </button>
      </div>

      {successMsg && (
        <div className="alert-box alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search physicians by name, specialty, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Doctor Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-500)' }}>Loading staff...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>No doctors found.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>Fee</th>
                  <th>Room</th>
                  <th>Bookings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--slate-900)' }}>{d.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{d.email} • {d.phone_number}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{d.department_name}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{d.specialization}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{d.qualification}</div>
                    </td>
                    <td style={{ fontWeight: '700' }}>${d.consultation_fee}</td>
                    <td>{d.room_number || 'Room 101'}</td>
                    <td style={{ fontWeight: '700' }}>{d.appointment_count || 0}</td>
                    <td>
                      <span className="badge badge-success">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <Stethoscope size={20} color="var(--primary-600)" />
                Register New Physician
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <XCircle size={18} />
              </button>
            </div>

            {error && (
              <div className="alert-box alert-danger">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddDoctor}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Robert Chen"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="robert.chen@medicare.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+1555..."
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Pediatric Surgeon"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Qualifications</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Consultation Fee ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating Doctor...' : 'Register Physician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
