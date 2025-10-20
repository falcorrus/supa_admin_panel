
export interface Table {
  table_name: string;
}

export interface Column {
  name: string;
  type: string;
}

export interface EditingCell {
  rowId: any;
  column: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;
