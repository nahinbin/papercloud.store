"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/LoadingSkeletons";
import { useCart } from "@/contexts/CartContext";
import { useUser } from "@/contexts/UserContext";
import Gravatar from "@/components/Gravatar";

export default function Navbar() {
	const { user, permissions, isAuthenticated, isLoading: userLoading, refreshUser } = useUser();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const { getItemCount } = useCart();
	const cartItemCount = getItemCount();

	// Prevent hydration mismatch by only showing cart count after mount
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Calculate admin status from user data
	const isAdmin = useMemo(() => {
		return user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
	}, [user]);

	const hasAdminAccess = useMemo(() => {
		if (isAdmin) return true;
		return permissions.some((p: string) => 
									p.startsWith("dashboard.") || 
									p.startsWith("products.") || 
									p.startsWith("orders.") || 
									p.startsWith("users.") ||
									p.startsWith("banners.") ||
									p.startsWith("catalogues.") ||
									p.startsWith("roles.")
								);
	}, [isAdmin, permissions]);

	const username = user?.username || null;
	const userEmail = user?.email || null;
	const userName = user?.name || null;
	const isAuthed = userLoading ? null : isAuthenticated;

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		setIsMenuOpen(false);
		await refreshUser();
		location.reload();
	};

	const closeMenu = () => setIsMenuOpen(false);

	return (
		<>
			<header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60" suppressHydrationWarning>
				<div className="mx-auto flex max-w-6xl items-center px-4 py-3 gap-4" suppressHydrationWarning>
					<div className="flex flex-1 justify-start">
						<Link
							href="/cart"
							className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-zinc-50 transition-colors"
							aria-label="Open cart"
							title="Cart"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9h12l-2-9M10 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z"
								/>
							</svg>
							{isMounted && cartItemCount > 0 && (
								<span className="absolute -right-1 -top-1 bg-black text-white text-[10px] rounded-full min-w-[1.25rem] px-1 py-0.5 text-center leading-none">
									{cartItemCount}
								</span>
							)}
						</Link>
					</div>

					<div className="flex flex-1 justify-center">
						<Link href="/" className="flex items-center" onClick={closeMenu}>
							<Image 
								src="/nav.png" 
								alt="PaperCloud" 
								width={120} 
								height={32} 
								className="h-8 w-auto shrink-0 object-contain"
								priority
								unoptimized
							/>
						</Link>
					</div>

					<div className="flex flex-1 justify-end">
						{/* Hamburger Menu Button - Always visible */}
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className="p-2 rounded hover:bg-zinc-50 transition-colors"
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
				</div>
			</header>

			{/* Menu Overlay with Blur */}
			{isMenuOpen && (
				<>
					{/* Blurred Backdrop */}
					<div
						className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
						onClick={closeMenu}
					/>
					{/* Menu Panel */}
					<nav className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform">
						<div className="flex flex-col h-full">
							{/* Menu Header with User Info */}
							<div className="p-6 border-b border-zinc-100">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Menu</h2>
									<button
										onClick={closeMenu}
										className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
										aria-label="Close menu"
									>
										<svg
											className="w-5 h-5 text-zinc-600"
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
									</button>
								</div>
								{/* User Profile Section */}
								{isAuthed === true && username && (
									<div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
										<Gravatar email={userEmail} username={username} name={userName} size={44} />
										<div className="flex-1 min-w-0">
											<div className="font-semibold text-zinc-900 truncate">@{username}</div>
											{userName && (
												<div className="text-sm text-zinc-500 truncate">{userName}</div>
											)}
										</div>
									</div>
								)}
							</div>

							{/* Menu Content */}
							<div className="flex-1 overflow-y-auto px-3 py-4">
								<div className="space-y-1">
									{/* Cart Link */}
									<Link
										href="/cart"
										onClick={closeMenu}
										className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-50 transition-colors group"
									>
										<div className="flex items-center gap-3">
											<svg
												className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9h12l-2-9M10 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z"
												/>
											</svg>
											<span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">Cart</span>
										</div>
										{isMounted && cartItemCount > 0 && (
											<span className="bg-black text-white text-xs font-medium rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
												{cartItemCount}
											</span>
										)}
									</Link>

									{/* Authenticated User Menu */}
									{isAuthed === true ? (
										<>
											<Link
												href="/account"
												onClick={closeMenu}
												className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-50 transition-colors group"
											>
												<svg
													className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
													/>
												</svg>
												<span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">Account</span>
											</Link>
											{hasAdminAccess && (
												<Link
													href="/admin"
													onClick={closeMenu}
													className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-50 transition-colors group"
												>
													<svg
														className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
													</svg>
													<span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">Admin</span>
												</Link>
											)}
											<div className="pt-2 mt-2 border-t border-zinc-100">
												<button
													onClick={handleLogout}
													className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 hover:bg-red-50 transition-colors group text-left"
												>
													<svg
														className="w-5 h-5 text-zinc-600 group-hover:text-red-600"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
														/>
													</svg>
													<span className="text-sm font-medium text-zinc-700 group-hover:text-red-600">Logout</span>
												</button>
											</div>
										</>
									) : isAuthed === false ? (
										<>
											<Link
												href="/login"
												onClick={closeMenu}
												className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-700"
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
													/>
												</svg>
												Login
											</Link>
											<Link
												href="/register"
												onClick={closeMenu}
												className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 bg-black text-white hover:bg-zinc-800 transition-colors text-sm font-medium"
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
													/>
												</svg>
												Register
											</Link>
										</>
									) : (
										<div className="space-y-2 px-3 py-2">
											<Skeleton className="h-10 w-full rounded-lg" />
											<Skeleton className="h-10 w-full rounded-lg" />
										</div>
									)}
								</div>
							</div>
						</div>
					</nav>
				</>
			)}
		</>
	);
}