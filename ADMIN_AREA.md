# Admin Area

## Location

The admin area is accessible via the backend API at:

**`/api/admin`**

## Endpoints

### Products
- **POST** `/api/admin/products` - Create a new product
- **PUT** `/api/admin/products/:id` - Update a product
- **GET** `/api/admin/products` - List all products
- **DELETE** `/api/admin/products/:id` - Delete a product

### Product Images
- **POST** `/api/admin/products/:id/images` - Upload product images
- **DELETE** `/api/admin/products/:id/images/:imageId` - Delete a product image

### Settings
- **GET** `/api/admin/settings` - Get all settings
- **POST** `/api/admin/settings` - Update settings

### AI Routes
- **POST** `/api/admin/ai/generate-product-description` - Generate product description using AI

## Authentication

Currently, the admin routes require the `SETTINGS_MASTER_KEY` to be set in environment variables. 
For production, you should implement proper authentication.

## Example Usage

### Create a Product
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-painting",
    "category": "PAINTINGS",
    "priceCents": 5000,
    "status": "AVAILABLE",
    "translations": [
      {
        "locale": "sk",
        "title": "Môj Obraz",
        "descriptionShort": "Popis obrazu"
      },
      {
        "locale": "en",
        "title": "My Painting",
        "descriptionShort": "Painting description"
      }
    ]
  }'
```

### Upload Product Image
```bash
curl -X POST http://localhost:3000/api/admin/products/{productId}/images \
  -F "file=@/path/to/image.jpg" \
  -F "sortOrder=1"
```

## Frontend Admin Interface

Currently, there is no frontend admin interface. You can:
1. Use the API endpoints directly (curl, Postman, etc.)
2. Build a custom admin interface
3. Use a tool like Postman or Insomnia to interact with the API

## Future Enhancement

Consider building a Next.js admin dashboard at `/admin` route for easier management.
