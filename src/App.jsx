import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import ScrollThumb from './components/ScrollThumb.jsx';
import Day from './pages/caretaker/Day.jsx';
import Book from './pages/clerk/Book.jsx';
import Bookings from './pages/clerk/Bookings.jsx';
import Records from './pages/officer/Records.jsx';
import Welcome from './pages/Welcome.jsx';

export default function App() {
  const { pathname } = useLocation();
  return (
    <div className="app">
          <Header />
                <ScrollThumb />
          {/* The key restarts the page's entrance animation on every navigation. */}
      <main className="main" key={pathname}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/caretaker" element={<Navigate to="/caretaker/day" replace />} />
          <Route path="/caretaker/day" element={<Day />} />
          <Route path="/clerk" element={<Navigate to="/clerk/book" replace />} />
          <Route path="/clerk/book" element={<Book />} />
          <Route path="/clerk/bookings" element={<Bookings />} />
          <Route path="/officer" element={<Navigate to="/officer/records" replace />} />
          <Route path="/officer/records" element={<Records />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}


