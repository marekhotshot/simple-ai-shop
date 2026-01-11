# Browser Testing Guide

## Application URLs

- **Homepage**: http://localhost:3001
- **Admin Panel**: http://localhost:3001/admin
- **Checkout**: http://localhost:3001/checkout
- **Search**: http://localhost:3001/search
- **Backend API**: http://localhost:3000/api

## Testing Checklist

### 1. Homepage (http://localhost:3001)
- [ ] Page loads without errors
- [ ] Hero banner displays: "Welcome to igormraz"
- [ ] Intro text visible: "Discover our collection..."
- [ ] Products are displayed (if any exist)
- [ ] Footer shows: "© 2026 igormraz.com. All rights reserved."
- [ ] Footer shows: "Created by Hotshot" (link to hotshot.sk)
- [ ] No Vercel references visible
- [ ] Navigation bar works

### 2. Admin Panel (http://localhost:3001/admin)
- [ ] Admin page loads
- [ ] Product list table displays
- [ ] "Create Product" tab works
- [ ] Can create a new product with:
  - Slug
  - Category (Paintings/Sculptures)
  - Price
  - Status (Available/Sold/Hidden)
  - Slovak translation (title, description)
  - English translation (title, description)
- [ ] Product appears in list after creation
- [ ] Can click "Edit" on a product
- [ ] Can delete a product

### 3. Edit Product Page (http://localhost:3001/admin/products/[id])
- [ ] Product details load correctly
- [ ] Can edit all fields
- [ ] Can upload product images
- [ ] Uploaded images display
- [ ] Can delete images
- [ ] Changes save successfully

### 4. Checkout Page (http://localhost:3001/checkout)
- [ ] Checkout page loads
- [ ] Shows "Bank Transfer" as payment method
- [ ] Payment instructions text visible
- [ ] Shipping form fields present:
  - Full Name
  - Email
  - Phone
  - Address
  - City
  - ZIP Code
  - Country
- [ ] Order summary displays (if cart has items)
- [ ] Form validation works

### 5. Product Pages
- [ ] Navigate to a product page
- [ ] Product details display correctly
- [ ] Images load (if uploaded)
- [ ] Add to cart button works
- [ ] Price displays correctly

### 6. Search Page (http://localhost:3001/search)
- [ ] Search page loads
- [ ] Can search for products
- [ ] Results display correctly

### 7. Cart Functionality
- [ ] Add product to cart
- [ ] Cart icon shows item count
- [ ] Open cart modal
- [ ] Cart items display
- [ ] Can update quantities
- [ ] Can remove items
- [ ] Total calculates correctly
- [ ] "Proceed to Checkout" button works

## Expected Behavior

### Backend API Tests
```bash
# Health check
curl http://localhost:3000/health
# Should return: {"ok":true}

# Get products
curl http://localhost:3000/api/products
# Should return JSON with products array

# Get admin products
curl http://localhost:3000/api/admin/products
# Should return JSON with products array
```

## Common Issues

1. **Frontend not loading**: Check if Next.js dev server is running on port 3001
2. **API errors**: Verify backend is running on port 3000
3. **Images not loading**: Check image paths and backend uploads endpoint
4. **Admin not working**: Verify admin API endpoints are accessible

## Notes

- Backend must be running on port 3000
- Frontend must be running on port 3001
- Database connection via port-forward should be active
- All changes should persist in the database
