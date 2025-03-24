import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  UserCheck,
  Bell,
  BarChart,
  Settings,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (data) setUserRole(data.role);
    };

    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    {
      to: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Tableau de bord',
      roles: ['RH', 'Sales', 'Tech', 'Manager'],
    },
    {
      to: '/candidates',
      icon: <Users className="w-5 h-5" />,
      label: 'Candidats',
      roles: ['RH', 'Sales', 'Tech', 'Manager'],
    },
    {
      to: '/validate-candidates',
      icon: <UserCheck className="w-5 h-5" />,
      label: 'Candidats à valider',
      roles: ['Sales', 'Tech', 'Manager'],
    },
    {
      to: '/vivier',
      icon: <Star className="w-5 h-5" />,
      label: 'Vivier',
      roles: ['RH', 'Sales', 'Tech', 'Manager'],
    },
    {
      to: '/reminders',
      icon: <Bell className="w-5 h-5" />,
      label: 'Rappels',
      roles: ['RH', 'Manager'],
    },
    {
      to: '/statistics',
      icon: <BarChart className="w-5 h-5" />,
      label: 'Statistiques',
      roles: ['Manager'],
    },
    {
      to: '/admin',
      icon: <Settings className="w-5 h-5" />,
      label: 'Administration',
      roles: ['Manager'],
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white p-4">
      <div className="flex items-center gap-2 mb-8">
        <LayoutDashboard className="w-8 h-8" />
        <h1 className="text-xl font-bold">CRM Pro</h1>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => (
          userRole && item.roles.includes(userRole) && (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          )
        ))}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;