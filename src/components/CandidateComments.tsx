import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Send } from 'lucide-react';
import type { CandidateComment } from '../types/candidates';
import { supabase } from '../lib/supabase';
import { createLog } from '../lib/logs';

interface Props {
  candidateId: string;
  comments: CandidateComment[];
  onCommentAdded: (comment: CandidateComment) => void;
}

const CandidateComments = ({ candidateId, comments, onCommentAdded }: Props) => {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: comment, error } = await supabase
        .from('candidate_comments')
        .insert({
          candidate_id: candidateId,
          user_id: session.user.id,
          comment: newComment.trim()
        })
        .select(`
          *,
          user_profile:user_profiles(full_name, role)
        `)
        .single();

      if (error) throw error;

      await createLog(
        'add_comment',
        'comment',
        comment.id,
        { comment: newComment.trim() }
      );

      onCommentAdded(comment);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Commentaires</h2>
      <form onSubmit={handleAddComment} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-l-4 border-gray-200 pl-4 py-2">
            <p className="font-medium">
              {comment.user_profile?.full_name} ({comment.user_profile?.role})
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(comment.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
            <p className="mt-2 text-gray-700">{comment.comment}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            Aucun commentaire
          </p>
        )}
      </div>
    </div>
  );
};

export default CandidateComments;