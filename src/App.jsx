import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard initialSection="dashboard" />} />
        <Route path="/dashboard/history" element={<Dashboard initialSection="history" />} />
        <Route path="/dashboard/analytics" element={<Dashboard initialSection="analytics" />} />
        <Route path="/dashboard/profile" element={<Dashboard initialSection="profile" />} />
        <Route path="/dashboard/settings" element={<Dashboard initialSection="settings" />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
};

export default App;
