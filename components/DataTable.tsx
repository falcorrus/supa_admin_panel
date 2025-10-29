
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getTableData, updateRow, deleteRow, insertRow } from '../services/supabase';
import { EditingCell, ToastType, SortConfig } from '../types';
import Spinner from './Spinner';
import { PlusIcon, TrashIcon, CheckIcon, XIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Textarea, FormControl, FormLabel } from '@chakra-ui/react';

interface DataTableProps {
  tableName: string;
  showToast: (message: string, type: ToastType) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

const DataTable: React.FC<DataTableProps> = ({ tableName, showToast, sortConfig, onSortChange }) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  // Состояния для модального окна
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCell, setModalCell] = useState<EditingCell | null>(null);
  const [modalValue, setModalValue] = useState<any>('');
  
  const primaryKey = 'id'; // Assumption: primary key is always 'id'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const tableData = await getTableData(tableName);
      setData(tableData);
      if (tableData.length > 0) {
        setColumns(Object.keys(tableData[0]));
      } else {
        setColumns([]);
      }
    } catch (err: any) {
      showToast(`Error fetching data for ${tableName}: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [tableName, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return data;
    }
    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    onSortChange({ key, direction });
  };

  const handleCellClick = (rowId: any, column: string, value: any) => {
    if (column === primaryKey) return; // Don't allow editing primary key
    
    // Проверяем, является ли значение длинным текстом (>30 символов)
    if (typeof value === 'string' && value.length > 30) {
      // Открываем модальное окно для длинных текстов
      setModalCell({ rowId, column });
      setModalValue(value);
      setIsModalOpen(true);
    } else {
      // Используем обычное редактирование для коротких текстов
      setEditingCell({ rowId, column });
      setEditValue(value);
    }
  };

  const handleSave = async () => {
    if (!editingCell) return;
    const { rowId, column } = editingCell;
    const originalRow = data.find(r => r[primaryKey] === rowId);
    
    if (!originalRow || originalRow[column] === editValue) {
      setEditingCell(null);
      return;
    }

    try {
      await updateRow(tableName, rowId, column, editValue);
      const newData = data.map(row => 
        row[primaryKey] === rowId ? { ...row, [column]: editValue } : row
      );
      setData(newData);
      showToast('Row updated successfully!', 'success');
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`, 'error');
    } finally {
      setEditingCell(null);
    }
  };

  const handleDelete = async (rowId: any) => {
    if (!window.confirm('Are you sure you want to delete this row?')) return;
    try {
      await deleteRow(tableName, rowId);
      setData(data.filter((row) => row[primaryKey] !== rowId));
      showToast('Row deleted successfully!', 'success');
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleAddNewRow = async () => {
    if (Object.values(newRowData).some(val => val === '')) {
      showToast('All fields must be filled to add a new row.', 'info');
      return;
    }
    try {
        const [insertedRow] = await insertRow(tableName, newRowData);
        if(insertedRow){
            setData([...data, insertedRow]);
            showToast('Row added successfully!', 'success');
        } else {
            throw new Error("Insert operation did not return the new row.");
        }
    } catch (err: any) {
        showToast(`Add failed: ${err.message}`, 'error');
    } finally {
        setIsAddingRow(false);
        setNewRowData({});
    }
  };
  
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditingCell(null);
  }

  const handleModalSave = async () => {
    if (!modalCell) return;
    
    try {
      await updateRow(tableName, modalCell.rowId, modalCell.column, modalValue);
      const newData = data.map(row => 
        row[primaryKey] === modalCell.rowId ? { ...row, [modalCell.column]: modalValue } : row
      );
      setData(newData);
      showToast('Row updated successfully!', 'success');
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`, 'error');
    } finally {
      setIsModalOpen(false);
      setModalCell(null);
    }
  };

  // Обновляем существующую функцию handleCellClick


  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalCell(null);
    setModalValue('');
  };

  const renderDisplayValue = (value: any) => {
    if (typeof value === 'string' && value.length > 50) {
      return `${value.substring(0, 50)}...`;
    }
    return String(value);
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  if (!data.length && !columns.length && !isAddingRow) return (
    <div className="text-center text-gray-400">
      <p>Table '{tableName}' is empty.</p>
    </div>
    );

  return (
    <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white capitalize">{tableName}</h2>
        <button 
          onClick={() => setIsAddingRow(true)}
          disabled={isAddingRow}
          className="flex items-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Row
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <button onClick={() => handleSort(col)} className="group flex items-center space-x-1 focus:outline-none">
                    <span>{col}</span>
                      {sortConfig?.key === col && (
                        <span className="text-gray-300">
                          {sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                        </span>
                      )}
                  </button>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {isAddingRow && (
              <tr className="bg-gray-700/50">
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap">
                    {col === primaryKey ? <span className="text-gray-500 italic">auto-generated</span> : (
                      <input
                        type="text"
                        value={newRowData[col] || ''}
                        onChange={(e) => setNewRowData({...newRowData, [col]: e.target.value})}
                        className="w-full bg-gray-600 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={col}
                      />
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={handleAddNewRow} className="text-green-400 hover:text-green-300"><CheckIcon className="w-5 h-5"/></button>
                    <button onClick={() => { setIsAddingRow(false); setNewRowData({}); }} className="text-red-400 hover:text-red-300"><XIcon className="w-5 h-5"/></button>
                  </div>
                </td>
              </tr>
            )}
            {sortedData.map((row, rowIndex) => (
              <tr key={row[primaryKey] || rowIndex} className="hover:bg-gray-700/50 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {editingCell?.rowId === row[primaryKey] && editingCell?.column === col ? (
                      <input 
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleEditKeyDown}
                        autoFocus
                        className="w-full bg-gray-600 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span 
                        onClick={() => handleCellClick(row[primaryKey], col, row[col])}
                        className={`block w-full h-full ${col !== primaryKey && 'cursor-pointer'}`}
                        title={typeof row[col] === 'string' && row[col].length > 50 ? row[col] : undefined}
                      >
                        {renderDisplayValue(row[col])}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(row[primaryKey])} className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded transition-colors">
                    <TrashIcon className="w-5 h-5"/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Модальное окно для редактирования длинных текстов */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Редактировать ячейку</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Значение</FormLabel>
              <Textarea
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                placeholder="Введите текст"
                size="lg"
                height="300px"
                bg="gray.700"
                borderColor="gray.600"
                _focus={{ borderColor: "emerald.500", boxShadow: "0 0 0 1px var(--chakra-colors-emerald-500)" }}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button bg="gray.700" color="white" _hover={{ bg: "gray.600" }} _active={{ bg: "gray.800" }} mr={3} onClick={handleModalClose}>
              Отмена
            </Button>
            <Button bg="green.600" color="white" _hover={{ bg: "green.500", transform: "scale(1.05)" }} _active={{ bg: "green.700", transform: "scale(0.98)" }} transition="all 0.2s ease-in-out" onClick={handleModalSave}>
              Сохранить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DataTable;
