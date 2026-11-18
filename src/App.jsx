import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import TrackComplaint from './pages/TrackComplaint';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Overview from './pages/admin/Overview';
import Complaints from './pages/admin/Complaints';
import ComplaintDetail from './pages/admin/ComplaintDetail';
import LiveMap from './pages/admin/LiveMap';
import Insights from './pages/admin/Insights';
import Departments from './pages/admin/Departments';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Citizen-facing site */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/track" element={<TrackComplaint />} />
            <Route path="/about" element={<About />} />
          </Route>

          {/* Administrator console */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="complaints/:id" element={<ComplaintDetail />} />
            <Route path="map" element={<LiveMap />} />
            <Route path="insights" element={<Insights />} />
            <Route path="departments" element={<Departments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Old prototype URLs */}
          <Route path="/citizen" element={<Navigate to="/report" replace />} />
          <Route path="/citizen/track" element={<Navigate to="/track" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
