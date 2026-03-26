'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  owner: { id: string; name: string; email: string };
  members: Array<{ id: string; role: string; user: { id: string; name: string; email: string } }>;
  _count: { pages: number };
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpace, setNewSpace] = useState({ name: '', description: '', icon: '📄' });
  const [creating, setCreating] = useState(false);

  const fetchSpaces = async () => {
    try {
      const res = await fetch('/api/spaces');
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpace),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewSpace({ name: '', description: '', icon: '📄' });
        fetchSpaces();
      }
    } catch (error) {
      console.error('Failed to create space:', error);
    } finally {
      setCreating(false);
    }
  };

  const commonEmojis = ['📄', '🚀', '💡', '📚', '🏢', '🎯', '🔥', '⚡', '🌟', '💼', '🎨', '📊'];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Spaces</h1>
          <p className="text-gray-500 mt-1">Manage your workspaces</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Space
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="text-4xl mb-4">🏗️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No spaces yet</h3>
          <p className="text-gray-500 mb-6">Create your first space to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Create Space
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <Link
              key={space.id}
              href={`/spaces/${space.id}`}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{space.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 truncate transition-colors">
                    {space.name}
                  </h3>
                  {space.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{space.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>{space._count.pages} pages</span>
                    <span>·</span>
                    <span>{space.members.length} members</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Space</h2>
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewSpace({ ...newSpace, icon: emoji })}
                      className={`text-xl p-2 rounded-lg border-2 transition-colors ${
                        newSpace.icon === emoji
                          ? 'border-gray-900 bg-gray-100'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSpace.name}
                  onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="My Workspace"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newSpace.description}
                  onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  rows={3}
                  placeholder="What is this space for?"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
