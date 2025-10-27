import React, { useState } from 'react';

interface ConnectionFormProps {
  onAddConnection: (name: string, url: string, anonKey: string, serviceRoleKey?: string) => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onAddConnection }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && url && anonKey) {
      onAddConnection(name, url, anonKey, serviceRoleKey);
      setName('');
      setUrl('');
      setAnonKey('');
      setServiceRoleKey('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-800 rounded-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Название</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Мой проект"
          required
        />
      </div>
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-300">URL</label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="https://xxxx.supabase.co"
          required
        />
      </div>
      <div>
        <label htmlFor="anonKey" className="block text-sm font-medium text-gray-300">Anon Key</label>
        <input
          type="text"
          id="anonKey"
          value={anonKey}
          onChange={(e) => setAnonKey(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="ey..."
          required
        />
      </div>
      <div>
        <label htmlFor="serviceRoleKey" className="block text-sm font-medium text-gray-300">Service Role Key (Optional)</label>
        <input
          type="text"
          id="serviceRoleKey"
          value={serviceRoleKey}
          onChange={(e) => setServiceRoleKey(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="ey..."
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-white font-semibold transition-colors"
      >
        Добавить
      </button>
    </form>
  );
};

export default ConnectionForm;