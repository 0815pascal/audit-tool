import React from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => (
  <div className="card mb-4">
    <h2 className="text-left">{title}</h2>
    <p className="text-left">{message}</p>
  </div>
); 