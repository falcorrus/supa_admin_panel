
import React from 'react';
import { Table } from '../types';
import { TableIcon } from './Icons';
import Spinner from './Spinner';

interface SidebarProps {
  tables: Table[];
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ tables, selectedTable, onSelectTable, loading }) => {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Tables</h2>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : (
          tables.map((table) => (
            <button
              key={table.table_name}
              onClick={() => onSelectTable(table.table_name)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                selectedTable === table.table_name
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <TableIcon className="w-5 h-5 mr-3" />
              <span>{table.table_name}</span>
            </button>
          ))
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
