import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import LandingPage from './pages/LandingPage';
import AuditTool from './pages/AuditTool';
import HistoryPage from './pages/HistoryPage';
import ReportPage from './pages/ReportPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/audit" element={<AuditTool />} />
        <Route path="/audit/history" element={<HistoryPage />} />
        <Route path="/audit/report" element={<ReportPage />} />
      </Routes>
      <SpeedInsights />
    </Router>
  );
}

export default App;
