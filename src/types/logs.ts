export interface ActionLog {
  id: string;
  user_id: string;
  action_type: 'create_candidate' | 'update_candidate' | 'validate_candidate' | 'reject_candidate' | 'override_candidate' | 'upload_document' | 'add_comment';
  entity_type: 'candidate' | 'document' | 'comment';
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
  user_profile?: {
    full_name: string;
    role: string;
  };
}