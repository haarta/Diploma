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
import AdminDoctors from './pages/AdminDoctors';
import { getAccessToken, isAdmin } from './auth';
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
                <Route path="/patients" element={<Patients />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route
                  path="/admin/doctors"
                  element={
                    <RequireAdmin>
                      <AdminDoctors />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/cabinet/*"
                  element={
                    <RequireAuth>
                      <Cabinet />
                    </RequireAuth>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </QueryClientProvider>
  );
}

