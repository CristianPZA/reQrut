import React, { useState, useEffect } from 'react';
import { FileDown, Search, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  skills: string[];
  status: string;
  created_at: string;
}

interface JobPosition {
  id: string;
  title: string;
}

interface Skill {
  id: string;
  name: string;
}

const Admin = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    position: '',
    search: '',
  });
  const [newPosition, setNewPosition] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [error, setError] = useState<string | null>(null);

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

        // Fetch candidates
        const { data: candidatesData } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false });

        if (candidatesData) setCandidates(candidatesData);

        // Fetch job positions
        const { data: positionsData } = await supabase
          .from('job_positions')
          .select('*')
          .order('title', { ascending: true });

        if (positionsData) setJobPositions(positionsData);

        // Fetch skills
        const { data: skillsData } = await supabase
          .from('skills')
          .select('*')
          .order('name', { ascending: true });

        if (skillsData) setSkills(skillsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCandidates = candidates.filter(candidate => {
    const matchesStatus = !filters.status || candidate.status === filters.status;
    const matchesPosition = !filters.position || candidate.position.toLowerCase().includes(filters.position.toLowerCase());
    const matchesSearch = !filters.search || 
      candidate.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      candidate.email.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesPosition && matchesSearch;
  });

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredCandidates.map(candidate => ({
      'Nom': candidate.name,
      'Email': candidate.email,
      'Poste': candidate.position,
      'Compétences': candidate.skills.join(', '),
      'Statut': candidate.status.replace('_', ' '),
      'Date de création': new Date(candidate.created_at).toLocaleDateString('fr-FR'),
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Candidats');

    // Save file
    XLSX.writeFile(wb, 'candidats.xlsx');
  };

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosition.trim()) return;

    try {
      const { error } = await supabase
        .from('job_positions')
        .insert({ title: newPosition.trim() });

      if (error) throw error;

      const { data } = await supabase
        .from('job_positions')
        .select('*')
        .order('title', { ascending: true });

      if (data) setJobPositions(data);
      setNewPosition('');
      setError(null);
    } catch (err) {
      setError('Erreur lors de l\'ajout du poste');
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    try {
      const { error } = await supabase
        .from('skills')
        .insert({ name: newSkill.trim() });

      if (error) throw error;

      const { data } = await supabase
        .from('skills')
        .select('*')
        .order('name', { ascending: true });

      if (data) setSkills(data);
      setNewSkill('');
      setError(null);
    } catch (err) {
      setError('Erreur lors de l\'ajout de la compétence');
    }
  };

  const handleDeletePosition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_positions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJobPositions(jobPositions.filter(pos => pos.id !== id));
      setError(null);
    } catch (err) {
      setError('Erreur lors de la suppression du poste');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSkills(skills.filter(skill => skill.id !== id));
      setError(null);
    } catch (err) {
      setError('Erreur lors de la suppression de la compétence');
    }
  };

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
          <h1 className="text-2xl font-bold">Administration</h1>
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FileDown className="w-5 h-5 mr-2" />
            Exporter en Excel
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Job Positions Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Gestion des postes</h2>
            
            <form onSubmit={handleAddPosition} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="Nouveau poste..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {jobPositions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span>{position.title}</span>
                  <button
                    onClick={() => handleDeletePosition(position.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Gestion des compétences</h2>
            
            <form onSubmit={handleAddSkill} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Nouvelle compétence..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span>{skill.name}</span>
                  <button
                    onClick={() => handleDeleteSkill(skill.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Candidates Export */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Export des candidats</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tous</option>
                <option value="pending">En attente</option>
                <option value="approved_sales">Validé commercial</option>
                <option value="approved_tech">Validé technique</option>
                <option value="rejected">Refusé</option>
                <option value="hired">Embauché</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poste
              </label>
              <input
                type="text"
                value={filters.position}
                onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                placeholder="Filtrer par poste..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poste
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {candidate.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(candidate.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCandidates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun candidat trouvé
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;