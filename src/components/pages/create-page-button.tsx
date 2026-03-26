'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';

interface CreatePageButtonProps {
  spaceId: string;
  parentId?: string;
  variant?: 'button' | 'link';
}

export default function CreatePageButton({ spaceId, parentId, variant = 'button' }: CreatePageButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, parentId, title: 'Untitled' }),
      });
      if (res.ok) {
        const page = await res.json();
        router.push(`/spaces/${spaceId}/pages/${page.id}`);
      }
    } catch (error) {
      console.error('Failed to create page:', error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'link') {
    return (
      <button
        onClick={handleCreate}
        disabled={loading}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
      >
        <PlusIcon className="w-3.5 h-3.5" />
        {loading ? 'Creating...' : 'New page'}
      </button>
    );
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm"
    >
      <PlusIcon className="w-4 h-4" />
      {loading ? 'Creating...' : 'New Page'}
    </button>
  );
}
