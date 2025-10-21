
import React, { useState, useEffect } from 'react';
import { Table } from '../types';
import { TableIcon, SettingsIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import Spinner from './Spinner';

interface SidebarProps {
  tables: Table[];
  selectedTable: string | null;
  selectedView: 'tables' | 'settings';
  onSelectTable: (tableName: string) => void;
  onSelectView: (view: 'tables' | 'settings') => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  tables, 
  selectedTable, 
  selectedView, 
  onSelectTable, 
  onSelectView, 
  isCollapsed,
  toggleSidebar,
  loading 
}) => {
  // Load table order from localStorage
  const [orderedTables, setOrderedTables] = useState<Table[]>(tables);
  
  useEffect(() => {
    // Load table order from localStorage on initial render
    const savedOrder = localStorage.getItem('tableOrder');
    if (savedOrder && tables.length > 0) {
      try {
        const orderMap: { [key: string]: number } = JSON.parse(savedOrder);
        // Sort tables based on saved order
        const sorted = [...tables].sort((a, b) => {
          const orderA = orderMap[a.table_name] !== undefined ? orderMap[a.table_name] : Infinity;
          const orderB = orderMap[b.table_name] !== undefined ? orderMap[b.table_name] : Infinity;
          return orderA - orderB;
        });
        setOrderedTables(sorted);
      } catch (e) {
        console.error('Error loading table order from localStorage', e);
        setOrderedTables(tables);
      }
    } else {
      setOrderedTables(tables);
    }
  }, [tables]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('opacity-50');
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('opacity-50');
    
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex !== dropIndex) {
      const newOrderedTables = [...orderedTables];
      const draggedTable = newOrderedTables[dragIndex];
      
      // Remove the dragged item
      newOrderedTables.splice(dragIndex, 1);
      // Insert it at the new position
      newOrderedTables.splice(dropIndex, 0, draggedTable);
      
      setOrderedTables(newOrderedTables);
      
      // Save new order to localStorage
      const orderMap: { [key: string]: number } = {};
      newOrderedTables.forEach((table, index) => {
        orderMap[table.table_name] = index;
      });
      localStorage.setItem('tableOrder', JSON.stringify(orderMap));
    }
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  if (isCollapsed) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed left-0 top-1/2 transform -translate-y-1/2 z-50 bg-gray-900 border border-gray-700 rounded-r-md p-2 text-gray-300 hover:bg-gray-800 transition-colors"
        aria-label="Expand sidebar"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 flex flex-col shadow-xl">
      <div className="px-4 py-5 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
        <h2 className="text-lg font-bold text-white tracking-wide">Navigation</h2>
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-emerald-400 transition-colors duration-200 p-1 rounded-md hover:bg-gray-700"
          aria-label="Collapse sidebar"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {orderedTables.map((table, index) => (
                <div
                  key={table.table_name}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className="cursor-move"
                >
                  <button
                    onClick={() => {
                      onSelectTable(table.table_name);
                      onSelectView('tables');
                    }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
                      selectedTable === table.table_name && selectedView === 'tables'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <TableIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{table.table_name}</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-auto border-t border-gray-700/50">
              <button
                onClick={() => onSelectView('settings')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
                  selectedView === 'settings'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <SettingsIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>Настройки</span>
              </button>
            </div>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
