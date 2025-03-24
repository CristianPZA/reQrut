import React from 'react';
import { Link, User, Mail, Star } from 'lucide-react';
import type { Candidate } from '../types/candidates';
import { supabase } from '../lib/supabase';

interface Props {
  candidate: Candidate;
}

const CandidateHeader = ({ candidate }: Props) => {
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

  const toggleFavorite = async () => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ is_favorite: !candidate.is_favorite })
        .eq('id', candidate.id);

      if (error) throw error;

      // Refresh the page to show updated state
      window.location.reload();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const fullName = [candidate.first_name, candidate.last_name]
    .filter(Boolean)
    .join(' ') || candidate.name;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-gray-400" />
            {fullName}
            <button
              onClick={toggleFavorite}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Star
                className={`w-5 h-5 ${
                  candidate.is_favorite
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-400'
                }`}
              />
            </button>
          </h1>
          <div className="mt-2 flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {candidate.email}
            </div>
            {candidate.linkedin_url && (
              <a
                href={candidate.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
              >
                <Link className="w-5 h-5" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(candidate.status)}`}>
            {getStatusDisplay(candidate.status)}
          </span>
          <p className="mt-2 text-sm text-gray-500">
            Poste visé : {candidate.position}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CandidateHeader;