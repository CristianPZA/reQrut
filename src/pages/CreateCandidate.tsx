import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createLog } from '../lib/logs';
import type { JobPosition, Skill } from '../types/candidates';
import { Plus, AlertTriangle, Code } from 'lucide-react';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'] as const;

const CreateCandidate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [formData, setFormData] = useState({
    // Personal info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    location: '',

    // Current situation
    current_company: '',
    current_position: '',
    years_experience: '',
    current_salary: '',
    notice_period: false,
    notice_months: '',

    // Recruitment
    position: '',
    expected_salary: '',
    contract_type: '' as typeof CONTRACT_TYPES[number],
    daily_rate: '',
    skills: [] as string[],
    is_technical_position: false,
    hr_notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
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
      }
    };

    fetchData();
  }, []);

  // Check for duplicates when name, email, or phone changes
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!formData.email && !formData.phone) return;

      try {
        const { data: duplicates } = await supabase
          .from('candidates')
          .select('email, phone')
          .or(`email.eq.${formData.email}${formData.phone ? `,phone.eq.${formData.phone}` : ''}`);

        if (duplicates && duplicates.length > 0) {
          const matches = duplicates.map(d => {
            const matches = [];
            if (d.email === formData.email) matches.push('email');
            if (d.phone === formData.phone) matches.push('téléphone');
            return matches.join(', ');
          });
          setDuplicateWarning(`Attention : Un candidat existe déjà avec le même ${matches.join(' et ')}`);
        } else {
          setDuplicateWarning(null);
        }
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    };

    const debounceTimer = setTimeout(checkDuplicates, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.email, formData.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      // Prepare candidate data
      const candidateData = {
        ...formData,
        name: `${formData.first_name} ${formData.last_name}`.trim(),
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        current_salary: formData.current_salary ? parseInt(formData.current_salary) : null,
        expected_salary: formData.expected_salary ? parseInt(formData.expected_salary) : null,
        daily_rate: formData.daily_rate ? parseInt(formData.daily_rate) : null,
        notice_months: formData.notice_months ? parseInt(formData.notice_months) : null,
        created_by: session.user.id,
        status: 'draft'
      };

      // Insert the candidate
      const { data: candidate, error: insertError } = await supabase
        .from('candidates')
        .insert(candidateData)
        .select()
        .single();

      if (insertError) throw insertError;
      if (!candidate) throw new Error('Erreur lors de la création du candidat');

      // Create log entry
      await createLog(
        'create_candidate',
        'candidate',
        candidate.id,
        {
          name: candidateData.name,
          position: formData.position,
          is_technical_position: formData.is_technical_position
        }
      );

      navigate(`/candidates/${candidate.id}`);
    } catch (error) {
      console.error('Error creating candidate:', error);
      setError('Erreur lors de la création du candidat');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skillName: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skillName)
        ? prev.skills.filter(s => s !== skillName)
        : [...prev.skills, skillName]
    }));
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Nouveau candidat</h1>

        {error && (
          <div className="mb-6 bg-red-50 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        {duplicateWarning && (
          <div className="mb-6 bg-yellow-50 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-700">{duplicateWarning}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Informations personnelles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33612345678"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Current Situation */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Situation actuelle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entreprise actuelle
                  </label>
                  <input
                    type="text"
                    value={formData.current_company}
                    onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poste actuel
                  </label>
                  <input
                    type="text"
                    value={formData.current_position}
                    onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salaire actuel (€)
                  </label>
                  <input
                    type="number"
                    value={formData.current_salary}
                    onChange={(e) => setFormData({ ...formData, current_salary: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.notice_period}
                      onChange={(e) => setFormData({ ...formData, notice_period: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Préavis
                  </label>
                </div>

                {formData.notice_period && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de mois de préavis
                    </label>
                    <input
                      type="number"
                      value={formData.notice_months}
                      onChange={(e) => setFormData({ ...formData, notice_months: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Recruitment */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Recrutement</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de contrat
                  </label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as typeof CONTRACT_TYPES[number] })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    {CONTRACT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {formData.contract_type === 'Freelance' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TJM (€)
                    </label>
                    <input
                      type="number"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poste visé
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Sélectionner un poste</option>
                    {jobPositions.map((position) => (
                      <option key={position.id} value={position.title}>
                        {position.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salaire souhaité (€)
                  </label>
                  <input
                    type="number"
                    value={formData.expected_salary}
                    onChange={(e) => setFormData({ ...formData, expected_salary: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_technical_position}
                    onChange={(e) => setFormData({ ...formData, is_technical_position: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Code className="w-4 h-4" />
                  Poste technique (nécessite une validation technique)
                </label>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compétences
              </label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.name)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      formData.skills.includes(skill.name)
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes RH
              </label>
              <textarea
                value={formData.hr_notes}
                onChange={(e) => setFormData({ ...formData, hr_notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ajoutez vos notes concernant le candidat..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/candidates')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5 mr-2" />
                Créer le candidat
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCandidate;