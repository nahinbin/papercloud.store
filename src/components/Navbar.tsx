"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";

export default function Navbar() {
	const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const [username, setUsername] = useState<string | null>(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { getItemCount } = useCart();
	const cartItemCount = getItemCount();

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

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		setIsAuthed(false);
		setIsAdmin(false);
		setUsername(null);
		setIsMenuOpen(false);
		location.reload();
	};

	const closeMenu = () => setIsMenuOpen(false);

	return (
		<header className="w-full border-b bg-white sticky top-0 z-50">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
				<Link href="/" className="flex items-center" onClick={closeMenu}>
					<Image 
						src="/nav.png" 
						alt="PaperCloud" 
						width={120} 
						height={32} 
						className="h-8 w-auto" 
						priority
						unoptimized
					/>
				</Link>

				{/* Desktop Navigation - Hidden on mobile */}
				<nav className="hidden md:flex items-center gap-3 text-sm">
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
								onClick={handleLogout}
								className="rounded border px-3 py-1.5 hover:bg-zinc-50 transition-colors"
							>
								Logout
							</button>
						</>
					) : isAuthed === false ? (
						<>
							<Link href="/login" className="rounded border px-3 py-1.5 hover:bg-zinc-50 transition-colors">Login</Link>
							<Link href="/register" className="rounded border px-3 py-1.5 hover:bg-zinc-50 transition-colors">Register</Link>
						</>
					) : null}
				</nav>

				{/* Hamburger Menu Button - Visible on mobile */}
				<button
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					className="md:hidden p-2 rounded hover:bg-zinc-50 transition-colors"
					aria-label="Toggle menu"
				>
					{isMenuOpen ? (
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					) : (
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					)}
				</button>
			</div>

			{/* Mobile Menu - Slides down when open */}
			{isMenuOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
						onClick={closeMenu}
					/>
					{/* Menu Panel */}
					<nav className="absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50 md:hidden">
						<div className="px-4 py-4 space-y-3">
							{/* Cart Link */}
							<Link
								href="/cart"
								onClick={closeMenu}
								className="flex items-center justify-between rounded border px-4 py-3 hover:bg-zinc-50 transition-colors"
							>
								<span className="flex items-center gap-2">
									🛒 Shopping Cart
								</span>
								{cartItemCount > 0 && (
									<span className="bg-black text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
										{cartItemCount}
									</span>
								)}
							</Link>

							{/* Authenticated User Menu */}
							{isAuthed === true ? (
								<>
									{username && (
										<div className="px-4 py-2 text-sm text-zinc-600 border-b">
											Logged in as <span className="font-semibold">@{username}</span>
										</div>
									)}
									{isAdmin && (
										<Link
											href="/admin"
											onClick={closeMenu}
											className="flex items-center gap-2 rounded border px-4 py-3 hover:bg-zinc-50 transition-colors"
										>
											⚙️ Admin Dashboard
										</Link>
									)}
									<button
										onClick={handleLogout}
										className="w-full text-left rounded border px-4 py-3 hover:bg-zinc-50 transition-colors"
									>
										Logout
									</button>
								</>
							) : isAuthed === false ? (
								<>
									<Link
										href="/login"
										onClick={closeMenu}
										className="block rounded border px-4 py-3 text-center hover:bg-zinc-50 transition-colors"
									>
										Login
									</Link>
									<Link
										href="/register"
										onClick={closeMenu}
										className="block rounded bg-black text-white px-4 py-3 text-center hover:bg-zinc-800 transition-colors"
									>
										Register
									</Link>
								</>
							) : (
								<div className="px-4 py-2 text-sm text-zinc-500">
									Loading...
								</div>
							)}
						</div>
					</nav>
				</>
			)}
		</header>
	);
}