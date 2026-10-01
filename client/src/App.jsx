import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import TwilioConfigBanner from './components/TwilioConfigBanner';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import VerifyOtpModal from './components/VerifyOtpModal';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorsCatalog from './pages/DoctorsCatalog';
import MyAppointments from './pages/MyAppointments';
import PatientProfile from './pages/PatientProfile';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorProfile from './pages/DoctorProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminDoctors from './pages/AdminDoctors';
import AdminPatients from './pages/AdminPatients';
import AdminAppointments from './pages/AdminAppointments';
import CommunicationLogs from './pages/CommunicationLogs';

export default function App() {
  const { user, loading, isPatient, isDoctor, isAdmin } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState(() => {
    return 'patient-dashboard';
  });
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync activeTab when user role changes or logs in
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') setActiveTab('admin-dashboard');
      else if (user.role === 'doctor') setActiveTab('doctor-dashboard');
      else setActiveTab('patient-dashboard');
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#0d9488', fontWeight: '700', fontSize: '1.1rem' }}>
        Loading MediCare Platform...
      </div>
    );
  }

  // If not logged in, show Login / Register
  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  // Render main page content by activeTab
  const renderMainContent = () => {
    // Patient views
    if (isPatient) {
      switch (activeTab) {
        case 'patient-dashboard':
          return (
            <PatientDashboard
              onNavigateToBook={() => setActiveTab('doctors')}
              onNavigateToAppointments={() => setActiveTab('my-appointments')}
              onNavigateToProfile={() => setActiveTab('patient-profile')}
              onOpenOtpModal={() => setShowOtpModal(true)}
            />
          );
        case 'doctors':
          return (
            <DoctorsCatalog
              onBookingSuccess={() => setActiveTab('my-appointments')}
            />
          );
        case 'my-appointments':
          return (
            <MyAppointments
              onNavigateToBook={() => setActiveTab('doctors')}
            />
          );
        case 'patient-profile':
          return (
            <PatientProfile
              onOpenOtpModal={() => setShowOtpModal(true)}
            />
          );
        default:
          return <PatientDashboard onNavigateToBook={() => setActiveTab('doctors')} />;
      }
    }

    // Doctor views
    if (isDoctor) {
      switch (activeTab) {
        case 'doctor-dashboard':
          return <DoctorDashboard />;
        case 'doctor-appointments':
          return <DoctorAppointments />;
        case 'doctor-profile':
          return <DoctorProfile />;
        default:
          return <DoctorDashboard />;
      }
    }

    // Admin views
    if (isAdmin) {
      switch (activeTab) {
        case 'admin-dashboard':
          return (
            <AdminDashboard
              onNavigateToLogs={() => setActiveTab('communication-logs')}
              onNavigateToDoctors={() => setActiveTab('admin-doctors')}
              onNavigateToPatients={() => setActiveTab('admin-patients')}
            />
          );
        case 'admin-doctors':
          return <AdminDoctors />;
        case 'admin-patients':
          return <AdminPatients />;
        case 'admin-appointments':
          return <AdminAppointments />;
        case 'communication-logs':
          return <CommunicationLogs />;
        default:
          return <AdminDashboard onNavigateToLogs={() => setActiveTab('communication-logs')} />;
      }
    }

    return <div>Welcome to MediCare</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Twilio Diagnostic Status Banner */}
      <TwilioConfigBanner />

      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenOtpModal={() => setShowOtpModal(true)}
      />

      {/* App Body */}
      <div className="app-container" style={{ flex: 1 }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="main-content">
          {renderMainContent()}
        </main>
      </div>

      {/* Twilio OTP Modal */}
      {showOtpModal && (
        <VerifyOtpModal
          onClose={() => setShowOtpModal(false)}
          onSuccess={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
}
