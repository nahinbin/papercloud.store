"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
	const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const [username, setUsername] = useState<string | null>(null);
	useEffect(() => {
 		let cancelled = false;
 		fetch("/api/auth/me").then(async (r) => {
 			if (!cancelled) {
				if (r.ok) {
					const data = await r.json();
					const user = data.user;
					setIsAuthed(true);
					setUsername(user?.username || null);
					// Check if admin by isAdmin flag OR username is @admin or admin
					setIsAdmin(user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false);
				} else {
					setIsAuthed(false);
					setIsAdmin(false);
					setUsername(null);
				}
			}
 		}).catch(() => {
			setIsAuthed(false);
			setIsAdmin(false);
			setUsername(null);
		});
 		return () => { cancelled = true; };
 	}, []);

	return (
		<header className="w-full border-b bg-white">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
				<Link href="/" className="text-lg font-semibold">PaperCloud</Link>
				<nav className="flex items-center gap-3 text-sm">
					{isAuthed === true && isAdmin && (
						<>
							<Link href="/admin" className="rounded bg-zinc-800 px-3 py-1.5 text-white">Admin</Link>
							<Link href="/admin/products/new" className="rounded bg-black px-3 py-1.5 text-white">Add Product</Link>
						</>
					)}
					{isAuthed === true ? (
						<>
							{username && (
								<span className="text-zinc-600">@{username}</span>
							)}
							<button
								onClick={async () => {
									await fetch("/api/auth/logout", { method: "POST" });
									setIsAuthed(false);
									setIsAdmin(false);
									setUsername(null);
									location.reload();
								}}
								className="rounded border px-3 py-1.5"
							>
								Logout
							</button>
						</>
					) : isAuthed === false ? (
						<>
							<Link href="/login" className="rounded border px-3 py-1.5">Login</Link>
							<Link href="/register" className="rounded border px-3 py-1.5">Register</Link>
						</>
					) : null}
				</nav>
			</div>
		</header>
	);
}