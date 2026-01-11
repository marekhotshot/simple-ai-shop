# Pay More Than Listed Price - Feature Brainstorming

## Problem
Allow guests to pay more than the listed price for products without requiring user registration/authentication.

## Possible Solutions

### Option 1: Custom Price at Checkout (Simplest)
- Add "Custom Amount" checkbox/option on checkout page
- When checked, allow user to enter a custom amount (must be >= listed price)
- Display message: "Want to support the artist? You can pay more than the listed price."
- No registration needed - just enter custom amount during checkout
- **Pros**: Simple, no complexity, works immediately
- **Cons**: No bidding/competition, no visibility of offers

### Option 2: "Make an Offer" Button (Recommended)
- Add "Make an Offer" button on product detail page
- Modal/form to enter:
  - Name (optional)
  - Email (required for contact)
  - Offer amount (must be >= listed price)
  - Optional message
- Store offers in database, notify admin via email
- Admin can accept/reject offers
- If accepted, admin sends PayPal payment link for the offered amount
- **Pros**: Admin control, no registration needed, email notification
- **Cons**: Requires admin to manually process offers

### Option 3: "Support Price" Tiers
- Display product with "Suggested Price: €XXX"
- Add slider or buttons: "Pay Suggested" | "Pay More (+€10)" | "Pay More (+€50)" | "Pay More (+€100)"
- Guest selects tier and proceeds to checkout with that amount
- **Pros**: Very simple UX, no forms
- **Cons**: Limited flexibility, only predefined tiers

### Option 4: Simple Auction (No Registration)
- Product shows "Current highest offer: €XXX" (or "Starting price: €XXX")
- Guest enters:
  - Email (required)
  - Name (optional)
  - Offer amount (must be > current highest)
- Store in database, update "current highest offer" display
- Admin sets auction end date/time
- At end, admin contacts winner via email with payment link
- **Pros**: Creates competition, visibility
- **Cons**: More complex, requires admin management, email verification needed

## Recommendation: Option 2 ("Make an Offer")

### Implementation Plan:
1. **Frontend:**
   - Add "Make an Offer" button next to "Buy Now" on product detail page
   - Modal form with: Name, Email, Offer Amount, Message
   - Validation: Offer >= listed price
   - Submit to `/api/offers` endpoint

2. **Backend:**
   - New table: `product_offers`
     - id, product_id, name, email, offer_amount_cents, message, status (PENDING/ACCEPTED/REJECTED), created_at
   - Endpoint: `POST /api/offers` - create offer
   - Endpoint: `GET /api/admin/offers` - list all offers (admin)
   - Endpoint: `PUT /api/admin/offers/:id/accept` - accept offer, send payment link
   - Email notification to admin when new offer received

3. **Admin Panel:**
   - New tab: "Offers"
   - List all offers with product name, offer amount, email, status
   - Accept button: generates PayPal payment link and emails to customer
   - Reject button: marks as rejected

### Alternative Quick Win: Option 1 (Custom Price at Checkout)
- Modify checkout page to allow custom amount input
- Validate: custom amount >= product price
- Use custom amount for PayPal order creation
- **Implementation time: 30 minutes**
- **Best for MVP**

## Decision Needed
Which approach do you prefer? Option 1 (custom price) for quick implementation, or Option 2 (make an offer) for better admin control?
