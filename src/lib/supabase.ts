import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

export const isProfileComplete = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', session.user.id);

    if (error || !profiles || profiles.length === 0) return false;
    
    const profile = profiles[0];
    return !!(profile && profile.full_name && profile.role);
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
};