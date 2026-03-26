'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon, UserPlusIcon } from 'lucide-react';

interface Member {
  id: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  user: { id: string; name: string; email: string };
}

interface Space {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  ownerId: string;
  members: Member[];
}

export default function SpaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' });
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [saving, setSaving] = useState(false);

  const fetchSpace = useCallback(async () => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}`);
      if (res.ok) {
        const data = await res.json();
        setSpace(data);
        setFormData({ name: data.name, description: data.description || '', icon: data.icon });
      }
    } catch (error) {
      console.error('Failed to fetch space:', error);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchSpace();
        setEditing(false);
      }
    } catch (error) {
      console.error('Failed to save space:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (!confirm('Are you sure you want to delete this space? All pages will be lost.')) return;
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/spaces');
      }
    } catch (error) {
      console.error('Failed to delete space:', error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/spaces/${spaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      });
      if (res.ok) {
        setShowAddMember(false);
        setNewMemberEmail('');
        fetchSpace();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add member');
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the space?')) return;
    try {
      const res = await fetch(`/api/spaces/${spaceId}/members?memberId=${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSpace();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role }),
      });
      if (res.ok) {
        fetchSpace();
      }
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const commonEmojis = ['📄', '🚀', '💡', '📚', '🏢', '🎯', '🔥', '⚡', '🌟', '💼', '🎨', '📊'];

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  if (!space) {
    return <div className="p-8 text-red-500">Space not found</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/spaces/${spaceId}`}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Space Settings</h1>
      </div>

      {/* Space Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">General</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: emoji })}
                    className={`text-xl p-2 rounded-lg border-2 transition-colors ${
                      formData.icon === emoji
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="text-3xl">{space.icon}</div>
            <div>
              <div className="font-medium text-gray-900">{space.name}</div>
              {space.description && (
                <div className="text-sm text-gray-500 mt-1">{space.description}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Members ({space.members.length})</h2>
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <UserPlusIcon className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {showAddMember && (
          <form onSubmit={handleAddMember} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as 'EDITOR' | 'VIEWER')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
              >
                Add
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {space.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <div className="font-medium text-gray-900 text-sm">{member.user.name}</div>
                <div className="text-xs text-gray-400">{member.user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {member.role === 'OWNER' ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                    Owner
                  </span>
                ) : (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">
          Deleting this space will permanently remove all pages and their content.
        </p>
        <button
          onClick={handleDeleteSpace}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          <TrashIcon className="w-4 h-4" />
          Delete Space
        </button>
      </div>
    </div>
  );
}
