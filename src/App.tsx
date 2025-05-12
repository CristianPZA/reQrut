import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Objectives from './pages/Objectives';
import Evaluations from './pages/Evaluations';
import History from './pages/History';
import MainLayout from './layouts/MainLayout';
import AuthGuard from './components/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="objectives" element={<Objectives />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;