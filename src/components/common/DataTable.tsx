import React, { ReactNode } from 'react';

interface DataTableProps {
  title: string;
  emptyState: ReactNode;
  tableHeader: ReactNode;
  data: any[];
  renderRow: (item: any, index: number) => ReactNode;
  className?: string;
  useClassNameStyling?: boolean;
}

/**
 * A reusable data table component with standardized layout
 */
export const DataTable: React.FC<DataTableProps> = ({
  title,
  emptyState,
  tableHeader,
  data,
  renderRow,
  className = "mb-4",
  useClassNameStyling = false
}) => {
  if (data.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className={`${className} left`}>
      <h2>{title}</h2>
      <div className={useClassNameStyling ? "table-responsive" : ""} 
           style={useClassNameStyling ? {} : { overflowX: 'auto' }}>
        <table 
          className={useClassNameStyling ? "table table-bordered" : ""}
          style={!useClassNameStyling ? {
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left'
          } : {}}
        >
          {tableHeader}
          <tbody>
            {data.map((item, index) => renderRow(item, index))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 