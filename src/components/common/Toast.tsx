import React, { useEffect } from 'react';
import { ToastType, ComponentProps } from '../../types';
import { TOAST_TYPE } from '../../enums';

interface ToastProps extends Omit<ComponentProps<HTMLDivElement>, 'children'> {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = TOAST_TYPE.SUCCESS,
  duration = 3000,
  onClose,
  ...props
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case TOAST_TYPE.SUCCESS:
        return 'bg-green-500';
      case TOAST_TYPE.ERROR:
        return 'bg-red-500';
      case TOAST_TYPE.WARNING:
        return 'bg-yellow-500';
      case TOAST_TYPE.INFO:
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" {...props}>
      <div
        className={`${getBackgroundColor()} text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px]`}
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast; 