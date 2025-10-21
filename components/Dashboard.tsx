
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
  const [customTableVisibility, setCustomTableVisibility] = useState<Record<string, boolean> | null>(null);
  const [visibilityMode, setVisibilityMode] = useState<'all' | 'none' | 'custom'>('all');
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
        
        // Check if it's a custom selection by checking if it's neither all true nor all false
        const values = Object.values(parsedVisibility);
        const allTrue = values.every(v => v === true);
        const allFalse = values.every(v => v === false);
        
        if (allTrue) {
          setVisibilityMode('all');
        } else if (allFalse) {
          setVisibilityMode('none');
        } else {
          // This is a custom selection
          setVisibilityMode('custom');
          setCustomTableVisibility(parsedVisibility);
        }
      } catch (e) {
        console.error('Error parsing table visibility from localStorage', e);
        // If parsing fails, initialize all tables as visible
        const initialVisibility: Record<string, boolean> = {};
        tables.forEach(table => {
          initialVisibility[table.table_name] = true;
        });
        setTableVisibility(initialVisibility);
        setVisibilityMode('all');
      }
    } else {
        // If no saved visibility, default to all visible
        const initialVisibility: Record<string, boolean> = {};
        tables.forEach(table => {
          initialVisibility[table.table_name] = true;
        });
        setTableVisibility(initialVisibility);
        setVisibilityMode('all');
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
            // For new tables, use the current state if we have custom selection, else default to visible
            newVisibility[table.table_name] = customTableVisibility ? true : true; // Default to visible
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
      
      // Also update customTableVisibility if needed
      if (customTableVisibility) {
        setCustomTableVisibility(prev => {
          if (!prev) return null;
          
          const newCustomVisibility = { ...prev };
          
          // Add any new tables to custom selection
          tables.forEach(table => {
            if (!(table.table_name in newCustomVisibility)) {
              newCustomVisibility[table.table_name] = true; // New tables default to visible in custom selection
            }
          });
          
          // Remove any tables that no longer exist
          Object.keys(newCustomVisibility).forEach(tableName => {
            if (!tables.some(table => table.table_name === tableName)) {
              delete newCustomVisibility[tableName];
            }
          });
          
          return newCustomVisibility;
        });
      }
    }
  }, [tables, session.user.id, customTableVisibility]);

  // Сохранение изменений
  useEffect(() => {
    if (Object.keys(tableVisibility).length > 0) {
      const visibilityKey = `${TABLE_VISIBILITY_STORAGE_KEY_PREFIX}_${session.user.id}`;
      console.log('Saving table visibility to localStorage with key:', visibilityKey, tableVisibility);
      localStorage.setItem(visibilityKey, JSON.stringify(tableVisibility));
    }
  }, [tableVisibility, session.user.id]); // Срабатывает при изменении видимости
  
  // Save selected table to localStorage when it changes
  useEffect(() => {
    const selectedTableKey = `supabaseAdminSelectedTable_${session.user.id}`;
    if (selectedTable) {
      localStorage.setItem(selectedTableKey, selectedTable);
    } else {
      localStorage.removeItem(selectedTableKey); // Remove if no table is selected
    }
  }, [selectedTable, session.user.id]);

  // Load selected table from localStorage on mount
  useEffect(() => {
    const selectedTableKey = `supabaseAdminSelectedTable_${session.user.id}`;
    const savedSelectedTable = localStorage.getItem(selectedTableKey);
    
    if (savedSelectedTable && tables.some(table => table.table_name === savedSelectedTable)) {
      setSelectedTable(savedSelectedTable);
    } else if (tables.length > 0 && !selectedTable) {
      // If no saved table or it doesn't exist anymore, select the first one if available
      setSelectedTable(tables[0].table_name);
    }
  }, [session.user.id, tables]);

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
    setTableVisibility(prev => {
      const newVisibility = {
        ...prev,
        [tableName]: !prev[tableName] // Toggle the visibility state
      };
      return newVisibility;
    });
    
    // When a single table is toggled, we're now in custom mode
    setVisibilityMode('custom');
    
    // Save the custom visibility state
    setCustomTableVisibility(prev => {
      if (!prev) {
        // If no previous custom state, create one based on current state
        return { ...tableVisibility, [tableName]: !tableVisibility[tableName] };
      }
      return {
        ...prev,
        [tableName]: !prev[tableName] // Toggle the visibility state
      };
    });
  };

  const toggleAllTables = (show: boolean) => {
    // Save the current state as custom selection if we're in custom mode
    if (visibilityMode === 'custom' && !customTableVisibility) {
      setCustomTableVisibility({ ...tableVisibility });
    }
    
    setTableVisibility(prev => {
      const newVisibility = { ...prev };
      Object.keys(newVisibility).forEach(tableName => {
        newVisibility[tableName] = show;
      });
      return newVisibility;
    });
    
    // Update the visibility mode
    setVisibilityMode(show ? 'all' : 'none');
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
              visibilityMode={visibilityMode}
              toggleTableVisibility={toggleTableVisibility}
              toggleAllTables={toggleAllTables}
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
