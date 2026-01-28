import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import MenuBar from './components/MenuBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import './App.css';

const queryClient = new QueryClient();

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
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </QueryClientProvider>
  );
}
