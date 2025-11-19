import React, { useState } from 'react';
import { FaInfoCircle, FaCopy, FaCheck } from 'react-icons/fa';
import { GET_TABLES_SQL } from '../constants';

interface ConnectionFormProps {
  onAddConnection: (name: string, url: string, anonKey: string, serviceRoleKey?: string) => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onAddConnection }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [showSqlInstruction, setShowSqlInstruction] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const sqlCode = GET_TABLES_SQL;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="serviceRoleKey" className="block text-sm font-medium text-gray-300">Service Role Key (Optional)</label>
          <button
            type="button"
            onClick={() => setShowSqlInstruction(!showSqlInstruction)}
            className="text-gray-400 hover:text-white flex items-center text-xs transition-colors"
            title="Альтернативный способ подключения"
          >
            <FaInfoCircle className="mr-1" />
            Альтернатива: SQL
          </button>
        </div>
        <input
          type="text"
          id="serviceRoleKey"
          value={serviceRoleKey}
          onChange={(e) => setServiceRoleKey(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="ey..."
        />

        {showSqlInstruction && (
          <div className="mt-3 p-3 bg-gray-900 rounded-md border border-gray-600 text-sm">
            <p className="text-gray-300 mb-2">
              Если вы не хотите использовать Service Role Key, выполните этот SQL код в <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">SQL Editor</a> вашего проекта Supabase:
            </p>
            <div className="relative">
              <pre className="bg-black p-2 rounded text-xs text-gray-300 overflow-x-auto font-mono">
                {sqlCode}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1 bg-gray-700 rounded hover:bg-gray-600 text-white transition-colors"
                title="Копировать код"
              >
                {copied ? <FaCheck size={12} className="text-emerald-400" /> : <FaCopy size={12} />}
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Это создаст безопасную функцию для получения списка таблиц.
            </p>
          </div>
        )}
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