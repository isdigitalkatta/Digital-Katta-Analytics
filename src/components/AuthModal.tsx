import React from 'react';
import { X } from 'lucide-react';
import { LoginScreen } from './LoginScreen';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCrm?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onNavigateToCrm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button on Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/60 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <LoginScreen
          isModalView={true}
          onSuccess={onClose}
          onCancel={onClose}
          onNavigateToCrm={() => {
            if (onNavigateToCrm) onNavigateToCrm();
            onClose();
          }}
        />
      </div>
    </div>
  );
};

