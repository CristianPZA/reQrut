import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Bell, Calendar, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Reminder {
  id: string;
  title: string;
  message: string;
  target_role: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  completed: boolean;
}

const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_role: 'all',
    priority: 'medium',
    due_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch reminders
        const { data: remindersData, error } = await supabase
          .from('reminders')
          .select('*')
          .order('due_date', { ascending: true });

        if (error) throw error;
        setReminders(remindersData || []);
      } catch (error) {
        console.error('Error fetching reminders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('reminders')
        .insert({
          ...formData,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setReminders([data, ...reminders]);
      setShowForm(false);
      setFormData({
        title: '',
        message: '',
        target_role: 'all',
        priority: 'medium',
        due_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      });
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
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

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors];
  };

  const canCreateReminders = userRole === 'RH' || userRole === 'Manager';

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold">Gestion des rappels</h1>
          </div>
          {canCreateReminders && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau rappel
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Créer un nouveau rappel</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle cible
                  </label>
                  <select
                    value={formData.target_role}
                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">Tous</option>
                    <option value="RH">RH</option>
                    <option value="Sales">Sales</option>
                    <option value="Tech">Tech</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'échéance
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Créer le rappel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-white rounded-lg shadow-sm p-6 ${
                reminder.completed ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-lg font-medium ${
                      reminder.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}>
                      {reminder.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(reminder.priority)}`}>
                      {reminder.priority}
                    </span>
                  </div>
                  
                  <p className={`mb-3 ${
                    reminder.completed ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {reminder.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(reminder.due_date), "d MMMM yyyy", { locale: fr })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(reminder.due_date), "HH:mm", { locale: fr })}
                    </div>
                    <div className="px-2 py-1 bg-gray-100 rounded-full">
                      {reminder.target_role === 'all' ? 'Tous' : reminder.target_role}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleReminderStatus(reminder.id, reminder.completed)}
                  className={`p-2 rounded-full transition-colors ${
                    reminder.completed
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}

          {reminders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Aucun rappel pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reminders;