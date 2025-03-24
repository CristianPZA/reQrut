import React from 'react';
import { DollarSign, Calendar, Clock } from 'lucide-react';
import type { Candidate } from '../types/candidates';

interface Props {
  candidate: Candidate;
  isEditing?: boolean;
  onEdit?: (updatedCandidate: Candidate) => void;
}

const CandidateSituation = ({ candidate, isEditing, onEdit }: Props) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInputChange = (field: keyof Candidate, value: string | number | boolean) => {
    if (onEdit) {
      onEdit({
        ...candidate,
        [field]: value
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Situation actuelle</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">Salaire actuel</p>
            {isEditing ? (
              <input
                type="number"
                value={candidate.current_salary || ''}
                onChange={(e) => handleInputChange('current_salary', parseInt(e.target.value) || 0)}
                min="0"
                className="px-2 py-1 border rounded focus:ring-indigo-500 focus:border-indigo-500"
              />
            ) : (
              <p className="font-medium">
                {candidate.current_salary ? formatCurrency(candidate.current_salary) : '-'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">Années d'expérience</p>
            {isEditing ? (
              <input
                type="number"
                value={candidate.years_experience || ''}
                onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                min="0"
                className="px-2 py-1 border rounded focus:ring-indigo-500 focus:border-indigo-500"
              />
            ) : (
              <p className="font-medium">
                {candidate.years_experience ? `${candidate.years_experience} ans` : '-'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">Préavis</p>
            {isEditing ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={candidate.notice_period}
                    onChange={(e) => handleInputChange('notice_period', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">En préavis</span>
                </label>
                {candidate.notice_period && (
                  <input
                    type="number"
                    value={candidate.notice_months || ''}
                    onChange={(e) => handleInputChange('notice_months', parseInt(e.target.value) || 0)}
                    min="0"
                    placeholder="Nombre de mois"
                    className="px-2 py-1 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
              </div>
            ) : (
              <p className="font-medium">
                {candidate.notice_period ? (
                  candidate.notice_months ? 
                    `Oui (${candidate.notice_months} mois)` : 
                    'Oui'
                ) : 'Non'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateSituation;