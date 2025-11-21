import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { label, name, address, city, state, zip, country, phone, isDefault } = body;

    // Verify the address belongs to the user
    const existingAddress = await prisma.deliveryAddress.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (existingAddress.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If this is set as default, unset other defaults
    if (isDefault && !existingAddress.isDefault) {
      await prisma.deliveryAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (label !== undefined) updateData.label = label;
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zip !== undefined) updateData.zip = zip;
    if (country !== undefined) updateData.country = country;
    if (phone !== undefined) updateData.phone = phone;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedAddress = await prisma.deliveryAddress.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ address: updatedAddress });
  } catch (error: any) {
    console.error("Address update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify the address belongs to the user
    const existingAddress = await prisma.deliveryAddress.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (existingAddress.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.deliveryAddress.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Address deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete address" },
      { status: 500 }
    );
  }
}

