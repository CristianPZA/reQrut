import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  pendingObjectives: number;
  pendingEvaluations: number;
  completedObjectives: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    pendingObjectives: 0,
    pendingEvaluations: 0,
    completedObjectives: 0
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (roleData) {
          setUserRole(roleData.role);
        }

        // Fetch statistics based on role
        const { data: stats } = await supabase
          .rpc('get_dashboard_stats', { user_id: session.user.id });

        if (stats) {
          setStats(stats);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to HR Portal</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Objectives</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.pendingObjectives}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Evaluations</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingEvaluations}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Objectives</h3>
            <p className="text-3xl font-bold text-green-600">{stats.completedObjectives}</p>
          </div>
        </div>

        {userRole === 'direction' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Overview</h2>
            {/* Department-specific content */}
          </div>
        )}

        {(userRole === 'coach_rh' || userRole === 'referent_projet') && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Overview</h2>
            {/* Team-specific content */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;