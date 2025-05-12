import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  ClipboardCheck, 
  History,
  LogOut 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white p-4">
      <div className="flex items-center gap-2 mb-8">
        <ClipboardCheck className="w-8 h-8" />
        <h1 className="text-xl font-bold">HR Portal</h1>
      </div>
      
      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 rounded-lg transition-colors ${
              isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink
          to="/objectives"
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 rounded-lg transition-colors ${
              isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <Target className="w-5 h-5" />
          Objectives
        </NavLink>

        <NavLink
          to="/evaluations"
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 rounded-lg transition-colors ${
              isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <ClipboardCheck className="w-5 h-5" />
          Evaluations
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 rounded-lg transition-colors ${
              isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <History className="w-5 h-5" />
          History
        </NavLink>
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;