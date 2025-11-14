import { NextResponse } from "next/server";
import * as braintree from "braintree";

const gateway = new braintree.BraintreeGateway({
  environment:
    process.env.BRAINTREE_ENVIRONMENT === "production"
      ? braintree.Environment.Production
      : braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID || "",
  publicKey: process.env.BRAINTREE_PUBLIC_KEY || "",
  privateKey: process.env.BRAINTREE_PRIVATE_KEY || "",
});

export async function GET() {
  // Check if credentials are set
  if (!process.env.BRAINTREE_MERCHANT_ID || !process.env.BRAINTREE_PUBLIC_KEY || !process.env.BRAINTREE_PRIVATE_KEY) {
    console.error("Braintree credentials missing");
    return NextResponse.json(
      { 
        error: "Braintree credentials not configured",
        details: "Please set BRAINTREE_MERCHANT_ID, BRAINTREE_PUBLIC_KEY, and BRAINTREE_PRIVATE_KEY in your .env.local file"
      },
      { status: 500 }
    );
  }

  try {
    const response = await gateway.clientToken.generate({});
    if (!response.clientToken) {
      throw new Error("No client token received from Braintree");
    }
    return NextResponse.json({ clientToken: response.clientToken });
  } catch (err: any) {
    console.error("Braintree token error:", err);
    return NextResponse.json(
      { 
        error: "Failed to generate client token",
        details: err.message || "Check your Braintree credentials and environment settings"
      },
      { status: 500 }
    );
  }
}
