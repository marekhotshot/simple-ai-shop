# Full Feature Implementation Plan

## Current Status
✅ Database schema exists (orders, custom_requests, contact_messages, jobs, settings_secure)
✅ Basic admin CRUD for products
✅ Public API endpoints (products, custom-request, contact)
✅ PayPal routes exist
✅ AI routes exist

## Issues to Fix First
1. ❌ Admin GET /products returns "Not found" - needs debugging
2. ❌ Products not showing on homepage - fixed ThreeItemGrid/Carousel
3. ❌ Missing locale routing (/sk and /en)

## Features to Implement

### Phase 1: Core Fixes & Locale Routing
1. Fix admin products endpoint
2. Add locale routing middleware
3. Update all frontend pages to support /sk and /en
4. Add locale switcher in navbar

### Phase 2: Public Pages
1. Custom request form (/sk/custom, /en/custom)
2. Contact form (/sk/contact, /en/contact)
3. Success/Cancel pages for PayPal
4. Legal pages (privacy, terms, shipping, returns)
5. Product detail page with "Want something similar?" for SOLD items

### Phase 3: Admin Features
1. Orders view (/admin/orders)
2. Custom requests view (/admin/requests)
3. Integrations settings page (/admin/settings/integrations)
4. AI image processing UI
5. AI description generation UI
6. Social copy generator
7. Share image generation

### Phase 4: PayPal Integration
1. PayPal checkout button on product pages
2. PayPal success/cancel handling
3. Order status updates

### Phase 5: Testing
1. End-to-end flow testing
2. Mobile responsiveness
3. Locale switching
4. All admin features
