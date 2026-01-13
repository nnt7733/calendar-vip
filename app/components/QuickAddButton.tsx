'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import QuickAddModal from './QuickAddModal';

export default function QuickAddButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = async () => {
    // Trigger a custom event to refresh all pages
    window.dispatchEvent(new CustomEvent('refresh-data'));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        Quick Add
      </button>
      <QuickAddModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

