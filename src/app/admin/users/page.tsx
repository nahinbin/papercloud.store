"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Gravatar from "@/components/Gravatar";

interface UserRole {
  id: string;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface User {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  createdAt: string;
  roles?: UserRole[];
}

export default function UsersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: "", name: "", isAdmin: false });

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (authRes) => {
        if (authRes.ok) {
          const authData = await authRes.json();
          const user = authData.user;
          const permissions = authData.permissions || [];
          const admin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
          setIsAdmin(admin);
          
          // Check permissions - now available from auth response
          const canViewUsers = admin || permissions.includes("users.view");
          
          if (!canViewUsers) {
            router.push("/admin/unauthorized");
            return;
          }
          
          // Fetch users
          fetch("/api/admin/users")
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
              } else {
                setError("Failed to load users");
              }
            })
            .catch(() => setError("Failed to load users"))
            .finally(() => setLoading(false));
        } else {
          setIsAdmin(false);
          router.push("/admin/unauthorized");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/admin/unauthorized");
      });
  }, [router]);

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({
      username: user.username || "",
      name: user.name || "",
      isAdmin: user.isAdmin,
    });
  };

  const handleSave = async (userId: string) => {
    // Validate username format
    if (editForm.username && !/^[a-z0-9_]+$/.test(editForm.username)) {
      alert("Username can only contain lowercase letters, numbers, and underscores");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => u.id === userId ? data.user : u));
        setEditingId(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update user");
      }
    } catch (err) {
      alert("Failed to update user");
    }
  };

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <p className="text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <Link href="/admin" className="text-zinc-600 hover:text-black underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">User Management</h1>
              <p className="mt-2 text-zinc-600">Manage all platform users</p>
            </div>
            <Link
              href="/admin/roles"
              className="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors text-sm"
            >
              Manage Roles →
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
            {error}
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Username</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Admin</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Roles</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  {editingId === user.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={editForm.isAdmin}
                          onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        <span className="text-zinc-400">—</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSave(user.id)}
                          className="text-sm text-blue-600 hover:underline mr-3"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm text-zinc-600 hover:underline"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Gravatar
                            email={user.email}
                            username={user.username}
                            name={user.name}
                            size={32}
                          />
                          <Link
                            href={`/users/${user.username}`}
                            className="hover:underline"
                          >
                            @{user.username || "N/A"}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.name || "—"}</td>
                      <td className="px-4 py-3">{user.isAdmin ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((ur) => (
                              <Link
                                key={ur.id}
                                href="/admin/roles"
                                className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                title="Click to manage roles"
                              >
                                {ur.role.name}
                              </Link>
                            ))
                          ) : (
                            <span className="text-sm text-zinc-400">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <p className="mt-8 text-center text-zinc-600">No users found</p>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> To assign roles to users, go to{" "}
            <Link href="/admin/roles" className="underline font-medium">
              Roles Management
            </Link>{" "}
            and click "Manage Users" on any role.
          </p>
        </div>
      </div>
    </div>
  );
}

