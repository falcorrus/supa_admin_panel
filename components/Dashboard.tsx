
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { getTables } from '../services/supabase';
import Header from './Header';
import Sidebar from './Sidebar';
import DataTable from './DataTable';
import Settings from './Settings';
import { Table, SortConfig } from '../types';
import Spinner from './Spinner';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

interface DashboardProps {
  session: Session;
}

// Префикс для ключа
const TABLE_VISIBILITY_STORAGE_KEY_PREFIX = 'supabaseAdminTableVisibility';

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'tables' | 'settings'>('tables');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tableVisibility, setTableVisibility] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();
  const [sortConfigs, setSortConfigs] = useState<Record<string, SortConfig>>({});

  // Загрузка настроек при запуске
  useEffect(() => {
    const visibilityKey = `${TABLE_VISIBILITY_STORAGE_KEY_PREFIX}_${session.user.id}`;
    const savedVisibility = localStorage.getItem(visibilityKey);
    console.log('Loading table visibility from localStorage with key:', visibilityKey, savedVisibility);
    
    if (savedVisibility) {
      try {
        const parsedVisibility: Record<string, boolean> = JSON.parse(savedVisibility);
        setTableVisibility(parsedVisibility);
      } catch (e) {
        console.error('Error parsing table visibility from localStorage', e);
        // If parsing fails, initialize all tables as visible
        const initialVisibility: Record<string, boolean> = {};
        tables.forEach(table => {
          initialVisibility[table.table_name] = true;
        });
        setTableVisibility(initialVisibility);
      }
    }
  }, [session.user.id]);

  // Update table visibility when tables list changes (to add new tables as visible)
  useEffect(() => {
    if (tables.length > 0) {
      const visibilityKey = `${TABLE_VISIBILITY_STORAGE_KEY_PREFIX}_${session.user.id}`;
      const savedVisibility = localStorage.getItem(visibilityKey);
      
      setTableVisibility(prev => {
        const newVisibility = { ...prev };
        
        // Add any new tables that weren't in the previous state
        tables.forEach(table => {
          if (!(table.table_name in newVisibility)) {
            newVisibility[table.table_name] = true; // New tables are visible by default
          }
        });
        
        // Remove any tables that no longer exist
        Object.keys(newVisibility).forEach(tableName => {
          if (!tables.some(table => table.table_name === tableName)) {
            delete newVisibility[tableName];
          }
        });
        
        return newVisibility;
      });
    }
  }, [tables, session.user.id]);

  // Сохранение изменений
  useEffect(() => {
    if (Object.keys(tableVisibility).length > 0) {
      const visibilityKey = `${TABLE_VISIBILITY_STORAGE_KEY_PREFIX}_${session.user.id}`;
      console.log('Saving table visibility to localStorage with key:', visibilityKey, tableVisibility);
      localStorage.setItem(visibilityKey, JSON.stringify(tableVisibility));
    }
  }, [tableVisibility, session.user.id]); // Срабатывает при изменении видимости

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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleTableVisibility = (tableName: string) => {
    setTableVisibility(prev => ({
      ...prev,
      [tableName]: !prev[tableName] // Toggle the visibility state
    }));
  };

  const handleSortChange = (tableName: string, config: SortConfig) => {
    setSortConfigs(prev => ({
      ...prev,
      [tableName]: config,
    }));
  };

  // Filter and order tables for the sidebar
  const visibleTables = useMemo(() => {
    // Get saved table order from localStorage
    const savedOrder = localStorage.getItem('tableOrder');
    let orderMap: { [key: string]: number } = {};
    if (savedOrder) {
      try {
        orderMap = JSON.parse(savedOrder);
      } catch (e) {
        console.error('Error parsing table order from localStorage', e);
      }
    }
    
    // Filter out hidden tables and sort by saved order
    return tables
      .filter(table => tableVisibility[table.table_name] !== false) // Only show tables that are not explicitly set to false
      .sort((a, b) => (orderMap[a.table_name] || Infinity) - (orderMap[b.table_name] || Infinity));
  }, [tables, tableVisibility]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <Sidebar
        tables={visibleTables}
        selectedTable={selectedTable}
        selectedView={selectedView}
        onSelectTable={setSelectedTable}
        onSelectView={setSelectedView}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        loading={loading}
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-0' : 'ml-0'}`}>
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
          ) : selectedView === 'settings' ? (
            <Settings 
              user={session.user} 
              tables={tables}
              tableVisibility={tableVisibility}
              toggleTableVisibility={toggleTableVisibility}
            />
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
