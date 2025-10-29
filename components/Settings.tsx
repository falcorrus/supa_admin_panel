import React, { useMemo, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseClient';
import { Table } from '../types';
import { VisibilityAllIcon, VisibilityNoneIcon, VisibilityMixedIcon } from './Icons';
import { connectionManager, Connection } from '../services/connectionManager';
import ConnectionList from './ConnectionList';
import ConnectionForm from './ConnectionForm';
import Spinner from './Spinner';

interface SettingsProps {
  user: User | null;
  tables: Table[];
  tableVisibility: Record<string, boolean>;
  customTableVisibility: Record<string, boolean> | null;
  visibilityMode: 'all' | 'none' | 'custom';
  toggleTableVisibility: (tableName: string) => void;
  cycleVisibilityMode: () => void;
  tablesFetchMethod: string | null;
  onSetActiveConnection: (name: string) => void; // Function to handle setting active connection
}

const Settings: React.FC<SettingsProps> = ({ user, tables, tableVisibility, customTableVisibility, visibilityMode, toggleTableVisibility, cycleVisibilityMode, tablesFetchMethod, onSetActiveConnection }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tableVisibility');
  const [connectionToActivate, setConnectionToActivate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true);
      const conns = await connectionManager.getConnections();
      setConnections(conns);
      const activeConnName = localStorage.getItem('activeSupabaseConnection');
      if (activeConnName) {
        connectionManager.setActiveConnection(activeConnName);
        setActiveConnection(activeConnName);
      } else if (conns.length > 0) {
        connectionManager.setActiveConnection(conns[0].connection_name);
        setActiveConnection(conns[0].connection_name);
      }
      setLoading(false);
    };
    fetchConnections();
  }, []);

  const handleAddConnection = async (name: string, url: string, anonKey: string, serviceRoleKey?: string) => {
    await connectionManager.addConnection(name, url, anonKey, serviceRoleKey);
    const conns = await connectionManager.getConnections();
    setConnections(conns);
  };

  const handleRemoveConnection = async (id: string) => {
    await connectionManager.removeConnection(id);
    const conns = await connectionManager.getConnections();
    setConnections(conns);
  };

  const handleSetActiveConnection = async (name: string) => {
    setConnectionToActivate(name);
  };
  
  const confirmSetActiveConnection = async () => {
    if (connectionToActivate) {
      try {
        // Re-fetch connections to ensure the list is current
        const currentConnections = await connectionManager.getConnections();
        setConnections(currentConnections);
        
        // Verify that the connection exists before setting it as active
        const connectionExists = currentConnections.some(conn => conn.connection_name === connectionToActivate);
        if (!connectionExists) {
          throw new Error(`Connection ${connectionToActivate} not found in the connection list`);
        }
        
        await connectionManager.setActiveConnection(connectionToActivate);
        setActiveConnection(connectionToActivate);
        localStorage.setItem('activeSupabaseConnection', connectionToActivate);
        // Call the parent-provided function to handle connection change with table refresh
        onSetActiveConnection(connectionToActivate);
        setConnectionToActivate(null);
      } catch (error) {
        console.error('Error setting active connection:', error);
        // Show error to user
        alert(error instanceof Error ? error.message : 'Failed to set active connection');
        setConnectionToActivate(null);
      }
    }
  };
  
  const cancelSetActiveConnection = () => {
    setConnectionToActivate(null);
  };



  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const visibilityState = useMemo(() => {
    return visibilityMode;
  }, [visibilityMode]);

  const toggleAllVisibility = () => {
    cycleVisibilityMode();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tableVisibility':
        return (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Видимость таблиц</h2>
              <button
                onClick={toggleAllVisibility}
                className="p-2 rounded-md hover:bg-gray-700 transition-colors"
                title={
                  visibilityState === 'all' ? 'Скрыть все' :
                  visibilityState === 'none' ? 'Показать все' : 'Скрыть все'
                }
              >
                {visibilityState === 'all' ? (
                  <VisibilityAllIcon className="w-6 h-6 text-emerald-400" />
                ) : visibilityState === 'none' ? (
                  <VisibilityNoneIcon className="w-6 h-6 text-gray-400" />
                ) : (
                  <VisibilityMixedIcon className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
            <p className="text-gray-400 mb-4">Нажмите на таблицу, чтобы скрыть/показать в боковой панели</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tables.map((table) => (
                <button
                  key={table.table_name}
                  onClick={() => toggleTableVisibility(table.table_name)}
                  className={`px-4 py-2 rounded-md text-left font-medium transition-colors ${
                    tableVisibility[table.table_name] === false
                      ? 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {table.table_name}
                </button>
              ))}
            </div>
          </div>
        );
      case 'info':
        return (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Информация</h2>
            <div className="mb-6 p-4 bg-gray-700 rounded-md">
              <p className="text-gray-300">
                <span className="font-semibold text-emerald-400">Способ получения таблиц:</span> {tablesFetchMethod || 'Неизвестен'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {tablesFetchMethod === 'Сервисный ключ'
                  ? 'Используется сервисный ключ для прямого доступа к information_schema.'
                  : tablesFetchMethod === 'RPC-функция (get_user_tables)'
                    ? 'Используется RPC-функция get_user_tables для получения списка таблиц.'
                    : 'Не удалось определить способ получения таблиц.'}
              </p>
            </div>
          </div>
        );
      case 'connections':
        return (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">Добавить новое подключение</h3>
                <ConnectionForm onAddConnection={handleAddConnection} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Существующие подключения</h3>
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Spinner />
                  </div>
                ) : (
                  <ConnectionList
                    connections={connections}
                    activeConnection={activeConnection}
                    onSetActive={handleSetActiveConnection}
                    onRemove={handleRemoveConnection}
                  />
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Настройки</h1>
      
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('tableVisibility')}
          className={`px-4 py-2 text-lg font-medium ${activeTab === 'tableVisibility' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
        >
          Видимость таблиц
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-lg font-medium ${activeTab === 'info' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
        >
          Информация
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-2 text-lg font-medium ${activeTab === 'connections' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
        >
          Подключения
        </button>
      </div>

      {renderContent()}
      
      {/* Confirmation modal for switching connections */}
      {connectionToActivate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Подтверждение переключения</h3>
            <p className="text-gray-300 mb-6">
              Вы уверены, что хотите переключиться на подключение <span className="font-semibold text-emerald-400">{connectionToActivate}</span>?
              Текущая таблица будет обновлена в соответствии с новым подключением.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelSetActiveConnection}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmSetActiveConnection}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-white transition-colors"
              >
                Переключить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;