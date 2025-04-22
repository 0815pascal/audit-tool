import { ReactNode } from 'react';

interface DataTableProps<T> {
  title: string;
  emptyState: ReactNode;
  tableHeader: ReactNode;
  data: T[];
  renderRow: (item: T, index: number) => ReactNode;
  className?: string;
  useClassNameStyling?: boolean;
  showTitle?: boolean;
}

/**
 * A reusable data table component with standardized layout
 */
export const DataTable = <T,>({
  title,
  emptyState,
  tableHeader,
  data,
  renderRow,
  className = "mb-4",
  useClassNameStyling = false,
  showTitle = true
}: DataTableProps<T>) => {
  if (data.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className={`${className} w-100`} style={{ width: '100%' }}>
      {showTitle && <h2 className="text-left">{title}</h2>}
      <div 
        className={`${useClassNameStyling ? "table-responsive" : ""} w-100`}
        style={{ 
          overflowX: 'auto',
          width: '100%'
        }}
      >
        <table 
          className={`${useClassNameStyling ? "table table-bordered" : ""} w-100`}
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left'
          }}
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