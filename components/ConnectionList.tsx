import React from 'react';
import { KeyIcon } from './Icons';

interface Connection {
  name: string;
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

interface ConnectionListProps {
  connections: Connection[];
  activeConnection: string | null;
  onSetActive: (name: string) => void;
  onRemove: (name: string) => void;
}

const ConnectionList: React.FC<ConnectionListProps> = ({ connections, activeConnection, onSetActive, onRemove }) => {
  return (
    <ul className="space-y-3">
      {connections.map((connection) => (
        <li key={connection.name} className="p-4 bg-gray-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            {connection.serviceRoleKey && <KeyIcon className="w-5 h-5 mr-2 text-yellow-400" />}
            <div>
              <p className="font-semibold text-white">{connection.name}</p>
              <p className="text-sm text-gray-400">{connection.url}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {activeConnection === connection.name ? (
              <span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-200 rounded-full">Активное</span>
            ) : (
              <button
                onClick={() => onSetActive(connection.name)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors"
              >
                Активировать
              </button>
            )}
            <button
              onClick={() => onRemove(connection.name)}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
            >
              Удалить
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ConnectionList;