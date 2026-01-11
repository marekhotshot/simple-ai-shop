// Script to add products to the database
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/simple_ai_shop',
});

const products = [
  {
    "id": "image_32",
    "product_name": "Wooden Dragon Sculpture (Full Body)",
    "enhanced_image_filename": "image_42.png",
    "metadata": {
      "detected_object_type": "wood sculpture",
      "estimated_price": "450 - 600 EUR"
    }
  },
  {
    "id": "image_33",
    "product_name": "Piranha Fish Relief Panel",
    "enhanced_image_filename": "image_43.png",
    "metadata": {
      "detected_object_type": "wood relief carving",
      "estimated_price": "250 - 350 EUR"
    }
  },
  {
    "id": "image_34",
    "product_name": "Fantasy Creature & Plant Relief",
    "enhanced_image_filename": "image_44.png",
    "metadata": {
      "detected_object_type": "wood relief carving",
      "estimated_price": "300 - 400 EUR"
    }
  },
  {
    "id": "image_35",
    "product_name": "Dwarf Miner Deep Relief",
    "enhanced_image_filename": "image_45.png",
    "metadata": {
      "detected_object_type": "wood relief carving",
      "estimated_price": "280 - 380 EUR"
    }
  },
  {
    "id": "image_36",
    "product_name": "Stylized Woman Modern Relief",
    "enhanced_image_filename": "image_46.png",
    "metadata": {
      "detected_object_type": "wood relief carving",
      "estimated_price": "320 - 420 EUR"
    }
  },
  {
    "id": "image_37",
    "product_name": "Mechanical 'ALIEN' Fish Relief",
    "enhanced_image_filename": "image_47.png",
    "metadata": {
      "detected_object_type": "wood relief carving",
      "estimated_price": "350 - 450 EUR"
    }
  },
  {
    "id": "image_38",
    "product_name": "Xenomorph Alien Head Relief",
    "enhanced_image_filename": "image_48.png",
    "metadata": {
      "detected_object_type": "wood relief carving",
      "estimated_price": "380 - 480 EUR"
    }
  },
  {
    "id": "image_39",
    "product_name": "Set of 7 Wooden Mushrooms",
    "enhanced_image_filename": "image_49.png",
    "metadata": {
      "detected_object_type": "set of wood sculptures",
      "estimated_price": "400 - 500 EUR"
    }
  },
  {
    "id": "image_40",
    "product_name": "Dragon Head Bust",
    "enhanced_image_filename": "image_50.png",
    "metadata": {
      "detected_object_type": "wood sculpture bust",
      "estimated_price": "420 - 520 EUR"
    }
  },
  {
    "id": "image_41",
    "product_name": "Predator vs Alien Battle Relief",
    "enhanced_image_filename": "image_51.png",
    "metadata": {
      "detected_object_type": "wood relief carving",
      "estimated_price": "450 - 550 EUR"
    }
  },
  {
    "id": "image_52",
    "product_name": "Large Wooden Alien Sculpture",
    "images": ["image_62.png", "image_67.png", "image_68.png"],
    "metadata": {
      "detected_object_type": "wood sculpture",
      "estimated_price": "650 - 850 EUR"
    }
  },
  {
    "id": "image_53",
    "product_name": "Large Detailed Mechanical Relief Panel",
    "enhanced_image_filename": "image_63.png",
    "metadata": {
      "detected_object_type": "wood relief carving",
      "estimated_price": "400 - 550 EUR"
    }
  },
  {
    "id": "image_54",
    "product_name": "Revolver with Alien Figures Relief",
    "enhanced_image_filename": "image_64.png",
    "metadata": {
      "detected_object_type": "wood relief carving",
      "estimated_price": "350 - 450 EUR"
    }
  },
  {
    "id": "image_55",
    "product_name": "Large Two-Toned Mushroom Sculpture",
    "images": ["image_65.png", "image_66.png"],
    "metadata": {
      "detected_object_type": "wood sculpture",
      "estimated_price": "280 - 380 EUR"
    }
  },
  {
    "id": "image_59",
    "product_name": "Dragon Sculpture on Stump",
    "enhanced_image_filename": "image_69.png",
    "metadata": {
      "detected_object_type": "wood sculpture on stump",
      "estimated_price": "450 - 600 EUR"
    }
  },
  {
    "id": "image_60",
    "product_name": "Small Wooden Alien Sculpture",
    "images": ["image_70.png", "image_71.png"],
    "metadata": {
      "detected_object_type": "wood sculpture",
      "estimated_price": "180 - 250 EUR"
    }
  }
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function getCategory(objectType) {
  if (objectType.includes('sculpture') || objectType.includes('bust')) {
    return 'SCULPTURES';
  }
  if (objectType.includes('relief') || objectType.includes('carving')) {
    return 'WALL_CARVINGS';
  }
  return 'SCULPTURES';
}

function getImageOrientation(objectType) {
  if (objectType.includes('sculpture') || objectType.includes('bust')) {
    return 'portrait';
  }
  if (objectType.includes('relief') || objectType.includes('carving')) {
    return 'landscape';
  }
  return 'square';
}

function extractPrice(priceRange) {
  if (!priceRange) return 50000; // Default 500 EUR
  const match = priceRange.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    return parseInt(match[2]) * 100; // Use higher price, convert to cents
  }
  const singleMatch = priceRange.match(/(\d+)/);
  if (singleMatch) {
    return parseInt(singleMatch[1]) * 100;
  }
  return 50000;
}

async function addProducts() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const productData of products) {
      const slug = slugify(productData.product_name);
      const category = getCategory(productData.metadata.detected_object_type);
      const priceCents = extractPrice(productData.metadata.estimated_price);
      const imageOrientation = getImageOrientation(productData.metadata.detected_object_type);
      
      // Check if product already exists
      const existing = await client.query(
        'SELECT id FROM products WHERE slug = $1',
        [slug]
      );
      
      if (existing.rows.length > 0) {
        console.log(`⚠️  Product ${slug} already exists, skipping...`);
        continue;
      }
      
      // Create product
      const productResult = await client.query(
        `INSERT INTO products (slug, category, price_cents, status, image_orientation)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [slug, category, priceCents, 'AVAILABLE', imageOrientation]
      );
      
      const productId = productResult.rows[0].id;
      
      // Add translations
      const productNameSk = productData.product_name
        .replace('Wooden', 'Drevený')
        .replace('Sculpture', 'Socha')
        .replace('Relief', 'Reliéf')
        .replace('Panel', 'Panel')
        .replace('Bust', 'Busta')
        .replace('Large', 'Veľká')
        .replace('Small', 'Malá')
        .replace('Full Body', 'Celé telo')
        .replace('Deep', 'Hluboký')
        .replace('Modern', 'Moderný')
        .replace('Head', 'Hlava')
        .replace('Alien', 'Mimozemšťan')
        .replace('Dragon', 'Drak')
        .replace('Fish', 'Ryba')
        .replace('Piranha', 'Piráňa')
        .replace('Fantasy Creature', 'Fantasy bytosť')
        .replace('Plant', 'Rastlina')
        .replace('Dwarf Miner', 'Trpaslík baník')
        .replace('Stylized Woman', 'Štýlizovaná žena')
        .replace('Mechanical', 'Mechanický')
        .replace('Xenomorph', 'Xenomorph')
        .replace('Set of', 'Sada')
        .replace('Wooden Mushrooms', 'Drevené húby')
        .replace('Mushroom', 'Hub')
        .replace('Predator vs Alien Battle', 'Predátor vs Mimozemšťan bitka')
        .replace('Detailed Mechanical', 'Detailný mechanický')
        .replace('Revolver with Alien Figures', 'Revolver s mimozemskými figúrami')
        .replace('Two-Toned', 'Dvojfarebný')
        .replace('on Stump', 'na paňezi');
      
      const descriptionSk = `Jedinečná ručne vyrobená ${productData.metadata.detected_object_type === 'wood sculpture' ? 'drevená socha' : 'drevená reliéfna rezba'} od Igora Mráza.`;
      const descriptionEn = `Unique handcrafted ${productData.metadata.detected_object_type === 'wood sculpture' ? 'wooden sculpture' : 'wooden relief carving'} by Igor Mráz.`;
      
      // Insert SK translation
      await client.query(
        `INSERT INTO product_translations (product_id, locale, title, description_short)
         VALUES ($1, 'sk', $2, $3)`,
        [productId, productNameSk, descriptionSk]
      );
      
      // Insert EN translation
      await client.query(
        `INSERT INTO product_translations (product_id, locale, title, description_short)
         VALUES ($1, 'en', $2, $3)`,
        [productId, productData.product_name, descriptionEn]
      );
      
      // Add category tag
      await client.query(
        `INSERT INTO product_tags (product_id, tag) VALUES ($1, $2)`,
        [productId, category]
      );
      
      // Add additional tags based on product name
      if (productData.product_name.toLowerCase().includes('alien') || 
          productData.product_name.toLowerCase().includes('predator') ||
          productData.product_name.toLowerCase().includes('xenomorph')) {
        await client.query(
          `INSERT INTO product_tags (product_id, tag) VALUES ($1, 'FANTASY_MYTH')`,
          [productId]
        );
      }
      
      if (productData.product_name.toLowerCase().includes('mushroom') ||
          productData.product_name.toLowerCase().includes('plant')) {
        await client.query(
          `INSERT INTO product_tags (product_id, tag) VALUES ($1, 'NATURE_INSPIRED')`,
          [productId]
        );
      }
      
      console.log(`✅ Added product: ${productData.product_name} (${productId})`);
    }
    
    await client.query('COMMIT');
    console.log('\n✅ All products added successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding products:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addProducts().catch(console.error);
