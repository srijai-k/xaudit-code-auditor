import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CheckerPage from './pages/CheckerPage';
import DocsPage from './pages/DocsPage';
import PrivacyPage from './pages/PrivacyPage';
import RulesPage from './pages/RulesPage';
import PageTransition from './components/PageTransition';
import { FloatingScrollNav } from './components/Navbar';
import useSmoothScroll from './hooks/useSmoothScroll';
import './App.css';

function App() {
  useSmoothScroll();

  return (
    <Router>
      <FloatingScrollNav />
      <PageTransition>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/check" element={<CheckerPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/rules" element={<RulesPage />} />
          {/* Old routes from the previous app shell — redirect rather than 404 in case anyone bookmarked one. */}
          <Route path="/audit" element={<Navigate to="/check" replace />} />
          <Route path="/audit/history" element={<Navigate to="/check" replace />} />
          <Route path="/audit/report" element={<Navigate to="/check" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </Router>
  );
}

export default App;
