import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { connectionManager, Connection } from '../services/connectionManager';

interface DashboardProps {
  session: Session;
}

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
  const [tablesFetchMethod, setTablesFetchMethod] = useState<string | null>(null);
  const [userConnections, setUserConnections] = useState<Connection[]>([]);
  const [activeConnectionName, setActiveConnectionName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadConnectionsAndSetInitial = async () => {
      setLoading(true);
      try {
        const connections = await connectionManager.getConnections();
        setUserConnections(connections);

        if (connections.length === 0) {
          navigate('/setup');
          return;
        }

        const lastActiveKey = `supabaseAdminLastActiveConnection_${session.user.id}`;
        const savedActiveConnectionName = localStorage.getItem(lastActiveKey);
        let connectionToActivate = connections[0].connection_name;

        if (savedActiveConnectionName && connections.some(c => c.connection_name === savedActiveConnectionName)) {
          connectionToActivate = savedActiveConnectionName;
        }

        await connectionManager.setActiveConnection(connectionToActivate);
        setActiveConnectionName(connectionToActivate);
        fetchTables();

      } catch (err: any) {
        setError(err.message || 'Failed to load connections.');
      } finally {
        setLoading(false);
      }
    };
    loadConnectionsAndSetInitial();
  }, [session.user.id, navigate]);

  useEffect(() => {
    const visibilityKey = `${TABLE_VISIBILITY_STORAGE_KEY_PREFIX}_${session.user.id}`;
    const savedVisibility = localStorage.getItem(visibilityKey);
    if (savedVisibility) {
      try {
        const parsedVisibility: Record<string, boolean> = JSON.parse(savedVisibility);
        setTableVisibility(parsedVisibility);
        
        const values = Object.values(parsedVisibility);
        const allTrue = values.every(v => v === true);
        const allFalse = values.every(v => v === false);
        
        if (allTrue) {
          setVisibilityMode('all');
        } else if (allFalse) {
          setVisibilityMode('none');
        } else {
          setVisibilityMode('custom');
          setCustomTableVisibility(parsedVisibility);
        }
      } catch (e) {
        console.error('Error parsing table visibility from localStorage', e);
        const initialVisibility: Record<string, boolean> = {};
        tables.forEach(table => {
          initialVisibility[table.table_name] = true;
        });
        setTableVisibility(initialVisibility);
        setVisibilityMode('all');
      }
    } else {
        const initialVisibility: Record<string, boolean> = {};
        tables.forEach(table => {
          initialVisibility[table.table_name] = true;
        });
        setTableVisibility(initialVisibility);
        setVisibilityMode('all');
    }
  }, [session.user.id, tables]);

  useEffect(() => {
    if (tables.length > 0) {
      setTableVisibility(prev => {
        const newVisibility = { ...prev };
        let changed = false;

        tables.forEach(table => {
          if (!(table.table_name in newVisibility)) {
            newVisibility[table.table_name] = true;
            changed = true;
          }
        });

        Object.keys(newVisibility).forEach(tableName => {
          if (!tables.some(table => table.table_name === tableName)) {
            delete newVisibility[tableName];
            changed = true;
          }
        });

        return changed ? newVisibility : prev;
      });

      if (customTableVisibility) {
        setCustomTableVisibility(prev => {
          if (!prev) return null;

          const newCustomVisibility = { ...prev };
          let changed = false;

          tables.forEach(table => {
            if (!(table.table_name in newCustomVisibility)) {
              newCustomVisibility[table.table_name] = true;
              changed = true;
            }
          });

          Object.keys(newCustomVisibility).forEach(tableName => {
            if (!tables.some(table => table.table_name === tableName)) {
              delete newCustomVisibility[tableName];
              changed = true;
            }
          });

          return changed ? newCustomVisibility : prev;
        });
      }
    }
  }, [tables, session.user.id]); // Removed customTableVisibility from dependencies to break the cycle

  useEffect(() => {
    if (Object.keys(tableVisibility).length > 0) {
      const visibilityKey = `${TABLE_VISIBILITY_STORAGE_KEY_PREFIX}_${session.user.id}`;
      localStorage.setItem(visibilityKey, JSON.stringify(tableVisibility));
    }
  }, [tableVisibility, session.user.id]);
  
  useEffect(() => {
    const selectedTableKey = `supabaseAdminSelectedTable_${session.user.id}`;
    if (selectedTable) {
      localStorage.setItem(selectedTableKey, selectedTable);
    } else {
      localStorage.removeItem(selectedTableKey);
    }
  }, [selectedTable, session.user.id]);

  const fetchTables = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Set the method being used - since we're using the RPC function, set it to that
      setTablesFetchMethod('RPC-функция (get_user_tables)');
      
      // Add a small delay to ensure connection change has been processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now getTables should use the active connection
      const data = await getTables();
      setTables(data || []);
      
      if (!data || data.length === 0) {
        // This case should ideally be handled by the connection management useEffect
        // but keeping it here as a fallback or for when connections are removed
        navigate('/setup');
        return;
      }

      if (data && data.length > 0) {
        const selectedTableKey = `supabaseAdminSelectedTable_${session.user.id}`;
        const savedSelectedTable = localStorage.getItem(selectedTableKey);
        
        // Check if the currently selected table exists in the new data
        const currentTableExists = selectedTable && data.some(table => table.table_name === selectedTable);
        const savedTableExists = savedSelectedTable && data.some(table => table.table_name === savedSelectedTable);
        
        // If current selected table doesn't exist in the new connection
        if (!currentTableExists) {
          // First try to restore the saved selected table if it exists in the new connection
          if (savedTableExists) {
            setSelectedTable(savedSelectedTable);
          } else {
            // Otherwise, select the first table of the new connection
            setSelectedTable(data[0].table_name);
          }
        } else if (selectedTable !== savedSelectedTable && savedTableExists) {
          // If current table exists but is different from saved table, update if saved exists
          setSelectedTable(savedSelectedTable);
        }
      } else {
        setSelectedTable(null);
      }
    } catch (err: any) {
        setError(err.message || 'Произошла неизвестная ошибка при получении таблиц.');
        // In case of an error, we might also clear the method info
        setTablesFetchMethod(null);
    } finally {
      setLoading(false);
    }
  }, [selectedTable, session.user.id, navigate]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleTableVisibility = (tableName: string) => {
    setTableVisibility(prev => {
      const newVisibility = {
        ...prev,
        [tableName]: !prev[tableName]
      };
      return newVisibility;
    });
    
    setVisibilityMode('custom');
    
    setCustomTableVisibility(prev => {
      if (!prev) {
        return { ...tableVisibility, [tableName]: !tableVisibility[tableName] };
      }
      return {
        ...prev,
        [tableName]: !prev[tableName]
      };
    });
  };

  const toggleAllTables = (show: boolean) => {
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
    
    setVisibilityMode(show ? 'all' : 'none');
  };
  
  const cycleVisibilityMode = () => {
    if (visibilityMode === 'all') {
      toggleAllTables(false);
    } else if (visibilityMode === 'none') {
      if (customTableVisibility && Object.keys(customTableVisibility).length > 0) {
        setTableVisibility(customTableVisibility);
        setVisibilityMode('custom');
      } else {
        toggleAllTables(true);
      }
    } else { // custom
      toggleAllTables(true);
    }
  };

  const handleSortChange = (tableName: string, config: SortConfig) => {
    setSortConfigs(prev => ({
      ...prev,
      [tableName]: config,
    }));
  };

  const visibleTables = useMemo(() => {
    const savedOrder = localStorage.getItem('tableOrder');
    let orderMap: { [key: string]: number } = {};
    if (savedOrder) {
      try {
        orderMap = JSON.parse(savedOrder);
      } catch (e) {
        console.error('Error parsing table order from localStorage', e);
      }
    }
    
    return tables
      .filter(table => tableVisibility[table.table_name] !== false)
      .sort((a, b) => (orderMap[a.table_name] || Infinity) - (orderMap[b.table_name] || Infinity));
  }, [tables, tableVisibility]);

  const handleSetActiveConnection = useCallback(async (name: string) => {
    try {
      // Re-fetch connections to ensure the connection list is current
      const currentConnections = await connectionManager.getConnections();
      setUserConnections(currentConnections);
      
      // Verify that the connection exists before setting it as active
      const connectionExists = currentConnections.some(conn => conn.connection_name === name);
      if (!connectionExists) {
        throw new Error(`Connection ${name} not found in the connection list`);
      }
      
      await connectionManager.setActiveConnection(name);
      setActiveConnectionName(name);
      const lastActiveKey = `supabaseAdminLastActiveConnection_${session.user.id}`;
      localStorage.setItem(lastActiveKey, name);
      
      // Clear the currently selected table to ensure proper refresh
      setSelectedTable(null);
      
      // Force re-fetch tables for the new active connection
      await fetchTables();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to set active connection.');
    }
  }, [session.user.id, fetchTables, showToast, setUserConnections]);

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
        userConnections={userConnections}
        activeConnectionName={activeConnectionName}
        onSetActiveConnection={handleSetActiveConnection}
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-0' : 'ml-0'}`}>
        <Header user={session.user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-4 sm:p-6">
          {error && error !== 'No active connection' ? (
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
          ) : loading || error === 'No active connection' ? (
             <div className="flex items-center justify-center h-full">
                <Spinner />
             </div>
          ) : selectedView === 'settings' ? (
            <Settings 
              user={session.user} 
              tables={tables}
              tableVisibility={tableVisibility}
              customTableVisibility={customTableVisibility}
              visibilityMode={visibilityMode}
              toggleTableVisibility={toggleTableVisibility}
              cycleVisibilityMode={cycleVisibilityMode}
              tablesFetchMethod={tablesFetchMethod}
              onSetActiveConnection={handleSetActiveConnection}
            />
          ) : selectedTable ? (
            <DataTable 
              key={selectedTable} 
              tableName={selectedTable} 
              showToast={showToast} 
              sortConfig={sortConfigs[selectedTable] || null}
              onSortChange={(config) => handleSortChange(selectedTable, config)}
            />
          ) : tables.length > 0 ? (
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
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
