# Braintree Payment Integration Setup

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Braintree Sandbox Account

1. Go to [Braintree Sandbox](https://sandbox.braintreegateway.com) and sign up
2. Once logged in, go to **Settings → API Keys**
3. Copy your:
   - **Merchant ID**
   - **Public Key**
   - **Private Key**

### 3. Configure Environment Variables

Create a `.env` file in the root directory (or add to your existing one):

```env
BRAINTREE_MERCHANT_ID=your_merchant_id_here
BRAINTREE_PUBLIC_KEY=your_public_key_here
BRAINTREE_PRIVATE_KEY=your_private_key_here
BRAINTREE_ENVIRONMENT=sandbox
```

### 4. Run Database Migration

```bash
npx prisma generate
npx prisma db push
```

This will create the `Order` and `OrderItem` tables in your database.

### 5. Test the Integration

1. Start your development server: `npm run dev`
2. Add a product to cart
3. Go to checkout
4. Use these **test card numbers** (Braintree Sandbox accepts these):

   **Visa (Success):**
   - Card: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g., `12/30`)
   - CVV: `123`
   - Name: Any name

   **Visa (Decline):**
   - Card: `4000 0000 0000 0002`

   **Mastercard:**
   - Card: `5555 5555 5555 4444`

   **American Express:**
   - Card: `3782 822463 10005`

### 6. Going to Production

1. Create a **Production** Braintree account at [braintreegateway.com](https://www.braintreegateway.com)
2. Complete KYC (Know Your Customer) verification
3. Update your `.env`:
   ```env
   BRAINTREE_ENVIRONMENT=production
   BRAINTREE_MERCHANT_ID=your_production_merchant_id
   BRAINTREE_PUBLIC_KEY=your_production_public_key
   BRAINTREE_PRIVATE_KEY=your_production_private_key
   ```
4. **IMPORTANT:** Use HTTPS in production
5. Set up webhooks in Braintree dashboard for order status updates

## Features Implemented

✅ Shopping cart with localStorage persistence  
✅ Braintree Drop-in UI for secure card entry  
✅ Order creation in database  
✅ Automatic stock quantity updates  
✅ Order confirmation page  
✅ Cart icon in navbar with item count  

## Security Notes

- **Never** store raw card numbers - Braintree handles this
- All payment processing happens server-side
- Card data is tokenized via Braintree nonces
- Use HTTPS in production
- Validate amounts server-side (already implemented)

## API Endpoints

- `GET /api/braintree/token` - Get client token for Drop-in
- `POST /api/braintree/checkout` - Process payment and create order

## Troubleshooting

**"Failed to generate client token"**
- Check your Braintree credentials in `.env`
- Ensure `BRAINTREE_ENVIRONMENT` is set correctly

**"Payment failed"**
- Verify you're using sandbox test cards
- Check browser console for detailed errors
- Check server logs for Braintree API errors

**Orders not saving**
- Run `npx prisma db push` to ensure tables exist
- Check database connection

## Next Steps

Consider adding:
- Email notifications for order confirmations
- Order history page for users
- Admin order management page
- Webhook handling for payment status updates
- Refund functionality

