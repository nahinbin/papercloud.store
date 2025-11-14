# Setting Up Braintree for Production (Real Transactions)

## Important: Before Going Live

⚠️ **You must complete these steps before accepting real payments:**

1. Create a **Production Braintree account** (separate from Sandbox)
2. Complete **KYC (Know Your Customer) verification** - this is required by law
3. Get approved by Braintree (can take 1-3 business days)
4. Use **HTTPS** in production (required for PCI compliance)
5. Test thoroughly in sandbox first

## Step 1: Create Production Braintree Account

1. Go to [Braintree Production](https://www.braintreegateway.com)
2. Sign up for a **Production** account (this is different from Sandbox)
3. Complete the business verification process:
   - Business information
   - Bank account details (for payouts)
   - Identity verification
   - Business documents (if required)

## Step 2: Get Production API Keys

Once your account is approved:

1. Log into your **Production** Braintree dashboard
2. Go to **Settings → API Keys**
3. Copy your **Production** credentials:
   - **Merchant ID**
   - **Public Key**
   - **Private Key**

⚠️ **Important:** These are different from your Sandbox keys!

## Step 3: Update Environment Variables

Update your `.env.local` file with **production** credentials:

```env
# Switch to production
BRAINTREE_ENVIRONMENT=production

# Use your PRODUCTION credentials (not sandbox)
BRAINTREE_MERCHANT_ID=your_production_merchant_id
BRAINTREE_PUBLIC_KEY=your_production_public_key
BRAINTREE_PRIVATE_KEY=your_production_private_key
```

## Step 4: Restart Your Server

After updating `.env.local`, **restart your development server**:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Step 5: Use HTTPS in Production

**CRITICAL:** Braintree requires HTTPS for production. Make sure:

1. Your production domain has SSL/HTTPS enabled
2. If deploying to Vercel, HTTPS is automatic
3. Never test production credentials on `http://localhost` - use your production domain

## Step 6: Test with Real Card (Small Amount First)

1. Use a **real credit card** (your own, for testing)
2. Start with a **small amount** (e.g., $1.00)
3. Verify the transaction appears in your Braintree dashboard
4. Check that the order is saved in your database

## Security Checklist

- ✅ Use HTTPS only
- ✅ Never commit `.env.local` to git
- ✅ Keep production keys secret
- ✅ Monitor transactions in Braintree dashboard
- ✅ Set up webhooks for payment notifications
- ✅ Enable fraud detection in Braintree settings

## Going Back to Sandbox

If you need to test again, just change:

```env
BRAINTREE_ENVIRONMENT=sandbox
```

And use your **sandbox** credentials.

## Support

- Braintree Support: https://help.braintreepayments.com
- Braintree Status: https://status.braintreepayments.com

