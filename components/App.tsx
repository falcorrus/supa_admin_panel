import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseClient';
import { ConnectionList } from './ConnectionList';
import Dashboard from './Dashboard';
import { Header } from './Header';
import Login from './Login';
import { Settings } from './Settings';
import { Sidebar } from './Sidebar';
import Registration from './Registration';
import Setup from './Setup';
import { Routes, Route, Navigate } from 'react-router-dom';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('App.tsx - initial session:', session);
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('App.tsx - onAuthStateChange event:', _event);
      console.log('App.tsx - onAuthStateChange session:', session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Routes>
        {session ? (
          <>
            <Route path="/dashboard" element={<Dashboard key={session.user.id} session={session} />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </div>
  );
};

export default App;