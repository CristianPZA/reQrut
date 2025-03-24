import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import MainLayout from './layouts/MainLayout';
import AuthGuard from './components/AuthGuard';
import CompleteProfile from './pages/CompleteProfile';
import Candidates from './pages/Candidates';
import CreateCandidate from './pages/CreateCandidate';
import CandidateDetails from './pages/CandidateDetails';
import ValidateCandidates from './pages/ValidateCandidates';
import Reminders from './pages/Reminders';
import Statistics from './pages/Statistics';
import Vivier from './pages/Vivier';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/complete-profile" element={
          <AuthGuard>
            <CompleteProfile />
          </AuthGuard>
        } />
        <Route path="/" element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/new" element={<CreateCandidate />} />
          <Route path="candidates/:id" element={<CandidateDetails />} />
          <Route path="validate-candidates" element={<ValidateCandidates />} />
          <Route path="vivier" element={<Vivier />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;