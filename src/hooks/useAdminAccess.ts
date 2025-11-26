"use client";

import { useMemo, useEffect } from "react";
 import { useRouter } from "next/navigation";
 import { useUser } from "@/contexts/UserContext";

 interface AdminAccessOptions {
 	redirectOnDeny?: boolean;
 }

interface AdminAccessResult {
	isAdmin: boolean;
	permissions: string[];
	hasAccess: boolean | null;
	isChecking: boolean;
}

 const ADMIN_USERNAMES = new Set(["@admin", "admin"]);

 /**
  * Small helper hook that derives admin/permission access from the global user context
  * and optionally redirects to the unauthorized page when a user lacks access.
  */
export function useAdminAccess(requiredPermissions: string[] = [], options: AdminAccessOptions = {}): AdminAccessResult {
	const router = useRouter();
	const { user, permissions, isLoading } = useUser();
	const redirectOnDeny = options.redirectOnDeny ?? true;

 	const isAdmin = useMemo(() => {
 		if (!user) return false;
 		return Boolean(user.isAdmin) || ADMIN_USERNAMES.has(user.username);
 	}, [user]);

 	const permissionsKey = useMemo(() => requiredPermissions.slice().sort().join("|"), [requiredPermissions]);
 	const normalizedRequiredPermissions = useMemo(() => {
 		return permissionsKey ? permissionsKey.split("|").filter(Boolean) : [];
 	}, [permissionsKey]);

	const resolvedAccess = useMemo(() => {
		if (isLoading) return null;

		const allowed =
			isAdmin ||
			normalizedRequiredPermissions.length === 0 ||
			normalizedRequiredPermissions.some((permission) => permissions.includes(permission));

		return allowed;
	}, [isLoading, isAdmin, normalizedRequiredPermissions, permissions]);

	useEffect(() => {
		if (resolvedAccess === false && redirectOnDeny) {
			router.replace("/admin/unauthorized");
		}
	}, [redirectOnDeny, resolvedAccess, router]);

 	return {
 		isAdmin,
 		permissions,
		hasAccess: resolvedAccess,
		isChecking: isLoading || resolvedAccess === null,
 	};
 }


