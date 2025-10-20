
import React, { useEffect, useState } from 'react';
import { ToastType } from '../types';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      handleClose();
    }, 4500); // Start fade out before it's removed by the hook

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 500); // Wait for fade out animation
  };

  return (
    <div
      className={`fixed top-5 right-5 z-50 p-4 rounded-md shadow-lg flex items-center transition-all duration-500 ${toastStyles[type]} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
    >
      <span className="flex-grow">{message}</span>
      <button onClick={handleClose} className="ml-4 text-xl font-semibold">&times;</button>
    </div>
  );
};

export default Toast;
