/**
 * @file WorkerTokenModal.tsx
 * @module components
 * @description Bridge component — delegates to the global WorkerTokenCredentialModal
 * via the 'open-worker-token-modal' custom event. Keeps the existing prop interface
 * so all callers work without changes.
 */

import React, { useEffect } from 'react';

export interface WorkerTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenGenerated?: (token: string) => void;
}

const WorkerTokenModal: React.FC<WorkerTokenModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(
        new CustomEvent('open-worker-token-modal', { detail: { source: 'WorkerTokenModal' } })
      );
      onClose();
    }
  }, [isOpen, onClose]);

  // Rendering is handled globally by WorkerTokenCredentialModal in App.tsx
  return null;
};

export { WorkerTokenModal };
export default WorkerTokenModal;
