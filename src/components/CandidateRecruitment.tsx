import React from 'react';
import { Briefcase, DollarSign, Tags, Code } from 'lucide-react';
import type { Candidate } from '../types/candidates';

interface Props {
  candidate: Candidate;
  isEditing?: boolean;
  onEdit?: (updatedCandidate: Candidate) => void;
}

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'] as const;

const CandidateRecruitment = ({ candidate, isEditing, onEdit }: Props) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getContractTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      CDI: 'CDI',
      CDD: 'CDD',
      Stage: 'Stage',
      Alternance: 'Alternance',
      Freelance: 'Freelance'
    };
    return types[type] || type;
  };

  const handleInputChange = (field: keyof Candidate, value: string | number | boolean | string[]) => {
    if (onEdit) {
      onEdit({
        ...candidate,
        [field]: value
      });
    }
  };

  const handleSkillChange = (skill: string) => {
    if (!onEdit) return;
    
    const updatedSkills = candidate.skills.includes(skill)
      ? candidate.skills.filter(s => s !== skill)
      : [...candidate.skills, skill];
    
    handleInputChange('skills', updatedSkills);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recrutement</h2>
        {isEditing ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={candidate.is_technical_position}
              onChange={(e) => handleInputChange('is_technical_position', e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Code className="w-4 h-4" />
            <span className="text-sm">Profil technique</span>
          </label>
        ) : (
          candidate.is_technical_position && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              <Code className="w-4 h-4 mr-1" />
              Profil technique
            </span>
          )
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Type de contrat</p>
            {isEditing ? (
              <select
                value={candidate.contract_type || ''}
                onChange={(e) => handleInputChange('contract_type', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Sélectionner un type</option>
                {CONTRACT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <p className="font-medium">
                  {candidate.contract_type ? 
                    getContractTypeDisplay(candidate.contract_type) : 
                    'Non défini'
                  }
                </p>
              </div>
            )}
          </div>

          {(isEditing || candidate.contract_type === 'Freelance') && (
            <div>
              <p className="text-sm text-gray-600">TJM</p>
              {isEditing && candidate.contract_type === 'Freelance' ? (
                <input
                  type="number"
                  value={candidate.daily_rate || ''}
                  onChange={(e) => handleInputChange('daily_rate', parseInt(e.target.value) || 0)}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <p className="font-medium">
                    {candidate.daily_rate ? formatCurrency(candidate.daily_rate) : '-'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600">Salaire souhaité</p>
            {isEditing ? (
              <input
                type="number"
                value={candidate.expected_salary || ''}
                onChange={(e) => handleInputChange('expected_salary', parseInt(e.target.value) || 0)}
                min="0"
                className="mt-1 block w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <p className="font-medium">
                  {candidate.expected_salary ? formatCurrency(candidate.expected_salary) : '-'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Poste visé</p>
            {isEditing ? (
              <input
                type="text"
                value={candidate.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            ) : (
              <p className="font-medium mt-1">{candidate.position}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Compétences</p>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <button
                    key={index}
                    onClick={() => handleSkillChange(skill)}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200"
                  >
                    <Tags className="w-4 h-4 inline-block mr-1" />
                    {skill}
                  </button>
                ))}
                <input
                  type="text"
                  placeholder="Ajouter une compétence..."
                  className="px-3 py-1 border rounded-full text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const newSkill = input.value.trim();
                      if (newSkill && !candidate.skills.includes(newSkill)) {
                        handleSkillChange(newSkill);
                      }
                      input.value = '';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-gray-100 text-gray-800"
                  >
                    <Tags className="w-4 h-4 mr-1" />
                    {skill}
                  </span>
                ))}
                {candidate.skills.length === 0 && (
                  <span className="text-gray-500">Aucune compétence renseignée</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateRecruitment;