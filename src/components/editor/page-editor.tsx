'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon } from 'lucide-react';
import PlateEditor from './plate-editor';
import CreatePageButton from '../pages/create-page-button';

interface Page {
  id: string;
  title: string;
  content: string | null;
  icon: string | null;
  spaceId: string;
  parentId: string | null;
  parent: { id: string; title: string } | null;
  children: Array<{ id: string; title: string; icon: string | null }>;
  author: { id: string; name: string };
  updatedAt: string;
}

interface PageEditorProps {
  page: Page;
  canEdit: boolean;
  spaceId: string;
}

export default function PageEditor({ page, canEdit, spaceId }: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const titleSaveRef = useRef<ReturnType<typeof setTimeout>>();

  const saveContent = useCallback(
    async (content: string) => {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to save');
    },
    [page.id]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    clearTimeout(titleSaveRef.current);
    setSaveStatus('unsaved');
    titleSaveRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await fetch(`/api/pages/${page.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
      }
    }, 800);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this page? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/pages/${page.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push(`/spaces/${spaceId}`);
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link
            href={`/spaces/${spaceId}`}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          <span>/</span>
          {page.parent && (
            <>
              <Link
                href={`/spaces/${spaceId}/pages/${page.parent.id}`}
                className="hover:text-gray-700 transition-colors truncate max-w-32"
              >
                {page.parent.title}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-600 truncate max-w-48">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {saveStatus === 'saved' && '✓ Saved'}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'unsaved' && 'Unsaved changes'}
          </span>
          {canEdit && (
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete page"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Icon */}
          <div className="text-5xl mb-4">{page.icon || '📄'}</div>

          {/* Title */}
          {canEdit ? (
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="w-full text-4xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 mb-6"
              placeholder="Untitled"
            />
          ) : (
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{title}</h1>
          )}

          {/* Editor */}
          <PlateEditor
            initialContent={page.content}
            onSave={canEdit ? saveContent : undefined}
            readOnly={!canEdit}
          />

          {/* Subpages */}
          {page.children.length > 0 && (
            <div className="mt-12 border-t border-gray-100 pt-8">
              <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
                Subpages
              </h3>
              <div className="space-y-1">
                {page.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/spaces/${spaceId}/pages/${child.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <span>{child.icon || '📄'}</span>
                    <span>{child.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Add subpage button */}
          {canEdit && (
            <div className="mt-8">
              <CreatePageButton spaceId={spaceId} parentId={page.id} variant="link" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
