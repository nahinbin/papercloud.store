"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingPageShell, Skeleton } from "@/components/LoadingSkeletons";
import Gravatar from "@/components/Gravatar";

interface Permission {
  key: string;
  name: string;
  description?: string;
  category: string;
}

interface RolePermission {
  id: string;
  permission: Permission;
}

interface User {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
}

interface UserRole {
  id: string;
  user: User;
}

interface UserRoleWithRole {
  id: string;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: RolePermission[];
  userRoles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
        toast.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
      }`}
    >
      <span>{toast.message}</span>
      <button onClick={onClose} className="text-current opacity-70 hover:opacity-100">
        ×
      </button>
    </div>
  );
}

export default function RolesPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, Permission[]>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [assigningUsers, setAssigningUsers] = useState<Role | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedPermissions: new Set<string>(),
  });

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
          const canViewRoles = admin || permissions.includes("roles.view");
          
          if (!canViewRoles) {
            router.push("/admin/unauthorized");
            return;
          }
          
          await Promise.all([fetchRoles(), fetchPermissions(), fetchAllUsers()]);
        } else {
          setIsAdmin(false);
          router.push("/admin/unauthorized");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/admin/unauthorized");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || {});
        setPermissionsByCategory(data.permissionsByCategory || {});
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissionKeys: Array.from(formData.selectedPermissions),
        }),
      });

      if (res.ok) {
        showToast("Role created successfully", "success");
        setShowCreateModal(false);
        setFormData({ name: "", description: "", selectedPermissions: new Set() });
        await fetchRoles();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create role", "error");
      }
    } catch (error) {
      showToast("Failed to create role", "error");
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      const res = await fetch(`/api/admin/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissionKeys: Array.from(formData.selectedPermissions),
        }),
      });

      if (res.ok) {
        showToast("Role updated successfully", "success");
        setEditingRole(null);
        setFormData({ name: "", description: "", selectedPermissions: new Set() });
        await fetchRoles();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update role", "error");
      }
    } catch (error) {
      showToast("Failed to update role", "error");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role? Users with this role will lose access.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Role deleted successfully", "success");
        await fetchRoles();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete role", "error");
      }
    } catch (error) {
      showToast("Failed to delete role", "error");
    }
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      selectedPermissions: new Set(role.permissions.map((rp) => rp.permission.key)),
    });
  };

  const togglePermission = (key: string) => {
    setFormData((prev) => {
      const newSet = new Set(prev.selectedPermissions);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return { ...prev, selectedPermissions: newSet };
    });
  };

  const handleAssignUsers = (role: Role) => {
    setAssigningUsers(role);
    setSelectedUserIds(role.userRoles.map(ur => ur.user.id));
  };

  const handleSaveUserAssignments = async () => {
    if (!assigningUsers) return;

    try {
      // Get all users that need updates (added or removed)
      const currentUserIds = assigningUsers.userRoles.map(ur => ur.user.id);
      const usersToAdd = selectedUserIds.filter(id => !currentUserIds.includes(id));
      const usersToRemove = currentUserIds.filter(id => !selectedUserIds.includes(id));

      // Update users who need the role added
      for (const userId of usersToAdd) {
        const userRes = await fetch(`/api/admin/users/${userId}/roles`);
        if (userRes.ok) {
          const userData = await userRes.json();
          const currentRoleIds = userData.user.roles?.map((ur: UserRoleWithRole) => ur.role.id) || [];
          const newRoleIds = [...currentRoleIds, assigningUsers.id];
          
          await fetch(`/api/admin/users/${userId}/roles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleIds: newRoleIds }),
          });
        }
      }

      // Update users who need the role removed
      for (const userId of usersToRemove) {
        const userRes = await fetch(`/api/admin/users/${userId}/roles`);
        if (userRes.ok) {
          const userData = await userRes.json();
          const currentRoleIds = userData.user.roles?.map((ur: UserRoleWithRole) => ur.role.id) || [];
          const newRoleIds = currentRoleIds.filter((id: string) => id !== assigningUsers.id);
          
          await fetch(`/api/admin/users/${userId}/roles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleIds: newRoleIds }),
          });
        }
      }

      showToast("Users assigned successfully", "success");
      setAssigningUsers(null);
      setSelectedUserIds([]);
      await fetchRoles();
    } catch (error) {
      console.error("Error assigning users:", error);
      showToast("Failed to assign users", "error");
    }
  };

  if (loading || isAdmin === null) {
    return (
      <LoadingPageShell title="Admin" subtitle="Loading roles" widthClassName="max-w-7xl">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </LoadingPageShell>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Role Management</h1>
            <p className="mt-2 text-zinc-600">Create and manage custom roles with specific permissions</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <button
              onClick={() => {
                setShowCreateModal(true);
                setEditingRole(null);
                setFormData({ name: "", description: "", selectedPermissions: new Set() });
              }}
              className="px-4 py-2 rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors"
            >
              + Create Role
            </button>
          </div>
        </div>

        {/* Roles List */}
        <div className="grid grid-cols-1 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-zinc-900">{role.name}</h2>
                    {role.isSystem && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-zinc-600 mb-3">{role.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span>{role.permissions.length} permissions</span>
                    <span>•</span>
                    <span>{role.userRoles.length} users</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!role.isSystem && (
                    <>
                      <button
                        onClick={() => openEditModal(role)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <h3 className="text-sm font-medium text-zinc-700 mb-3">Permissions:</h3>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((rp) => (
                    <span
                      key={rp.id}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700"
                    >
                      {rp.permission.name}
                    </span>
                  ))}
                  {role.permissions.length === 0 && (
                    <span className="text-sm text-zinc-400">No permissions assigned</span>
                  )}
                </div>
              </div>

              {/* Users with this role */}
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-700">
                    Users with this role ({role.userRoles.length})
                  </h3>
                  <button
                    onClick={() => handleAssignUsers(role)}
                    className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    {role.userRoles.length > 0 ? "Manage Users" : "Assign Users"}
                  </button>
                </div>
                {role.userRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {role.userRoles.map((ur) => (
                      <Link
                        key={ur.id}
                        href={`/users/${ur.user.username || ur.user.id}`}
                        className="flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        <Gravatar
                          email={ur.user.email}
                          username={ur.user.username}
                          name={ur.user.name}
                          size={20}
                        />
                        @{ur.user.username || ur.user.name || ur.user.id.slice(0, 8)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No users assigned to this role yet</p>
                )}
              </div>
            </div>
          ))}

          {roles.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <p>No roles created yet. Create your first role to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRole) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200">
              <h2 className="text-2xl font-bold text-zinc-900">
                {editingRole ? "Edit Role" : "Create New Role"}
              </h2>
            </div>

            <form
              onSubmit={editingRole ? handleEditRole : handleCreateRole}
              className="p-6 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g., Product Manager, Content Editor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Describe what this role can do..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-3">
                  Permissions *
                </label>
                <div className="space-y-4 max-h-96 overflow-y-auto border border-zinc-200 rounded-lg p-4">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-sm font-semibold text-zinc-900 mb-3 capitalize">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {perms.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedPermissions.has(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-zinc-900">{perm.name}</span>
                              {perm.description && (
                                <p className="text-xs text-zinc-500">{perm.description}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {formData.selectedPermissions.size} permission(s) selected
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRole(null);
                    setFormData({ name: "", description: "", selectedPermissions: new Set() });
                  }}
                  className="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors"
                >
                  {editingRole ? "Update Role" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {assigningUsers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200">
              <h2 className="text-2xl font-bold text-zinc-900">Assign Users to Role</h2>
              <p className="text-sm text-zinc-600 mt-1">
                <span className="font-medium">{assigningUsers.name}</span>
                {assigningUsers.description && (
                  <span className="text-zinc-500"> • {assigningUsers.description}</span>
                )}
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Select the users you want to assign to this role. Users can have multiple roles.
              </p>
            </div>

            <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
              {allUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 cursor-pointer border border-zinc-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds([...selectedUserIds, user.id]);
                      } else {
                        setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                  />
                  <Gravatar
                    email={user.email}
                    username={user.username}
                    name={user.name}
                    size={32}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-zinc-900">
                      @{user.username || "N/A"}
                    </span>
                    {user.name && (
                      <p className="text-xs text-zinc-500">{user.name}</p>
                    )}
                  </div>
                </label>
              ))}
              {allUsers.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">No users found</p>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-zinc-200">
              <p className="text-xs text-zinc-500">
                {selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""} selected
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAssigningUsers(null);
                    setSelectedUserIds([]);
                  }}
                  className="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUserAssignments}
                  className="px-4 py-2 rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors"
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

