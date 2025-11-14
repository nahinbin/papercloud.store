"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";

export default function Navbar() {
	const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const [username, setUsername] = useState<string | null>(null);
	const [logoUrl, setLogoUrl] = useState<string>("/nav.png");
	const { getItemCount } = useCart();
	const cartItemCount = getItemCount();
	
	useEffect(() => {
		// Fetch current logo
		fetch("/api/logo")
			.then(async (res) => {
				if (res.ok) {
					const data = await res.json();
					if (data.exists && data.url) {
						setLogoUrl(data.url);
					}
				}
			})
			.catch(() => {
				// Use default logo on error
			});
	}, []);

	useEffect(() => {
 		let cancelled = false;
 		fetch("/api/auth/me").then(async (r) => {
 			if (!cancelled) {
				if (r.ok) {
					const data = await r.json();
					const user = data.user;
					setIsAuthed(true);
					setUsername(user?.username || null);
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
				<Link href="/" className="flex items-center">
					<Image src={logoUrl} alt="PaperCloud" width={120} height={32} className="h-8 w-auto" />
				</Link>
				<nav className="flex items-center gap-3 text-sm">
					<Link
						href="/cart"
						className="relative rounded border px-3 py-1.5 hover:bg-zinc-50 transition-colors"
						title="Shopping Cart"
					>
						🛒 Cart
						{cartItemCount > 0 && (
							<span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
								{cartItemCount}
							</span>
						)}
					</Link>
					{isAuthed === true ? (
						<>
							{isAdmin && (
								<Link 
									href="/admin" 
									className="rounded bg-zinc-100 px-3 py-1.5 text-zinc-700 hover:bg-zinc-200 transition-colors"
									title="Admin Dashboard"
								>
									⚙️ Dashboard
								</Link>
							)}
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