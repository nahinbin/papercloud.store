import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import Link from "next/link";
import Image from "next/image";
import { getUserAvatarUrl } from "@/lib/gravatar-server";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  
  // Check if this is the current user's profile
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const currentUser = await getUserBySessionToken(token);
  
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      createdAt: true,
      isAdmin: true,
    },
  });

  if (!user) {
    notFound();
  }

  // If viewing own profile, redirect to account page
  if (currentUser && currentUser.id === user.id) {
    redirect("/account");
  }

  // Get user's order count
  const orderCount = await prisma.order.count({
    where: { userId: user.id },
  });

  const avatarUrl = getUserAvatarUrl(user.email, user.username, user.name, 120);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-black mb-8 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Store
        </Link>

        <div className="rounded-2xl border border-zinc-100 bg-white/80 p-8 shadow-sm">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
            <div className="relative">
              <Image
                src={avatarUrl}
                alt={user.name || user.username || "User"}
                width={120}
                height={120}
                className="rounded-full border-4 border-zinc-100"
                unoptimized
              />
              {user.isAdmin && (
                <div className="absolute -bottom-2 -right-2 px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-medium">
                  Admin
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                {user.name || `@${user.username}`}
              </h1>
              {user.name && (
                <p className="text-lg text-zinc-600 mb-4">@{user.username}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Member since {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                </div>
                {orderCount > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>{orderCount} order{orderCount !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-6 pt-6 border-t border-zinc-100">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">About</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-500 w-24">Username:</span>
                  <span className="text-zinc-900">@{user.username}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-500 w-24">Joined:</span>
                  <span className="text-zinc-900">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

