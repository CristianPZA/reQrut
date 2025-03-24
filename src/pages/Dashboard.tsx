import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  full_name: string;
  role: string;
}

interface Reminder {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  completed: boolean;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch reminders
        const { data: remindersData, error: remindersError } = await supabase
          .from('reminders')
          .select('*')
          .or(`target_role.eq.${profileData.role},target_role.eq.all`)
          .order('due_date', { ascending: true });

        if (remindersError) throw remindersError;
        setReminders(remindersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors];
  };

  const toggleReminderStatus = async (reminderId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ completed: !currentStatus })
        .eq('id', reminderId);

      if (error) throw error;

      setReminders(reminders.map(reminder => 
        reminder.id === reminderId 
          ? { ...reminder, completed: !currentStatus }
          : reminder
      ));
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, {profile?.full_name}
          </h1>
          <p className="text-lg text-gray-600">
            Rôle : <span className="font-semibold">{profile?.role}</span>
          </p>
        </div>

        {/* Reminders Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold">Rappels et tâches</h2>
          </div>

          <div className="space-y-4">
            {reminders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>Aucun rappel pour le moment</p>
              </div>
            ) : (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-4 rounded-lg border ${
                    reminder.completed
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-200 hover:border-indigo-200'
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${reminder.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {reminder.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(reminder.priority)}`}>
                          {reminder.priority}
                        </span>
                      </div>
                      <p className={`text-sm ${reminder.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {reminder.message}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Échéance : {format(new Date(reminder.due_date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleReminderStatus(reminder.id, reminder.completed)}
                      className={`p-2 rounded-full transition-colors ${
                        reminder.completed
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Role-specific Sections */}
        {profile?.role === 'RH' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Tâches RH</h2>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              <p>Candidats en attente de traitement</p>
            </div>
          </div>
        )}

        {(profile?.role === 'Sales' || profile?.role === 'Tech') && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Validations en attente</h2>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              <p>Candidats à valider</p>
            </div>
          </div>
        )}

        {profile?.role === 'Manager' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Vue d'ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-600 font-medium">Candidats validés</p>
                <p className="text-2xl font-bold text-green-700">-</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-600 font-medium">En attente</p>
                <p className="text-2xl font-bold text-yellow-700">-</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-600 font-medium">Taux de conversion</p>
                <p className="text-2xl font-bold text-blue-700">-%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;