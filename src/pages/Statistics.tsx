import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, subMonths, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Stats {
  totalCandidates: number;
  candidatesByRole: {
    [key: string]: number;
  };
  validationRates: {
    approved: number;
    rejected: number;
    total: number;
  };
  averageProcessingTime: number;
}

interface Filters {
  period: 'all' | '1m' | '3m' | '6m';
  role: string;
  status: string;
}

const Statistics = () => {
  const [stats, setStats] = useState<Stats>({
    totalCandidates: 0,
    candidatesByRole: {},
    validationRates: {
      approved: 0,
      rejected: 0,
      total: 0
    },
    averageProcessingTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    period: '3m',
    role: 'all',
    status: 'all'
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates'
        },
        () => {
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidate_validations'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters]); // Re-subscribe when filters change

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user role
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userData) setUserRole(userData.role);

      // Calculate date range
      let startDate;
      switch (filters.period) {
        case '1m':
          startDate = subMonths(new Date(), 1);
          break;
        case '3m':
          startDate = subMonths(new Date(), 3);
          break;
        case '6m':
          startDate = subMonths(new Date(), 6);
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }

      // Build base query
      let query = supabase
        .from('candidates')
        .select(`
          *,
          candidate_validations (
            type,
            status,
            created_at
          )
        `);

      // Apply date filter
      if (filters.period !== 'all') {
        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply role filter
      if (filters.role !== 'all') {
        query = query.eq('created_by_role', filters.role);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: candidates } = await query;

      if (!candidates) return;

      // Calculate statistics
      const filteredCandidates = candidates.filter(candidate =>
        isWithinInterval(new Date(candidate.created_at), {
          start: startDate,
          end: new Date()
        })
      );

      // Count by role
      const roleCount: { [key: string]: number } = {};
      filteredCandidates.forEach(candidate => {
        const role = candidate.created_by_role || 'unknown';
        roleCount[role] = (roleCount[role] || 0) + 1;
      });

      // Calculate validation rates
      const validations = filteredCandidates.flatMap(c => c.candidate_validations);
      const totalValidations = validations.length;
      const approvedValidations = validations.filter(v => v.status === 'approved').length;
      const rejectedValidations = validations.filter(v => v.status === 'rejected').length;

      // Calculate average processing time
      const processingTimes = filteredCandidates
        .filter(c => c.status !== 'pending')
        .map(candidate => {
          const firstValidation = candidate.candidate_validations[0];
          if (!firstValidation) return null;
          return new Date(firstValidation.created_at).getTime() - new Date(candidate.created_at).getTime();
        })
        .filter((time): time is number => time !== null);

      const averageTime = processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

      setStats({
        totalCandidates: filteredCandidates.length,
        candidatesByRole: roleCount,
        validationRates: {
          approved: approvedValidations,
          rejected: rejectedValidations,
          total: totalValidations
        },
        averageProcessingTime: averageTime
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (userRole !== 'Manager') {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Accès réservé aux managers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <div className="flex items-center gap-4">
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value as Filters['period'] })}
              className="px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Toutes les périodes</option>
              <option value="1m">Dernier mois</option>
              <option value="3m">3 derniers mois</option>
              <option value="6m">6 derniers mois</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="RH">RH</option>
              <option value="Sales">Commercial</option>
              <option value="Tech">Technique</option>
              <option value="Manager">Manager</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved_sales">Validé commercial</option>
              <option value="approved_tech">Validé technique</option>
              <option value="rejected">Refusé</option>
              <option value="hired">Embauché</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg font-semibold">Total Candidats</h2>
            </div>
            <p className="text-3xl font-bold">{stats.totalCandidates}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold">Taux d'acceptation</h2>
            </div>
            <p className="text-3xl font-bold">
              {stats.validationRates.total > 0
                ? Math.round((stats.validationRates.approved / stats.validationRates.total) * 100)
                : 0}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-semibold">Taux de refus</h2>
            </div>
            <p className="text-3xl font-bold">
              {stats.validationRates.total > 0
                ? Math.round((stats.validationRates.rejected / stats.validationRates.total) * 100)
                : 0}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg font-semibold">Délai moyen</h2>
            </div>
            <p className="text-3xl font-bold">
              {Math.round(stats.averageProcessingTime / (1000 * 60 * 60 * 24))} jours
            </p>
          </div>
        </div>

        {/* Volume by Role */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Volume par rôle</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(stats.candidatesByRole).map(([role, count]) => (
              <div key={role} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700">{role}</h3>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Rates Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Détails des validations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700">Total validations</h3>
              <p className="text-2xl font-bold mt-2">{stats.validationRates.total}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-700">Validations</h3>
              <p className="text-2xl font-bold mt-2">{stats.validationRates.approved}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-700">Refus</h3>
              <p className="text-2xl font-bold mt-2">{stats.validationRates.rejected}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;