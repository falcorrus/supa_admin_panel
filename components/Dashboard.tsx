
import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { getTables } from '../services/supabase';
import Header from './Header';
import Sidebar from './Sidebar';
import DataTable from './DataTable';
import { Table, SortConfig } from '../types';
import Spinner from './Spinner';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

interface DashboardProps {
  session: Session;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();
  const [sortConfigs, setSortConfigs] = useState<Record<string, SortConfig>>({});

  const fetchTables = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getTables();
      setTables(data || []);
      if (data && data.length > 0) {
        setSelectedTable(data[0].table_name);
      } else {
        setSelectedTable(null);
      }
    } catch (err: any) {
        setError(err.message || 'Произошла неизвестная ошибка при получении таблиц.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSortChange = (tableName: string, config: SortConfig) => {
    setSortConfigs(prev => ({
      ...prev,
      [tableName]: config,
    }));
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <Sidebar
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        loading={loading}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-4 sm:p-6">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-gray-700 p-8 rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold text-red-400 mb-4">Произошла ошибка</h2>
                <p className="text-gray-300 max-w-md whitespace-pre-line">{error}</p>
                <button 
                  onClick={fetchTables}
                  className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-white font-semibold transition-colors"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          ) : loading ? (
             <div className="flex items-center justify-center h-full">
                <Spinner />
             </div>
          ) : selectedTable ? (
            <DataTable 
              key={selectedTable} 
              tableName={selectedTable} 
              showToast={showToast} 
              sortConfig={sortConfigs[selectedTable] || null}
              onSortChange={(config) => handleSortChange(selectedTable, config)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-400">Таблицы не найдены</h2>
                <p className="text-gray-500 mt-2">Не удалось найти таблицы в схеме 'public'.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
