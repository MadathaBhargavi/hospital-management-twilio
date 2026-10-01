import React, { useState, useEffect } from 'react';
import { Radio, AlertCircle, CheckCircle2, MessageSquare, Send, X } from 'lucide-react';
import { api } from '../services/api';

export default function TwilioConfigBanner() {
  const [status, setStatus] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Hello! This is a test message from MediCare Hospital Management System.');
  const [testChannel, setTestChannel] = useState('sms');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.getTwilioStatus();
      if (res.success) {
        setStatus(res.status);
      }
    } catch (err) {
      console.warn('Could not fetch Twilio status:', err.message);
    }
  };

  const handleTestSend = async (e) => {
    e.preventDefault();
    if (!testPhone) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.testTwilio({
        phone_number: testPhone,
        message: testMsg,
        channel: testChannel
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  if (!status) return null;

  return (
    <>
      <div className={`twilio-banner ${status.configured ? 'live-mode' : 'dev-mode'}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {status.configured ? (
            <CheckCircle2 size={18} color="#34d399" />
          ) : (
            <AlertCircle size={18} color="#fbbf24" />
          )}

          <span>
            {status.configured ? (
              <strong>Twilio Live SMS Active</strong>
            ) : (
              <strong>Twilio Dev Mode (Simulation)</strong>
            )}
            {' — '}
            {status.configured
              ? `Sender Number: ${status.fromNumber} | Ready to deliver live SMS & appointment reminders.`
              : `Credentials not set in .env. All SMS & reminders are automatically simulated & recorded to Communication Logs.`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowTestModal(true)}
            className="btn btn-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            <Send size={14} />
            Test SMS / WhatsApp
          </button>
        </div>
      </div>

      {showTestModal && (
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title">
                <Radio size={20} color="var(--primary-600)" />
                Twilio Diagnostic & Test Center
              </h3>
              <button className="modal-close" onClick={() => setShowTestModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="alert-box alert-info">
              <div>
                <strong>Twilio Status: </strong>
                {status.configured ? 'Configured & Connected' : 'Simulated / Dev Mode'}
                <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.9 }}>
                  From: {status.fromNumber || 'Simulated MediCare Gateway'} | Verify SID: {status.verifyServiceSid || 'Local Fallback'} | WhatsApp: {status.whatsappNumber || 'Disabled'}
                </div>
              </div>
            </div>

            <form onSubmit={handleTestSend}>
              <div className="form-group">
                <label className="form-label">Channel</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="channel"
                      value="sms"
                      checked={testChannel === 'sms'}
                      onChange={() => setTestChannel('sms')}
                    />
                    Twilio SMS
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="channel"
                      value="whatsapp"
                      checked={testChannel === 'whatsapp'}
                      onChange={() => setTestChannel('whatsapp')}
                    />
                    Twilio WhatsApp
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Recipient Phone Number (with Country Code)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+15551234567 or +919876543210"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Test Message Body</label>
                <textarea
                  className="form-textarea"
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {testResult && (
                <div className={`alert-box ${testResult.success ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '14px' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem' }}>
                      {testResult.success
                        ? testResult.result?.status === 'not_configured' || testResult.result?.devMode
                          ? '⚡ Simulated Notification Dispatched!'
                          : '✅ Live Message Delivered!'
                        : '❌ Failed to Process'}
                    </strong>
                    <div style={{ fontSize: '0.84rem', marginTop: '4px', lineHeight: 1.45 }}>
                      <strong>Status: </strong>
                      <span style={{ fontWeight: '700' }}>
                        {testResult.result?.status === 'not_configured' || testResult.result?.devMode
                          ? 'Simulated (Dev Mode - Recorded in Logs)'
                          : testResult.result?.status === 'sent'
                          ? `Delivered Live (Twilio SID: ${testResult.result?.twilioSid || 'OK'})`
                          : testResult.result?.status || 'Failed'}
                      </span>
                      {testResult.result?.errorMessage && (
                        <div style={{ fontSize: '0.78rem', marginTop: '2px', opacity: 0.9 }}>
                          {testResult.result.errorMessage}
                        </div>
                      )}
                      {!testResult.success && testResult.message && (
                        <div style={{ fontSize: '0.78rem', marginTop: '2px', opacity: 0.9 }}>
                          {testResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTestModal(false)}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={testing}>
                  {testing ? 'Sending...' : 'Send Test Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
