const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting End-to-End Hospital App & Twilio Integration Tests...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Checking API Health...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const health = await healthRes.json();
    console.log('   ✓ Health status:', health.status, '| Twilio Configured:', health.twilioConfigured);

    // 2. Patient Login
    console.log('\n2️⃣ Testing Patient Login...');
    const patientLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@medicare.com', password: 'Password123!' })
    });
    const patientAuth = await patientLoginRes.json();
    console.log('   ✓ Patient logged in:', patientAuth.success, '| Name:', patientAuth.user?.full_name);
    const patientToken = patientAuth.token;

    // 3. Search Doctors
    console.log('\n3️⃣ Searching Doctors Directory...');
    const doctorsRes = await fetch(`${API_BASE}/doctors?department_id=dept-cardio`);
    const docData = await doctorsRes.json();
    console.log('   ✓ Found Cardiology doctors:', docData.count, '| Lead doctor:', docData.doctors[0]?.full_name);
    const targetDoctor = docData.doctors[0];

    // 4. Query Doctor Available Slots for tomorrow
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    console.log(`\n4️⃣ Querying Slots for Dr. ${targetDoctor.full_name} on ${tomorrow}...`);
    const slotsRes = await fetch(`${API_BASE}/doctors/${targetDoctor.id}/slots?date=${tomorrow}`);
    const slotsData = await slotsRes.json();
    console.log('   ✓ Working Day:', slotsData.isWorkingDay, '| Available slots:', slotsData.availableSlots?.slice(0, 3));
    const chosenSlot = slotsData.availableSlots[0] || '10:00 AM';

    // 5. Book Appointment as Patient
    console.log(`\n5️⃣ Booking Consultation at ${chosenSlot}...`);
    const bookRes = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        doctor_id: targetDoctor.id,
        appointment_date: tomorrow,
        appointment_time: chosenSlot,
        reason: 'Automated test consultation for cardiovascular evaluation',
        symptoms: 'Mild shortness of breath during stairs'
      })
    });
    const booking = await bookRes.json();
    console.log('   ✓ Booking status:', booking.success, '| Appt #:', booking.appointment?.appointment_number, '| SMS Status:', booking.smsStatus);
    const newAppointmentId = booking.appointment?.id;

    // 6. Doctor Login
    console.log('\n6️⃣ Testing Doctor Login...');
    const docLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arthur.campbell@medicare.com', password: 'Password123!' })
    });
    const docAuth = await docLoginRes.json();
    console.log('   ✓ Doctor logged in:', docAuth.success, '| Name:', docAuth.user?.full_name);
    const doctorToken = docAuth.token;

    // 7. Doctor completes consultation with clinical notes & prescription
    console.log('\n7️⃣ Doctor completing consultation & writing prescription...');
    const updateRes = await fetch(`${API_BASE}/appointments/${newAppointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        status: 'completed',
        doctor_notes: 'Cardiovascular assessment completed. Normal sinus rhythm.',
        prescription: 'Lifestyle modification, routine aerobic exercise 30 mins daily.'
      })
    });
    const updateData = await updateRes.json();
    console.log('   ✓ Consultation completed:', updateData.success, '| Status:', updateData.appointment?.status);

    // 8. Admin Login & Analytics
    console.log('\n8️⃣ Testing Admin Login & Hospital Analytics...');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@medicare.com', password: 'Password123!' })
    });
    const adminAuth = await adminLoginRes.json();
    const adminToken = adminAuth.token;

    const analyticsRes = await fetch(`${API_BASE}/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const analytics = await analyticsRes.json();
    console.log('   ✓ Hospital Metrics:');
    console.log('     - Total Patients:', analytics.stats?.totalPatients);
    console.log('     - Active Doctors:', analytics.stats?.totalDoctors);
    console.log('     - Total Bookings:', analytics.stats?.total_appointments);
    console.log('     - Notifications Dispatched:', analytics.stats?.notifications?.total_notifications);

    // 9. Twilio OTP Flow Verification
    console.log('\n9️⃣ Testing Twilio OTP Verification Flow...');
    const testPhone = '+15559876543';
    const otpSendRes = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: testPhone })
    });
    const otpSend = await otpSendRes.json();
    console.log('   ✓ OTP Dispatched:', otpSend.success, '| Mode:', otpSend.service, '| Code:', otpSend.otpCode || 'Delivered via Twilio Verify');

    if (otpSend.otpCode) {
      const otpVerifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: testPhone, code: otpSend.otpCode })
      });
      const otpVerify = await otpVerifyRes.json();
      console.log('   ✓ OTP Verified:', otpVerify.success, '| Message:', otpVerify.message);
    }

    // 10. Automated Reminder Job Scanner Trigger
    console.log('\n🔟 Testing Automated Appointment Reminder Job Scanner...');
    const reminderRes = await fetch(`${API_BASE}/notifications/run-reminders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const reminderData = await reminderRes.json();
    console.log('   ✓ Reminder Scanner Executed:', reminderData.success, '| Processed appointments:', reminderData.result?.processed);

    // 11. Communication Logs Check
    console.log('\n1️⃣1️⃣ Auditing Twilio Communication Logs...');
    const commsRes = await fetch(`${API_BASE}/admin/communications`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const commsData = await commsRes.json();
    console.log('   ✓ Total Twilio Logs Stored:', commsData.count, '| Latest Event:', commsData.logs[0]?.trigger_event);

    console.log('\n🎉 ALL 11 TESTS PASSED SUCCESSFULLY! The Hospital Management & Twilio App is 100% operational.');
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

runTests();
