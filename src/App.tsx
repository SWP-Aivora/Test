import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Core shared portals
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatPage } from './pages/ChatPage';

// Client workspace pages
import { ClientDashboard } from './pages/client/ClientDashboard';
import { JobCreateWizard } from './pages/client/JobCreateWizard';
import { JobDetailView } from './pages/client/JobDetailView';
import { ClientProjectView } from './pages/client/ClientProjectView';
import { ClientWallet } from './pages/client/ClientWallet';

// Expert workspace pages
import { ExpertDashboard } from './pages/expert/ExpertDashboard';
import { FindJobs } from './pages/expert/FindJobs';
import { ExpertProjectView } from './pages/expert/ExpertProjectView';
import { ExpertWallet } from './pages/expert/ExpertWallet';
import { ExpertProfileEdit } from './pages/expert/ExpertProfileEdit';

// Admin workspace pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DisputeArbitration } from './pages/admin/DisputeArbitration';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routing */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Shared — requires auth */}
            <Route path="/chat" element={
              <ProtectedRoute><ChatPage /></ProtectedRoute>
            } />

            {/* Client Portal — requires CLIENT role */}
            <Route path="/client/dashboard" element={
              <ProtectedRoute allowedRole="CLIENT"><ClientDashboard /></ProtectedRoute>
            } />
            <Route path="/client/jobs" element={
              <ProtectedRoute allowedRole="CLIENT"><ClientDashboard /></ProtectedRoute>
            } />
            <Route path="/client/jobs/new" element={
              <ProtectedRoute allowedRole="CLIENT"><JobCreateWizard /></ProtectedRoute>
            } />
            <Route path="/client/jobs/:id" element={
              <ProtectedRoute allowedRole="CLIENT"><JobDetailView /></ProtectedRoute>
            } />
            <Route path="/client/projects/:id" element={
              <ProtectedRoute allowedRole="CLIENT"><ClientProjectView /></ProtectedRoute>
            } />
            <Route path="/client/wallet" element={
              <ProtectedRoute allowedRole="CLIENT"><ClientWallet /></ProtectedRoute>
            } />

            {/* Expert Portal — requires EXPERT role */}
            <Route path="/expert/dashboard" element={
              <ProtectedRoute allowedRole="EXPERT"><ExpertDashboard /></ProtectedRoute>
            } />
            <Route path="/expert/jobs" element={
              <ProtectedRoute allowedRole="EXPERT"><FindJobs /></ProtectedRoute>
            } />
            <Route path="/expert/projects/:id" element={
              <ProtectedRoute allowedRole="EXPERT"><ExpertProjectView /></ProtectedRoute>
            } />
            <Route path="/expert/wallet" element={
              <ProtectedRoute allowedRole="EXPERT"><ExpertWallet /></ProtectedRoute>
            } />
            <Route path="/expert/profile" element={
              <ProtectedRoute allowedRole="EXPERT"><ExpertProfileEdit /></ProtectedRoute>
            } />

            {/* Admin Panel — requires ADMIN role */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/disputes/:id" element={
              <ProtectedRoute allowedRole="ADMIN"><DisputeArbitration /></ProtectedRoute>
            } />

            {/* Fallback Guard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
