import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';
import type { CandidateValidation } from '../types/candidates';
import { supabase } from '../lib/supabase';
import { createLog } from '../lib/logs';
import { determineStatus } from '../lib/validation';

interface Props {
  candidateId: string;
  validations: CandidateValidation[];
  isTechnicalPosition: boolean;
  userRole: string | null;
  onValidationAdded: (validation: CandidateValidation) => void;
  onStatusChange: (newStatus: string) => void;
}

const CandidateValidations = ({ 
  candidateId, 
  validations, 
  isTechnicalPosition,
  userRole,
  onValidationAdded,
  onStatusChange
}: Props) => {
  const [validationType, setValidationType] = useState<'sales' | 'tech'>('sales');
  const [validationStatus, setValidationStatus] = useState<'approved' | 'rejected'>('approved');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canValidate = userRole && (userRole === 'Sales' || userRole === 'Tech' || userRole === 'Manager');
  const hasValidated = validations.some(
    validation => 
      validation.user_profile?.role === userRole && 
      validation.type === (userRole === 'Sales' ? 'sales' : 'tech')
  );

  const handleValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId) return;

    // Check if justification is required for rejection
    if (validationStatus === 'rejected' && !justification.trim()) {
      setError('Une justification est requise pour le refus');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Check if user has already validated
      const hasValidated = validations.some(
        v => v.user_id === session.user.id && v.type === validationType
      );

      if (hasValidated) {
        setError('Vous avez déjà validé ce candidat');
        return;
      }

      const { data: validation, error } = await supabase
        .from('candidate_validations')
        .insert({
          candidate_id: candidateId,
          user_id: session.user.id,
          type: validationType,
          status: validationStatus,
          justification: justification.trim()
        })
        .select(`
          *,
          user_profile:user_profiles(full_name, role)
        `)
        .single();

      if (error) throw error;

      await createLog(
        validationStatus === 'approved' ? 'validate_candidate' : 'reject_candidate',
        'candidate',
        candidateId,
        {
          validation_type: validationType,
          justification: justification.trim()
        }
      );

      // Add the new validation to the list
      onValidationAdded(validation);

      // Determine and update the new status
      const newStatus = determineStatus([...validations, validation], isTechnicalPosition);
      onStatusChange(newStatus);

      // Reset form
      setJustification('');
      setError(null);
    } catch (error) {
      console.error('Error adding validation:', error);
      setError('Une erreur est survenue lors de la validation');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Historique des validations</h2>
        {isTechnicalPosition && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Validation technique requise
          </div>
        )}
      </div>

      {/* Validation Form */}
      {canValidate && !hasValidated && (
        <form onSubmit={handleValidation} className="mb-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de validation
              </label>
              <select
                value={validationType}
                onChange={(e) => setValidationType(e.target.value as 'sales' | 'tech')}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {(userRole === 'Sales' || userRole === 'Manager') && (
                  <option value="sales">Commercial</option>
                )}
                {((userRole === 'Tech' || userRole === 'Manager') && isTechnicalPosition) && (
                  <option value="tech">Technique</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Décision
              </label>
              <select
                value={validationStatus}
                onChange={(e) => setValidationStatus(e.target.value as 'approved' | 'rejected')}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="approved">Approuver</option>
                <option value="rejected">Refuser</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justification
              {validationStatus === 'rejected' && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              required={validationStatus === 'rejected'}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Valider
          </button>
        </form>
      )}

      {/* Validations History */}
      <div className="space-y-4">
        {validations.map((validation) => (
          <div
            key={validation.id}
            className={`border-l-4 pl-4 py-2 ${
              validation.status === 'approved' 
                ? 'border-green-500' 
                : 'border-red-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {validation.user_profile?.full_name} ({validation.user_profile?.role})
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(validation.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-sm rounded-full ${
                  validation.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {validation.type === 'sales' ? 'Commercial' : 'Technique'} - {' '}
                {validation.status === 'approved' ? 'Approuvé' : 'Refusé'}
              </span>
            </div>
            {validation.justification && (
              <p className="mt-2 text-gray-700">{validation.justification}</p>
            )}
          </div>
        ))}
        {validations.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            Aucune validation
          </p>
        )}
      </div>
    </div>
  );
};

export default CandidateValidations;