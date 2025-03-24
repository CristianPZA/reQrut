import React from 'react';
import { Phone, MapPin, Building, Briefcase } from 'lucide-react';
import type { Candidate } from '../types/candidates';

interface Props {
  candidate: Candidate;
  isEditing?: boolean;
  onEdit?: (updatedCandidate: Candidate) => void;
}

const CandidateInfo = ({ candidate, isEditing, onEdit }: Props) => {
  const handleInputChange = (field: keyof Candidate, value: string) => {
    if (onEdit) {
      onEdit({
        ...candidate,
        [field]: value
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Téléphone</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={candidate.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+33612345678"
                  className="px-2 py-1 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                />
              ) : (
                <p className="font-medium">{candidate.phone || 'Non renseigné'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Localisation</p>
              {isEditing ? (
                <input
                  type="text"
                  value={candidate.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="px-2 py-1 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                />
              ) : (
                <p className="font-medium">{candidate.location || 'Non renseigné'}</p>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Entreprise actuelle</p>
              {isEditing ? (
                <input
                  type="text"
                  value={candidate.current_company || ''}
                  onChange={(e) => handleInputChange('current_company', e.target.value)}
                  className="px-2 py-1 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                />
              ) : (
                <p className="font-medium">{candidate.current_company || 'Non renseigné'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Poste actuel</p>
              {isEditing ? (
                <input
                  type="text"
                  value={candidate.current_position || ''}
                  onChange={(e) => handleInputChange('current_position', e.target.value)}
                  className="px-2 py-1 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                />
              ) : (
                <p className="font-medium">{candidate.current_position || 'Non renseigné'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateInfo;