import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import MenuBar from './components/MenuBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Cabinet from './pages/Cabinet';
import DoctorCabinet from './pages/DoctorCabinet';
import DoctorVerificationRequest from './pages/DoctorVerificationRequest';
import OnlineConsultations from './pages/OnlineConsultations';
import Promotions from './pages/Promotions';
import AdminPanel from './pages/AdminPanel';
import { getAccessToken, isAdmin, isDoctor } from './auth';
import './App.css';

const queryClient = new QueryClient();

function RequireAuth({ children }) {
  const token = getAccessToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const token = getAccessToken();
  if (!token || !isAdmin()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RequireDoctor({ children }) {
  const token = getAccessToken();
  if (!token || !isDoctor()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app-container">
          <Header />
          <MenuBar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/patients"
                element={(
                  <RequireAdmin>
                    <Patients />
                  </RequireAdmin>
                )}
              />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/online-consultations" element={<OnlineConsultations />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route
                path="/admin/*"
                element={(
                  <RequireAdmin>
                    <AdminPanel />
                  </RequireAdmin>
                )}
              />
              <Route
                path="/cabinet/*"
                element={(
                  <RequireAuth>
                    <Cabinet />
                  </RequireAuth>
                )}
              />
              <Route
                path="/doctor/cabinet"
                element={(
                  <RequireDoctor>
                    <DoctorCabinet />
                  </RequireDoctor>
                )}
              />
              <Route
                path="/cabinet/doctor-verification"
                element={(
                  <RequireAuth>
                    <DoctorVerificationRequest />
                  </RequireAuth>
                )}
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}
