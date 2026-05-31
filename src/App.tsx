import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

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
      <AuthProvider>
        <Routes>
          {/* Public Routing */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Shared Real-Time Communication Hub */}
          <Route path="/chat" element={<ChatPage />} />

          {/* Client Portal Routing */}
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/jobs" element={<ClientDashboard />} /> {/* Lists jobs directly in dashboard */}
          <Route path="/client/jobs/new" element={<JobCreateWizard />} />
          <Route path="/client/jobs/:id" element={<JobDetailView />} />
          <Route path="/client/projects/:id" element={<ClientProjectView />} />
          <Route path="/client/wallet" element={<ClientWallet />} />

          {/* Expert Portal Routing */}
          <Route path="/expert/dashboard" element={<ExpertDashboard />} />
          <Route path="/expert/jobs" element={<FindJobs />} />
          <Route path="/expert/projects/:id" element={<ExpertProjectView />} />
          <Route path="/expert/wallet" element={<ExpertWallet />} />
          <Route path="/expert/profile" element={<ExpertProfileEdit />} />

          {/* Admin Panel Routing */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/disputes/:id" element={<DisputeArbitration />} />

          {/* Fallback Guard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
