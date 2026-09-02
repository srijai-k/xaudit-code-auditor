import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CheckerPage from './pages/CheckerPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/check" element={<CheckerPage />} />
        {/* Old routes from the previous app shell — redirect rather than 404 in case anyone bookmarked one. */}
        <Route path="/audit" element={<Navigate to="/check" replace />} />
        <Route path="/audit/history" element={<Navigate to="/check" replace />} />
        <Route path="/audit/report" element={<Navigate to="/check" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
