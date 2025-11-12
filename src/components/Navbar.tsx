"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
	const [isAuthed, setIsAuthed] = useState<boolean>(false);
	useEffect(() => {
 		let cancelled = false;
 		fetch("/api/auth/me").then(async (r) => {
 			if (!cancelled) setIsAuthed(r.ok);
 		}).catch(() => setIsAuthed(false));
 		return () => { cancelled = true; };
 	}, []);

	return (
		<header className="w-full border-b bg-white">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
				<Link href="/" className="text-lg font-semibold">PaperCloud</Link>
				<nav className="flex items-center gap-3 text-sm">
					<Link href="/admin/products/new" className="rounded bg-black px-3 py-1.5 text-white">Add Product</Link>
					{isAuthed ? (
						<button
							onClick={async () => {
								await fetch("/api/auth/logout", { method: "POST" });
								setIsAuthed(false);
								location.reload();
							}}
							className="rounded border px-3 py-1.5"
						>
							Logout
						</button>
					) : (
						<>
							<Link href="/login" className="rounded border px-3 py-1.5">Login</Link>
							<Link href="/register" className="rounded border px-3 py-1.5">Register</Link>
						</>
					)}
				</nav>
			</div>
		</header>
	);
}