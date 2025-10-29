import React from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionForm from './ConnectionForm';
import { useToast } from '../hooks/useToast';
import { connectionManager } from '../services/connectionManager';

const Setup = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleAddConnection = async (name: string, url: string, anonKey: string, serviceRoleKey?: string) => {
    try {
      await connectionManager.addConnection(name, url, anonKey, serviceRoleKey);
      showToast('success', 'Connection added successfully!');
      navigate('/'); // Redirect to dashboard after successful connection
    } catch (error: any) {
      showToast('error', error.message || 'Failed to add connection.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md">
        <h2 className="text-2xl mb-4 text-center">Add Your First Database Connection</h2>
        <ConnectionForm onAddConnection={handleAddConnection} />
      </div>
    </div>
  );
};

export default Setup;
