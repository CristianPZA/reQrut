import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Candidate, CandidateDocument, CandidateComment, CandidateValidation } from '../types/candidates';
import { FileDown, AlertTriangle, SendHorizontal } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Import components
import CandidateHeader from '../components/CandidateHeader';
import CandidateInfo from '../components/CandidateInfo';
import CandidateSituation from '../components/CandidateSituation';
import CandidateRecruitment from '../components/CandidateRecruitment';
import CandidateDocuments from '../components/CandidateDocuments';
import CandidateValidations from '../components/CandidateValidations';
import CandidateComments from '../components/CandidateComments';

const CandidateDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [comments, setComments] = useState<CandidateComment[]>([]);
  const [validations, setValidations] = useState<CandidateValidation[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('candidate_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.new) {
            setCandidate(payload.new as Candidate);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidate_validations',
          filter: `candidate_id=eq.${id}`
        },
        () => {
          fetchValidations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchValidations = async () => {
    if (!id) return;

    const { data } = await supabase
      .from('candidate_validations')
      .select(`
        *,
        user_profile:user_profiles(full_name, role)
      `)
      .eq('candidate_id', id)
      .order('created_at', { ascending: false });

    if (data) setValidations(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

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

        // Fetch candidate details
        const { data: candidateData } = await supabase
          .from('candidates')
          .select(`
            *,
            override_by (
              full_name,
              role
            ),
            hr_reference (
              full_name,
              role
            )
          `)
          .eq('id', id)
          .single();

        if (candidateData) setCandidate(candidateData);

        // Fetch documents
        const { data: documentsData } = await supabase
          .from('candidate_documents')
          .select('*')
          .eq('candidate_id', id)
          .order('created_at', { ascending: false });

        if (documentsData) setDocuments(documentsData);

        // Fetch comments
        const { data: commentsData } = await supabase
          .from('candidate_comments')
          .select(`
            *,
            user_profile:user_profiles(full_name, role)
          `)
          .eq('candidate_id', id)
          .order('created_at', { ascending: false });

        if (commentsData) setComments(commentsData);

        // Fetch validations
        const { data: validationsData } = await supabase
          .from('candidate_validations')
          .select(`
            *,
            user_profile:user_profiles(full_name, role)
          `)
          .eq('candidate_id', id)
          .order('created_at', { ascending: false });

        if (validationsData) setValidations(validationsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Une erreur est survenue lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmitCandidate = async () => {
    if (!candidate) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('candidates')
        .update({ 
          status: 'pending',
          submitted_at: new Date().toISOString(),
          hr_reference: session.user.id // Set HR reference to current user
        })
        .eq('id', candidate.id);

      if (updateError) throw updateError;

      setCandidate({
        ...candidate,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        hr_reference: session.user.id
      });
    } catch (err) {
      console.error('Error submitting candidate:', err);
      setError('Une erreur est survenue lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidationAdded = (validation: CandidateValidation) => {
    setValidations([validation, ...validations]);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!candidate) return;

    try {
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', candidate.id);

      if (updateError) throw updateError;

      setCandidate({
        ...candidate,
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating candidate status:', error);
      setError('Une erreur est survenue lors de la mise à jour du statut');
    }
  };

  const exportToPDF = () => {
    if (!candidate) return;

    const doc = new jsPDF();
    doc.save(`candidat-${candidate.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-8 text-center text-gray-600">
        Candidat non trouvé
      </div>
    );
  }

  const canUpload = userRole && (userRole === 'RH' || userRole === 'Manager');
  const canSubmit = userRole === 'RH' && candidate.status === 'draft';

  // Determine if user can validate based on role and technical position
  const canValidate = userRole && (
    userRole === 'Manager' ||
    (userRole === 'Sales') ||
    (userRole === 'Tech' && candidate.is_technical_position)
  );

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Header with actions */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <CandidateHeader candidate={candidate} />
          </div>
          <div className="flex gap-2">
            {canSubmit && (
              <button
                onClick={handleSubmitCandidate}
                disabled={submitting}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <SendHorizontal className="w-5 h-5 mr-2" />
                Soumettre la fiche
              </button>
            )}
            <button
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exporter en PDF
            </button>
          </div>
        </div>

        {candidate.status === 'rejected' && (
          <div className="bg-yellow-50 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-700">
              Ce candidat a été refusé. Seul un manager peut réactiver sa candidature.
            </p>
          </div>
        )}

        {/* Main content sections */}
        <CandidateInfo candidate={candidate} />
        <CandidateSituation candidate={candidate} />
        <CandidateRecruitment candidate={candidate} />
        <CandidateDocuments
          candidateId={candidate.id}
          documents={documents}
          onDocumentAdded={(doc) => setDocuments([doc, ...documents])}
          canUpload={canUpload}
        />
        
        {/* Only show validations if user can validate or there are existing validations */}
        {(canValidate || validations.length > 0) && (
          <CandidateValidations
            candidateId={candidate.id}
            validations={validations}
            isTechnicalPosition={candidate.is_technical_position}
            userRole={userRole}
            onValidationAdded={handleValidationAdded}
            onStatusChange={handleStatusChange}
          />
        )}

        <CandidateComments
          candidateId={candidate.id}
          comments={comments}
          onCommentAdded={(comment) => setComments([comment, ...comments])}
        />
      </div>
    </div>
  );
};

export default CandidateDetails;