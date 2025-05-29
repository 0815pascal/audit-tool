import React, { useEffect } from 'react';
import { ToastType, ComponentProps } from '../../types/types';
import { TOAST_TYPE, TOAST_BG_COLOR_ENUM, TIME_MS_ENUM } from '../../enums';

interface ToastProps extends Omit<ComponentProps<HTMLDivElement>, 'children'> {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = TOAST_TYPE.SUCCESS,
  duration = TIME_MS_ENUM.TOAST_DURATION,
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
        return TOAST_BG_COLOR_ENUM.SUCCESS;
      case TOAST_TYPE.ERROR:
        return TOAST_BG_COLOR_ENUM.ERROR;
      case TOAST_TYPE.WARNING:
        return TOAST_BG_COLOR_ENUM.WARNING;
      case TOAST_TYPE.INFO:
        return TOAST_BG_COLOR_ENUM.INFO;
      default:
        return TOAST_BG_COLOR_ENUM.SUCCESS;
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