import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Candidate } from '../types/candidates';
import type { JobPosition } from '../types/candidates';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [hrUsers, setHrUsers] = useState<UserProfile[]>([]);
  const [salesUsers, setSalesUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    position: '',
    isTechnical: false,
    hrReference: '',
    salesReference: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0
  });

  const fetchCandidates = async () => {
    try {
      setLoading(true);

      // Build base query
      let query = supabase
        .from('candidates')
        .select(`
          *,
          created_by (
            full_name,
            role
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.position) {
        query = query.eq('position', filters.position);
      }
      if (filters.isTechnical) {
        query = query.eq('is_technical_position', true);
      }
      if (filters.hrReference) {
        query = query.eq('created_by', filters.hrReference);
      }
      if (filters.search) {
        query = query.or(`
          name.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%,
          position.ilike.%${filters.search}%
        `);
      }

      // Apply pagination
      const start = (pagination.page - 1) * pagination.pageSize;
      query = query
        .order('created_at', { ascending: false })
        .range(start, start + pagination.pageSize - 1);

      const { data, count, error } = await query;

      if (error) throw error;
      if (data) {
        setCandidates(data);
        setPagination(prev => ({ ...prev, total: count || 0 }));
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch job positions
        const { data: positionsData } = await supabase
          .from('job_positions')
          .select('*')
          .order('title');

        if (positionsData) setJobPositions(positionsData);

        // Fetch HR users
        const { data: hrData } = await supabase
          .from('user_profiles')
          .select('id, full_name, role')
          .eq('role', 'RH');

        if (hrData) setHrUsers(hrData);

        // Fetch Sales users
        const { data: salesData } = await supabase
          .from('user_profiles')
          .select('id, full_name, role')
          .eq('role', 'Sales');

        if (salesData) setSalesUsers(salesData);

        // Initial candidates fetch will be triggered by useEffect below
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch candidates when filters or pagination change
  useEffect(() => {
    fetchCandidates();
  }, [filters, pagination.page, pagination.pageSize]);

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      pending_sales: 'bg-blue-100 text-blue-800',
      pending_tech: 'bg-purple-100 text-purple-800',
      validated: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-indigo-100 text-indigo-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'Brouillon',
      pending: 'En attente de validation',
      pending_sales: 'En attente validation commerciale',
      pending_tech: 'En attente validation technique',
      validated: 'Validé',
      rejected: 'Refusé',
      hired: 'Embauché'
    };
    return statusMap[status] || status;
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      position: '',
      isTechnical: false,
      hrReference: '',
      salesReference: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newSize, page: 1 }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(startItem + pagination.pageSize - 1, pagination.total);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Gestion des Candidats</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-colors ${
                showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {Object.values(filters).some(value => value !== '' && value !== false) && (
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>
          </div>
          {userRole === 'RH' && (
            <Link
              to="/candidates/new"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau candidat
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="sticky top-0 z-10 bg-white border-b">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un candidat..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                />
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => {
                        setFilters({ ...filters, status: e.target.value });
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="draft">Brouillon</option>
                      <option value="pending">En attente</option>
                      <option value="pending_sales">En attente commercial</option>
                      <option value="pending_tech">En attente technique</option>
                      <option value="validated">Validé</option>
                      <option value="rejected">Refusé</option>
                      <option value="hired">Embauché</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poste
                    </label>
                    <select
                      value={filters.position}
                      onChange={(e) => {
                        setFilters({ ...filters, position: e.target.value });
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Tous les postes</option>
                      {jobPositions.map((position) => (
                        <option key={position.id} value={position.title}>
                          {position.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RH en charge
                    </label>
                    <select
                      value={filters.hrReference}
                      onChange={(e) => {
                        setFilters({ ...filters, hrReference: e.target.value });
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Tous</option>
                      {hrUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={filters.isTechnical}
                        onChange={(e) => {
                          setFilters({ ...filters, isTechnical: e.target.checked });
                          setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Poste technique uniquement
                    </label>
                  </div>

                  <div className="flex items-center">
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-4 h-4" />
                      Réinitialiser les filtres
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poste
                      </th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RH
                      </th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {candidates.map((candidate) => (
                      <tr
                        key={candidate.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => window.location.href = `/candidates/${candidate.id}`}
                      >
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {[candidate.first_name, candidate.last_name].filter(Boolean).join(' ') || candidate.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {candidate.email}
                          </div>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {candidate.position}
                          </div>
                          {candidate.is_technical_position && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Technique
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(candidate.status)}`}>
                            {getStatusDisplay(candidate.status)}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500">
                          {candidate.created_by?.full_name || '-'}
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500">
                          {new Date(candidate.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {candidates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun candidat trouvé
                  </div>
                )}
              </div>

              {candidates.length > 0 && (
                <div className="sticky bottom-0 px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <select
                      value={pagination.pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {PAGE_SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>
                          {size} par page
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-700">
                      {startItem}–{endItem} sur {pagination.total} candidats
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`min-w-[2.5rem] h-10 px-3 rounded-lg ${
                            pageNum === pagination.page
                              ? 'bg-indigo-600 text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === totalPages}
                      className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Candidates;