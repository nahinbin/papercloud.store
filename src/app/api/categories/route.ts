import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  try {
    const categories = await prisma.product.findMany({
      where: {
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
    });

    const categoryList = categories
      .map((c) => c.category)
      .filter((c): c is string => c !== null && c !== "");

    const response = NextResponse.json({ categories: categoryList });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}

