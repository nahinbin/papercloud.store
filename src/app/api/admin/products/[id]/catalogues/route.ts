import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  if (!isAdmin) {
    return { error: "Forbidden", status: 403 };
  }

  return { error: null, status: 200 };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = await params;

  try {
    const catalogueProducts = await (prisma as any).catalogueProduct.findMany({
      where: { productId: id },
      select: { catalogueId: true },
    });

    const catalogueIds = catalogueProducts.map((cp: any) => cp.catalogueId);

    return NextResponse.json({ catalogueIds });
  } catch (error: any) {
    console.error("Error fetching product catalogues:", error);
    return NextResponse.json({ catalogueIds: [] });
  }
}

