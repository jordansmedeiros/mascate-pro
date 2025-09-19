import React from 'react';
import { cn } from '@/utils/cn';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  onSort?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className={cn('min-w-full divide-y divide-gray-200', className)}>
          {children}
        </table>
      </div>
    </div>
  );
};

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={cn('bg-gradient-to-r from-mascate-50 to-mascate-100', className)}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => {
  return (
    <tr 
      className={cn(
        'hover:bg-mascate-25 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<TableHeadProps> = ({ 
  children, 
  className, 
  sortable = false, 
  onSort 
}) => {
  return (
    <th 
      className={cn(
        'px-6 py-3 text-left text-xs font-bold text-mascate-800 uppercase tracking-wider',
        sortable && 'cursor-pointer hover:bg-mascate-200 transition-colors',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-1">
        {children}
        {sortable && (
          <svg 
            className="w-3 h-3 text-mascate-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" 
            />
          </svg>
        )}
      </div>
    </th>
  );
};

export const TableCell: React.FC<TableCellProps> = ({ children, className }) => {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}>
      {children}
    </td>
  );
};