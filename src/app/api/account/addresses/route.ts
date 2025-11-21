import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await prisma.deliveryAddress.findMany({
    where: { userId: user.id },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  });

  const response = NextResponse.json({ addresses });
  // Cache for 30 seconds (addresses don't change frequently)
  response.headers.set("Cache-Control", "private, s-maxage=30, stale-while-revalidate=60");
  return response;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { label, name, address, city, state, zip, country, phone, isDefault } = body;

    // Validate required fields
    if (!name || !address || !city || !zip || !country) {
      return NextResponse.json(
        { error: "Missing required fields: name, address, city, zip, country" },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.deliveryAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.deliveryAddress.create({
      data: {
        userId: user.id,
        label: label || null,
        name,
        address,
        city,
        state: state || null,
        zip,
        country: country || "US",
        phone: phone || null,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error: any) {
    console.error("Address creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create address" },
      { status: 500 }
    );
  }
}

