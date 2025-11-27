import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/authDb";
import { sendEmailVerificationOTP } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Username validation: only lowercase letters, numbers, and underscore
function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]+$/.test(username);
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string" || typeof body.email !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate username format on server side
  if (!isValidUsername(body.username)) {
    return NextResponse.json({ 
      error: "Username can only contain lowercase letters, numbers, and underscores" 
    }, { status: 400 });
  }

  try {
    // Check if username is already taken (in users or pending registrations)
    const existingUser = await prisma.user.findUnique({
      where: { username: body.username },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Check if pendingRegistration model exists, if not use raw SQL
    const hasPendingRegistrationModel = typeof (prisma as any).pendingRegistration !== "undefined";
    
    if (!hasPendingRegistrationModel) {
      console.warn("PendingRegistration model not available, using raw SQL fallback");
      
      // First, ensure the tables exist (execute each command separately)
      try {
        // Create pending_registrations table
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "pending_registrations" (
            "id" TEXT NOT NULL,
            "name" TEXT,
            "username" TEXT NOT NULL,
            "password_hash" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "otp" TEXT NOT NULL,
            "expires_at" TIMESTAMP(3) NOT NULL,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
          )
        `);
        
        // Create indexes for pending_registrations (one at a time)
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "pending_registrations_username_key" ON "pending_registrations"("username")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "pending_registrations_email_idx" ON "pending_registrations"("email")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "pending_registrations_expires_at_idx" ON "pending_registrations"("expires_at")`);
        
        // Create email_verification_tokens table
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
            "id" TEXT NOT NULL,
            "user_id" TEXT,
            "pending_registration_id" TEXT,
            "token" TEXT NOT NULL,
            "otp" TEXT,
            "expires_at" TIMESTAMP(3) NOT NULL,
            "used_at" TIMESTAMP(3),
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
          )
        `);
        
        // Create indexes for email_verification_tokens (one at a time)
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "email_verification_tokens_token_key" ON "email_verification_tokens"("token")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "email_verification_tokens_pending_registration_id_idx" ON "email_verification_tokens"("pending_registration_id")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "email_verification_tokens_expires_at_idx" ON "email_verification_tokens"("expires_at")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "email_verification_tokens_otp_idx" ON "email_verification_tokens"("otp")`);
        
        // Add foreign keys if they don't exist
        try {
          await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_verification_tokens_user_id_fkey') THEN
                ALTER TABLE "email_verification_tokens" 
                ADD CONSTRAINT "email_verification_tokens_user_id_fkey" 
                FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
              END IF;
            END $$
          `);
          
          await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_verification_tokens_pending_registration_id_fkey') THEN
                ALTER TABLE "email_verification_tokens" 
                ADD CONSTRAINT "email_verification_tokens_pending_registration_id_fkey" 
                FOREIGN KEY ("pending_registration_id") REFERENCES "pending_registrations"("id") ON DELETE CASCADE;
              END IF;
            END $$
          `);
        } catch (fkError: any) {
          // Foreign keys might fail if tables don't exist yet, that's okay
          console.warn("Foreign key creation warning:", fkError?.message);
        }
      } catch (tableError: any) {
        // Table might already exist or there's a permission issue
        console.warn("Table creation warning:", tableError?.message);
      }
      
      // Use raw SQL as fallback - check if username exists in pending_registrations
      const existingPendingRaw = await prisma.$queryRaw<Array<{count: bigint}>>`
        SELECT COUNT(*) as count FROM pending_registrations WHERE username = ${body.username}
      `;
      if (existingPendingRaw[0]?.count > 0) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }
      
      // Check email in pending registrations
      const existingPendingEmailRaw = await prisma.$queryRaw<Array<{id: string}>>`
        SELECT id FROM pending_registrations WHERE email = ${body.email.toLowerCase()}
      `;
      if (existingPendingEmailRaw.length > 0) {
        // Delete old pending registration
        await prisma.$executeRaw`
          DELETE FROM pending_registrations WHERE id = ${existingPendingEmailRaw[0].id}
        `;
      }
      
      // Create pending registration using raw SQL
      // Generate ID in cuid format (similar to Prisma's default)
      const timestamp = Date.now().toString(36);
      const randomPart = crypto.randomBytes(8).toString("hex");
      const pendingId = `cm${timestamp}${randomPart}`.substring(0, 25);
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      await prisma.$executeRaw`
        INSERT INTO pending_registrations (id, name, username, password_hash, email, otp, expires_at, created_at)
        VALUES (${pendingId}, ${body.name || null}, ${body.username}, ${hashPassword(body.password)}, ${body.email.toLowerCase()}, ${otp}, ${expiresAt}, NOW())
      `;
      
      // Create verification token
      const token = crypto.randomBytes(32).toString("hex");
      const tokenTimestamp = Date.now().toString(36);
      const tokenRandomPart = crypto.randomBytes(8).toString("hex");
      const tokenId = `cm${tokenTimestamp}${tokenRandomPart}`.substring(0, 25);
      await prisma.$executeRaw`
        INSERT INTO email_verification_tokens (id, pending_registration_id, token, otp, expires_at, created_at)
        VALUES (${tokenId}, ${pendingId}, ${token}, ${otp}, ${expiresAt}, NOW())
      `;
      
      // Send OTP email (await it to ensure it's sent)
      try {
        await sendEmailVerificationOTP({
          to: body.email.toLowerCase(),
          name: body.name || body.username,
          otp,
          expiresAt,
        });
        console.log(`[Registration] OTP sent to ${body.email.toLowerCase()}: ${otp}`);
      } catch (error) {
        console.error("Failed to send verification email", error);
        // Log OTP in console for development if email fails
        if (process.env.NODE_ENV !== "production") {
          console.log(`[DEV] OTP Code for ${body.email.toLowerCase()}: ${otp}`);
        }
      }
      
      return NextResponse.json({ 
        success: true,
        pendingId,
        email: body.email.toLowerCase(),
        message: "Please check your email for verification code."
      });
    }

    // Check pending registrations
    const existingPending = await (prisma as any).pendingRegistration.findUnique({
      where: { username: body.username },
    });
    if (existingPending) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Check if email is already taken
    const existingEmail = await prisma.user.findFirst({
      where: { email: body.email.toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already taken" }, { status: 400 });
    }

    // Check and clean up old pending registrations with same email
    const existingPendingEmail = await (prisma as any).pendingRegistration.findFirst({
      where: { email: body.email.toLowerCase() },
    });
    if (existingPendingEmail) {
      // Delete old pending registration
      await (prisma as any).pendingRegistration.delete({
        where: { id: existingPendingEmail.id },
      });
    }

    // Create pending registration (account NOT created yet)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const pendingRegistration = await (prisma as any).pendingRegistration.create({
      data: {
        name: typeof body.name === "string" ? body.name : undefined,
        username: body.username,
        passwordHash: hashPassword(body.password),
        email: body.email.toLowerCase(),
        otp,
        expiresAt,
      },
    });

    // Create verification token
    const token = crypto.randomBytes(32).toString("hex");
    await (prisma as any).emailVerificationToken.create({
      data: {
        pendingRegistrationId: pendingRegistration.id,
        token,
        otp,
        expiresAt,
      },
    });

    // Send OTP email
    Promise.resolve()
      .then(async () => {
        await sendEmailVerificationOTP({
          to: pendingRegistration.email,
          name: pendingRegistration.name ?? pendingRegistration.username,
          otp,
          expiresAt,
        });
      })
      .catch((error) => {
        console.error("Failed to send verification email", error);
      });

    // Return pending registration ID for verification page
    return NextResponse.json({ 
      success: true,
      pendingId: pendingRegistration.id,
      email: pendingRegistration.email,
      message: "Please check your email for verification code."
    });
  } catch (e: any) {
    console.error("Registration error:", e);
    return NextResponse.json({ error: e?.message ?? "Registration failed" }, { status: 400 });
  }
}


