import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Product from '../models/Product.js';
import ShopTheLook from '../models/ShopTheLook.js';
import PageSection from '../models/PageSection.js';
import Order from '../models/Order.js';
import ReturnRequest from '../models/ReturnRequest.js';
import Review from '../models/Review.js';
import Policy from '../models/Policy.js';
import { DEFAULT_POLICIES } from '../controllers/policyController.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Starting database seeding process...');

    // 1. Seed Admin User
    const adminPhone = process.env.ADMIN_INITIAL_PHONE || '8801700000000';
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@vantero.com';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123456';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: 'Vantero Super Admin',
        phone: adminPhone,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        savedAddresses: [
          {
            recipientName: 'Vantero Headquarters',
            phone: adminPhone,
            streetAddress: 'House 42, Road 11, Block D, Banani',
            city: 'Dhaka',
            district: 'Dhaka',
            postalCode: '1213',
            label: 'Office',
            isDefault: true
          }
        ]
      },
      { upsert: true, new: true }
    );
    console.log(`[Seed] Admin user seeded (${adminEmail} / ${adminPhone})`);

    // 2. Seed Categories
    await Category.deleteMany({});
    await SubCategory.deleteMany({});

    const categoriesData = [
      {
        name: 'Footwear & Sneakers',
        slug: 'sneakers',
        description: 'Iconic low-top and high-top sneakers, crafted with Italian leather and vulcanized soles.',
        featured: true,
        displayOrder: 1,
        image: {
          url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1000',
          publicId: 'seed/categories/sneakers'
        },
        subCategories: [
          { name: 'Court Low', slug: 'court-low', description: 'Low-profile court classics' },
          { name: 'High Top', slug: 'high-top', description: 'Padded ankle silhouettes' },
          { name: 'Loafers & Dress', slug: 'loafers-dress', description: 'Polished calfskin formal wear' },
          { name: 'Runners', slug: 'runners', description: 'Performance athletic lifestyle' }
        ]
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Tailored trousers, heavy wool overcoats, and luxury minimalist essentials.',
        featured: true,
        displayOrder: 2,
        image: {
          url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1000',
          publicId: 'seed/categories/clothing'
        },
        subCategories: [
          { name: 'Overcoats & Jackets', slug: 'jackets-overcoats', description: 'Heavyweight wool outerwear' },
          { name: 'Trousers & Pants', slug: 'trousers', description: 'Relaxed and tailored trousers' },
          { name: 'T-Shirts & Tops', slug: 't-shirts', description: 'Heavyweight 280gsm cotton tees' },
          { name: 'Knitwear & Hoodies', slug: 'knitwear-hoodies', description: 'Cashmere blends and loopback hoodies' }
        ]
      },
      {
        name: 'Fragrance',
        slug: 'fragrance',
        description: 'Niche Extrait de Parfum and Eau de Parfum blended with rich oud, amber, and rare woods.',
        featured: true,
        displayOrder: 3,
        image: {
          url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1000',
          publicId: 'seed/categories/fragrance'
        },
        subCategories: [
          { name: 'Extrait de Parfum', slug: 'extrait-de-parfum', description: 'Pure 30% concentration extrait' },
          { name: 'Discovery Sets', slug: 'discovery-sets', description: 'Sample sets of signature scents' }
        ]
      },
      {
        name: 'Lifestyle & Leather',
        slug: 'lifestyle',
        description: 'Full-grain leather accessories, weekender luggage, and everyday essentials.',
        featured: true,
        displayOrder: 4,
        image: {
          url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1000',
          publicId: 'seed/categories/lifestyle'
        },
        subCategories: [
          { name: 'Bags & Luggage', slug: 'bags-luggage', description: 'Bespoke duffle and weekender bags' },
          { name: 'Wallets & Cardholders', slug: 'wallets', description: 'Slim bifold and cardholders' },
          { name: 'Accessories & Eyewear', slug: 'accessories', description: 'Handcrafted acetate sunglasses and hats' }
        ]
      },
      {
        name: 'The Boys Edit',
        slug: 'the-boys-edit',
        description: 'Miniature luxury tailoring and sneakers made with the same uncompromising standards.',
        featured: true,
        displayOrder: 5,
        image: {
          url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=1000',
          publicId: 'seed/categories/the-boys-edit'
        },
        subCategories: [
          { name: 'Boys Footwear', slug: 'boys-footwear', description: 'Junior sneaker silhouettes' },
          { name: 'Boys Clothing', slug: 'boys-clothing', description: 'Miniature luxury essentials' }
        ]
      }
    ];

    const categoryMap = {};
    const subCategoryMap = {};

    for (const catData of categoriesData) {
      const { subCategories, ...catFields } = catData;
      const catDoc = await Category.create(catFields);
      categoryMap[catDoc.slug] = catDoc._id;

      if (subCategories && subCategories.length > 0) {
        for (const sub of subCategories) {
          const subDoc = await SubCategory.create({
            ...sub,
            category: catDoc._id
          });
          subCategoryMap[sub.slug] = subDoc._id;
        }
      }
    }
    console.log('[Seed] Categories and sub-categories seeded.');

    // 3. Seed Products
    await Product.deleteMany({});

    const productsData = [
      {
        title: 'Court Low — Chalk / Gum',
        slug: 'court-low-chalk-gum',
        sku: 'VT-SNK-001',
        category: categoryMap['sneakers'],
        subCategory: subCategoryMap['court-low'],
        basePrice: 18500,
        discount: {
          discountType: 'percentage',
          discountValue: 15, // -15%
          discountStart: new Date(Date.now() - 86400000),
          discountEnd: new Date(Date.now() + 30 * 86400000)
        },
        isFeatured: true,
        salesCount: 84,
        description: 'The defining Vantero silhouette. Handcrafted in Porto with full-grain Italian Nappa calfskin, custom cream waxed laces, and durable amber gum Margom outsoles.',
        details: [
          'Full-grain Italian Nappa calfskin leather upper',
          'Margom natural gum rubber outsole (stitched)',
          'Calfskin lining and cushioned removable insole',
          'Subtle gold foil Vantero branding on heel tab',
          'Includes dust bag and spare tonal laces'
        ],
        tags: ['Sneakers', 'Court', 'Handmade', 'Best Seller'],
        media: [
          {
            url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200',
            type: 'image',
            order: 0,
            publicId: 'seed/products/court-low-1'
          },
          {
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            type: 'video',
            order: 1,
            publicId: 'seed/products/court-low-video'
          },
          {
            url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&q=80&w=1200',
            type: 'image',
            order: 2,
            publicId: 'seed/products/court-low-2'
          },
          {
            url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1200',
            type: 'image',
            order: 3,
            publicId: 'seed/products/court-low-3'
          }
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/court-low-1',
            isPrimary: true
          },
          {
            url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/court-low-2'
          },
          {
            url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/court-low-3'
          }
        ],
        variants: [
          { size: '40', color: 'Chalk / Gum', sku: 'VT-SNK-001-40-CG', stock: 5 },
          { size: '41', color: 'Chalk / Gum', sku: 'VT-SNK-001-41-CG', stock: 12 },
          { size: '42', color: 'Chalk / Gum', sku: 'VT-SNK-001-42-CG', stock: 8 },
          { size: '43', color: 'Chalk / Gum', sku: 'VT-SNK-001-43-CG', stock: 6 },
          { size: '44', color: 'Chalk / Gum', sku: 'VT-SNK-001-44-CG', stock: 4 },
          { size: '40', color: 'Black', sku: 'VT-SNK-001-40-BK', stock: 7 },
          { size: '41', color: 'Black', sku: 'VT-SNK-001-41-BK', stock: 10 },
          { size: '42', color: 'Black', sku: 'VT-SNK-001-42-BK', stock: 5 },
          { size: '43', color: 'Black', sku: 'VT-SNK-001-43-BK', stock: 0 },
          { size: '44', color: 'Black', sku: 'VT-SNK-001-44-BK', stock: 3 }
        ]
      },
      {
        title: 'Wool Overcoat — Charcoal',
        slug: 'wool-overcoat-charcoal',
        sku: 'VT-CLO-001',
        category: categoryMap['clothing'],
        subCategory: subCategoryMap['jackets-overcoats'],
        basePrice: 28500, // Matches Figma Hero hotspot tag exactly!
        discount: {
          discountType: 'none',
          discountValue: 0
        },
        isFeatured: true,
        salesCount: 38,
        description: 'Impeccably tailored double-breasted overcoat cut from 680gsm recycled double-faced wool. Features horn buttons, deep flap pockets, and an unrestrictive back vent.',
        details: [
          '680gsm double-faced Virgin Wool blend',
          'Natural buffalo horn buttons with engraved underside',
          'Interior breast passport pocket with welt closure',
          'Cupro sleeve lining for seamless layering',
          'Dry clean only'
        ],
        tags: ['Outerwear', 'Wool', 'Tailoring', 'Figma Hero'],
        media: [
          {
            url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=1200',
            type: 'image',
            order: 0,
            publicId: 'seed/products/wool-overcoat-1'
          },
          {
            url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1200',
            type: 'image',
            order: 1,
            publicId: 'seed/products/wool-overcoat-2'
          }
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/wool-overcoat-1',
            isPrimary: true
          },
          {
            url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/wool-overcoat-2'
          }
        ],
        variants: [
          { size: 'S', color: 'Charcoal', sku: 'VT-CLO-001-S-CH', stock: 4 },
          { size: 'M', color: 'Charcoal', sku: 'VT-CLO-001-M-CH', stock: 8 },
          { size: 'L', color: 'Charcoal', sku: 'VT-CLO-001-L-CH', stock: 6 },
          { size: 'XL', color: 'Charcoal', sku: 'VT-CLO-001-XL-CH', stock: 3 },
          { size: 'S', color: 'Tan', sku: 'VT-CLO-001-S-TN', stock: 5 },
          { size: 'M', color: 'Tan', sku: 'VT-CLO-001-M-TN', stock: 6 },
          { size: 'L', color: 'Tan', sku: 'VT-CLO-001-L-TN', stock: 2 },
          { size: 'XL', color: 'Tan', sku: 'VT-CLO-001-XL-TN', stock: 0 }
        ]
      },
      {
        title: 'Pleated Tailored Trousers — Oat',
        slug: 'pleated-tailored-trousers-oat',
        sku: 'VT-CLO-002',
        category: categoryMap['clothing'],
        subCategory: subCategoryMap['trousers'],
        basePrice: 12500,
        discount: {
          discountType: 'flat',
          discountValue: 1500, // ৳1,500 OFF
          discountStart: new Date(Date.now() - 86400000),
          discountEnd: new Date(Date.now() + 14 * 86400000)
        },
        isFeatured: true,
        salesCount: 45,
        description: 'Single-pleat tailored trousers engineered with a relaxed tapered drape. Crafted from premium breathable tropical wool with side tab adjusters.',
        details: [
          '100% fine tropical wool weave (crease-resistant)',
          'Side buckle waist tab adjusters (belt-free aesthetic)',
          'Horn button front closure with hidden hook & bar',
          'Blind hemmed with 3cm seam allowance for custom tailoring'
        ],
        tags: ['Trousers', 'Tailoring', 'Oat', 'Essentials'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/trousers-1',
            isPrimary: true
          }
        ],
        variants: [
          { size: '30', color: 'Oat', sku: 'VT-CLO-002-30', stock: 6 },
          { size: '32', color: 'Oat', sku: 'VT-CLO-002-32', stock: 10 },
          { size: '34', color: 'Oat', sku: 'VT-CLO-002-34', stock: 8 },
          { size: '36', color: 'Oat', sku: 'VT-CLO-002-36', stock: 4 }
        ]
      },
      {
        title: 'Nocturne Extrait de Parfum (100ml)',
        slug: 'nocturne-extrait-de-parfum-100ml',
        sku: 'VT-FRG-001',
        category: categoryMap['fragrance'],
        subCategory: subCategoryMap['extrait-de-parfum'],
        basePrice: 16000,
        discount: {
          discountType: 'percentage',
          discountValue: 20, // -20%
          discountStart: new Date(Date.now() - 86400000),
          discountEnd: new Date(Date.now() + 20 * 86400000)
        },
        isFeatured: true,
        salesCount: 72,
        description: 'A dark, intoxicating olfactory portrait of midnight Dhaka. Top notes of smoked cardamom and black pepper open into an opulent heart of Bulgarian rose, aged leather, and pure Cambodian oud.',
        details: [
          'High concentration 32% pure Extrait de Parfum',
          'Heavyweight tinted glass flacon with magnetic gold-plated zamak cap',
          'Top Notes: Guatemalan Cardamom, Black Szechuan Pepper',
          'Heart Notes: Smoked Leather, Damask Rose',
          'Base Notes: Cambodian Oud, Ambergris, Bourbon Vanilla'
        ],
        tags: ['Fragrance', 'Extrait', 'Oud', 'Luxury Scent'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/nocturne-1',
            isPrimary: true
          }
        ],
        variants: [
          { size: '50ml', color: 'Midnight Tint', sku: 'VT-FRG-001-50', stock: 14, additionalPrice: -4000 },
          { size: '100ml', color: 'Midnight Tint', sku: 'VT-FRG-001-100', stock: 20 }
        ]
      },
      {
        title: 'Monogram Leather Weekender — Espresso',
        slug: 'monogram-leather-weekender-espresso',
        sku: 'VT-ACC-001',
        category: categoryMap['lifestyle'],
        subCategory: subCategoryMap['bags-luggage'],
        basePrice: 34000,
        discount: {
          discountType: 'none',
          discountValue: 0
        },
        isFeatured: true,
        salesCount: 22,
        description: 'Handmade full-grain Tuscan vegetable-tanned leather duffle bag designed for discerning weekend journeys. Features solid brass hardware and an interior reinforced shoe compartment.',
        details: [
          'Full-grain vegetable-tanned Italian leather (develops rich patina)',
          'Heavy-gauge YKK Excella two-way brass zippers',
          'Separate exterior zipped compartment for shoes/sneakers',
          'Detachable padded leather shoulder strap',
          'Dimensions: 50cm × 28cm × 26cm (Cabin overhead compliant)'
        ],
        tags: ['Leather', 'Luggage', 'Travel', 'Bespoke'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/weekender-1',
            isPrimary: true
          }
        ],
        variants: [
          { size: 'Free Size', color: 'Espresso Brown', sku: 'VT-ACC-001-ESP', stock: 5 },
          { size: 'Free Size', color: 'Noir Black', sku: 'VT-ACC-001-NOIR', stock: 7 }
        ]
      },
      {
        title: 'Heavyweight Boxy Tee — Bone',
        slug: 'heavyweight-boxy-tee-bone',
        sku: 'VT-CLO-003',
        category: categoryMap['clothing'],
        subCategory: subCategoryMap['t-shirts'],
        basePrice: 4500,
        discount: {
          discountType: 'none',
          discountValue: 0
        },
        isFeatured: true,
        salesCount: 110,
        description: 'The definitive daily luxury t-shirt. Spun from 280gsm organic combed cotton jersey with a structured drop-shoulder drape and dense ribbed collar.',
        details: [
          '280gsm 100% organic long-staple combed cotton',
          'Pre-shrunk enzyme washed for soft handfeel',
          'Thick 2.5cm ribbed collar (retains shape wash after wash)',
          'Blind stitched cuffs and hem'
        ],
        tags: ['Tee', 'Cotton', 'Essentials', 'Drop Shoulder'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/tee-bone-1',
            isPrimary: true
          }
        ],
        variants: [
          { size: 'S', color: 'Bone', sku: 'VT-CLO-003-S', stock: 15 },
          { size: 'M', color: 'Bone', sku: 'VT-CLO-003-M', stock: 25 },
          { size: 'L', color: 'Bone', sku: 'VT-CLO-003-L', stock: 20 },
          { size: 'XL', color: 'Bone', sku: 'VT-CLO-003-XL', stock: 12 }
        ]
      },
      {
        title: 'Junior Court Low — Chalk White',
        slug: 'junior-court-low-chalk-white',
        sku: 'VT-BOY-001',
        category: categoryMap['the-boys-edit'],
        subCategory: subCategoryMap['boys-footwear'],
        basePrice: 9500,
        discount: {
          discountType: 'percentage',
          discountValue: 10,
          discountStart: new Date(Date.now() - 86400000),
          discountEnd: new Date(Date.now() + 30 * 86400000)
        },
        isFeatured: true,
        salesCount: 30,
        description: 'Scaled for young gentlemen. Constructed with supple white calfskin and a flexible rubber sole that withstands active days without compromising silhouette.',
        details: [
          'Supple Italian calfskin upper with reinforced toe cap',
          'Lightweight flexible rubber cupsole',
          'Antibacterial leather insole',
          'Padded tongue and ankle collar'
        ],
        tags: ['The Boys Edit', 'Junior Sneakers', 'Miniature Luxury'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=1200',
            publicId: 'seed/products/junior-court-1',
            isPrimary: true
          }
        ],
        variants: [
          { size: '32', color: 'Chalk White', sku: 'VT-BOY-001-32', stock: 8 },
          { size: '34', color: 'Chalk White', sku: 'VT-BOY-001-34', stock: 10 },
          { size: '36', color: 'Chalk White', sku: 'VT-BOY-001-36', stock: 6 }
        ]
      }
    ];

    const productDocs = await Product.create(productsData);
    console.log(`[Seed] ${productDocs.length} products seeded.`);

    // 4. Seed Shop the Look Bundle
    await ShopTheLook.deleteMany({});

    const courtLow = productDocs.find(p => p.slug === 'court-low-chalk-gum');
    const overcoat = productDocs.find(p => p.slug === 'wool-overcoat-charcoal');
    const trousers = productDocs.find(p => p.slug === 'pleated-tailored-trousers-oat');
    const fragrance = productDocs.find(p => p.slug === 'nocturne-extrait-de-parfum-100ml');

    await ShopTheLook.create([
      {
        title: 'Wear Your Identity: The AW26 Tailored Edit',
        subtitle: 'Curated Ensemble',
        slug: 'wear-your-identity-aw26',
        description: 'The cornerstone look of the Autumn / Winter 2026 collection. A seamless union of relaxed Italian tailoring, tactile wool outerwear, handcrafted court footwear, and an unforgettable olfactory signature.',
        coverImage: {
          url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1600',
          publicId: 'seed/looks/signature-look'
        },
        displayOrder: 1,
        isActive: true,
        products: [
          {
            product: overcoat._id,
            displayOrder: 1,
            hotspot: { top: 35, left: 45 },
            customNote: 'Hero Outerwear: 680gsm Double-Faced Charcoal Wool'
          },
          {
            product: trousers._id,
            displayOrder: 2,
            hotspot: { top: 62, left: 52 },
            customNote: 'Single-Pleat Relaxed Tailored Trousers in Oat'
          },
          {
            product: courtLow._id,
            displayOrder: 3,
            hotspot: { top: 88, left: 42 },
            customNote: 'Handmade Court Low with Natural Margom Gum Sole'
          },
          {
            product: fragrance._id,
            displayOrder: 4,
            hotspot: { top: 22, left: 65 },
            customNote: 'Smoked Leather & Oud Extrait de Parfum'
          }
        ]
      }
    ]);
    console.log('[Seed] Shop the Look bundle seeded.');

    // 5. Seed 100% Dynamic CMS PageSections matching Figma
    await PageSection.deleteMany({});

    const sectionsData = [
      {
        sectionKey: 'top_bar',
        sectionName: 'Top Announcement Bar',
        title: 'Cash on delivery nationwide · Free delivery in Dhaka over ৳5,000 · 7-day free exchanges',
        isActive: true,
        displayOrder: 0
      },
      {
        sectionKey: 'hero',
        sectionName: 'Hero Showcase',
        badgeText: 'New season · Autumn / Winter 2026',
        title: 'Wear your identity.',
        description: 'Authentic sneakers, shoes, clothing and fragrance for men and boys. Cash on delivery, 7-day exchanges.',
        ctaText: 'Shop the Collection',
        ctaLink: '/shop',
        secondaryCtaText: 'Explore Lookbook',
        secondaryCtaLink: '/look/wear-your-identity-aw26',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1800',
            publicId: 'hero/seed-hero-1.jpg',
            label: 'Desktop Hero Editorial'
          }
        ],
        contentData: {
          slides: [
            {
              id: 'slide-1',
              title: 'Wear your identity.',
              subtitle: 'AUTUMN / WINTER 2026',
              badgeText: 'New season · AW26 Capsule',
              description: 'Handcrafted Italian leather sneakers, tailored overcoats, and niche extrait de parfum for men and boys. Cash on delivery nationwide.',
              ctaText: 'Shop the Collection',
              ctaLink: '/shop',
              secondaryCtaText: 'Explore Lookbook',
              secondaryCtaLink: '/look/wear-your-identity-aw26',
              image: {
                url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1800',
                publicId: 'hero/seed-hero-1.jpg',
                alt: 'Vantero Autumn Winter 2026 Editorial'
              },
              isActive: true,
              displayOrder: 1
            },
            {
              id: 'slide-2',
              title: 'The Architectural Silhouette.',
              subtitle: 'MENSWEAR TAILORING',
              badgeText: 'Limited Atelier Edition',
              description: 'Double-breasted wool overcoats and pleated trousers tailored for the modern Bangladeshi gentleman.',
              ctaText: 'Discover Clothing',
              ctaLink: '/shop?category=clothing',
              secondaryCtaText: 'View Outerwear',
              secondaryCtaLink: '/shop?category=clothing',
              image: {
                url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1800',
                publicId: 'hero/seed-hero-2.jpg',
                alt: 'Tailored Luxury Menswear'
              },
              isActive: true,
              displayOrder: 2
            },
            {
              id: 'slide-3',
              title: 'Vulcanized Mastery.',
              subtitle: 'FOOTWEAR SERIES',
              badgeText: 'Bestseller · Court Low',
              description: 'Italian calfskin low-tops designed with reinforced cushioning, durable rubber cupsoles, and hand-finished edges.',
              ctaText: 'Shop Footwear',
              ctaLink: '/shop?category=sneakers',
              secondaryCtaText: 'Inspect Sizing',
              secondaryCtaLink: '/shop?category=sneakers',
              image: {
                url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1800',
                publicId: 'hero/seed-hero-3.jpg',
                alt: 'Handcrafted Luxury Sneakers'
              },
              isActive: true,
              displayOrder: 3
            },
            {
              id: 'slide-4',
              title: 'Nocturne Extrait de Parfum.',
              subtitle: 'NICHE ARTISANAL FRAGRANCES',
              badgeText: 'Pure Extrait · 35% Concentration',
              description: 'Rare aged Cambodian oud, smoked birchwood, and dark amber blended for tropical evening longevity.',
              ctaText: 'Explore Fragrances',
              ctaLink: '/shop?category=fragrance',
              secondaryCtaText: 'Olfactory Notes',
              secondaryCtaLink: '/shop?category=fragrance',
              image: {
                url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1800',
                publicId: 'hero/seed-hero-4.jpg',
                alt: 'Nocturne Artisanal Extrait de Parfum'
              },
              isActive: true,
              displayOrder: 4
            }
          ]
        },
        isActive: true,
        displayOrder: 1
      },
      {
        sectionKey: 'trust_strip',
        sectionName: 'Trust & Authenticity Strip',
        isActive: true,
        displayOrder: 2,
        contentData: {
          items: [
            {
              icon: 'credit-card',
              title: 'Cash on delivery',
              subtitle: 'Nationwide · Pay at your doorstep upon inspection'
            },
            {
              icon: 'truck',
              title: 'Free delivery in Dhaka',
              subtitle: 'Next-day courier on orders over ৳5,000'
            },
            {
              icon: 'rotate-ccw',
              title: '7-day free exchanges',
              subtitle: 'Unworn items in original packaging · we collect'
            },
            {
              icon: 'shield-check',
              title: 'Authentic, or refunded',
              subtitle: 'Every pair checked by hand and verified'
            }
          ]
        }
      },
      {
        sectionKey: 'featured_categories',
        sectionName: 'Category Navigation Grid',
        title: 'Curated Categories',
        subtitle: 'Explore the Vantero universe',
        isActive: true,
        displayOrder: 3
      },
      {
        sectionKey: 'new_arrivals',
        sectionName: 'New Arrivals Showcase',
        title: 'New In: Autumn / Winter 2026',
        subtitle: 'The latest drops crafted with artisanal precision',
        ctaText: 'View All New In',
        ctaLink: '/shop?sort=newest',
        isActive: true,
        displayOrder: 4
      },
      {
        sectionKey: 'collectors_edit',
        sectionName: 'Collector’s Edit Banner',
        badgeText: 'Numbered Artisanal Editions',
        title: 'The Collector’s Edit',
        description: 'Hand-dyed hides, rare botanical extraits, and limited batch runs crafted for connoisseurs of understated luxury.',
        ctaText: 'Discover The Edit',
        ctaLink: '/shop?category=lifestyle',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1600',
            publicId: 'seed/cms/collectors-edit',
            label: 'Banner'
          }
        ],
        isActive: true,
        displayOrder: 5
      },
      {
        sectionKey: 'shop_the_look',
        sectionName: 'Shop the Look Showcase',
        title: 'Shop the Look',
        subtitle: 'Artfully composed silhouettes ready to wear together',
        isActive: true,
        displayOrder: 6
      },
      {
        sectionKey: 'footwear_shelf',
        sectionName: 'Footwear Spotlight',
        title: 'Footwear Built to Last',
        subtitle: 'Italian calfskin uppers mounted on durable stitched Margom outsoles',
        ctaText: 'Explore Footwear',
        ctaLink: '/shop?category=sneakers',
        isActive: true,
        displayOrder: 7
      },
      {
        sectionKey: 'fragrance_feature',
        sectionName: 'Fragrance Feature Story',
        badgeText: 'Pure Extrait Formulation',
        title: 'Sensory Identity',
        description: 'Potent 30%+ perfume extraits blended with wild-harvested resins, spice essences, and pure aged oud.',
        ctaText: 'Experience Scent',
        ctaLink: '/shop?category=fragrance',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1400',
            publicId: 'seed/cms/fragrance-story'
          }
        ],
        isActive: true,
        displayOrder: 8
      },
      {
        sectionKey: 'newsletter',
        sectionName: 'VIP Private Access Newsletter',
        title: 'Join the Inner Circle',
        subtitle: 'Receive private drop invitations, editorial features, and concierge fittings.',
        ctaText: 'Subscribe',
        isActive: true,
        displayOrder: 9
      },
      {
        sectionKey: 'footer',
        sectionName: 'Global Footer Content',
        title: 'VANTERO',
        description: 'Bespoke modern menswear, handcrafted footwear, and niche artisanal fragrances in Bangladesh.',
        contentData: {
          hotline: '+880 1700-000000',
          email: 'concierge@vantero.com',
          storeAddress: 'Road 11, Banani, Dhaka 1213, Bangladesh',
          codNotice: 'Cash on delivery accepted nationwide. Every parcel inspected before dispatch.'
        },
        isActive: true,
        displayOrder: 10
      }
    ];

    await PageSection.create(sectionsData);
    console.log(`[Seed] ${sectionsData.length} dynamic CMS sections seeded.`);

    // 6. Seed Sample Initial Order for demonstration & analytics
    await Order.deleteMany({});
    const initialOrderNumber = 'VT-20261124-7891';
    // 6. Seed Sample Orders and Post-Delivery Return Request
    await Order.deleteMany({});
    await ReturnRequest.deleteMany({});

    const adminUser = await User.findOne({ email: adminEmail });

    // Order 1: Active Shipped Order for Live Tracking Demo
    await Order.create({
      orderNumber: initialOrderNumber,
      customer: adminUser._id,
      items: [
        {
          product: courtLow._id,
          title: courtLow.title,
          image: courtLow.images[0].url,
          size: '42',
          color: 'Chalk / Gum',
          quantity: 1,
          unitPrice: 15725, // discounted
          originalPrice: 18500,
          sku: 'VT-SNK-001-42'
        },
        {
          product: fragrance._id,
          title: fragrance.title,
          image: fragrance.images[0].url,
          size: '100ml',
          color: 'Midnight Tint',
          quantity: 1,
          unitPrice: 12800, // discounted
          originalPrice: 16000,
          sku: 'VT-FRG-001-100'
        }
      ],
      shippingAddress: {
        recipientName: 'Tanzim Ahmed',
        phone: '8801712345678',
        streetAddress: 'Apartment 5B, Road 7, Dhanmondi',
        city: 'Dhaka',
        district: 'Dhaka',
        postalCode: '1205'
      },
      subtotal: 28525,
      deliveryFee: 0, // Free delivery in Dhaka over ৳5000
      discountAmount: 5975,
      totalAmount: 28525,
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      orderStatus: 'shipped',
      courier: {
        name: 'Steadfast Courier',
        trackingCode: 'ST-98234102',
        trackingUrl: 'https://steadfast.com.bd/t/ST-98234102'
      },
      trackingTimeline: [
        {
          status: 'pending',
          title: 'Order Placed (Pending Confirmation)',
          note: 'Customer requested Cash on Delivery delivery in Dhanmondi.',
          timestamp: new Date(Date.now() - 36 * 3600000),
          updatedBy: 'System'
        },
        {
          status: 'confirmed',
          title: 'Order Confirmed',
          note: 'Phone verification completed with customer.',
          timestamp: new Date(Date.now() - 24 * 3600000),
          updatedBy: 'Vantero Concierge'
        },
        {
          status: 'processing',
          title: 'Packed & Quality Verified',
          note: 'Inspected under studio lighting and sealed with wax seal.',
          timestamp: new Date(Date.now() - 12 * 3600000),
          updatedBy: 'Fulfillment Team'
        },
        {
          status: 'shipped',
          title: 'Handed to Courier (Out for Delivery)',
          note: 'Handed to Steadfast Courier. Rider will contact before arrival.',
          timestamp: new Date(Date.now() - 2 * 3600000),
          updatedBy: 'Logistics Desk'
        }
      ]
    });
    console.log(`[Seed] Sample order ${initialOrderNumber} seeded for live tracking demo.`);

    // Order 2: Delivered Order within 7-day window with Active Return Request
    const deliveredOrderNumber = 'VT-20261122-4412';
    const deliveredDate = new Date(Date.now() - 2 * 86400000); // 2 days ago

    const deliveredOrder = await Order.create({
      orderNumber: deliveredOrderNumber,
      customer: adminUser._id,
      items: [
        {
          product: courtLow._id,
          title: courtLow.title,
          image: courtLow.images[0].url,
          size: '41',
          color: 'Chalk / Gum',
          quantity: 1,
          unitPrice: 15725,
          originalPrice: 18500,
          sku: 'VT-SNK-001-41'
        },
        {
          product: trousers._id,
          title: trousers.title,
          image: trousers.images[0].url,
          size: '32',
          color: 'Oat',
          quantity: 1,
          unitPrice: 12500,
          originalPrice: 12500,
          sku: 'VT-CLO-002-32'
        }
      ],
      shippingAddress: {
        recipientName: 'Sayed Karim',
        phone: '8801722334455',
        streetAddress: 'House 18, Road 4, Sector 3, Uttara',
        city: 'Dhaka',
        district: 'Dhaka',
        postalCode: '1230'
      },
      subtotal: 28225,
      deliveryFee: 0,
      discountAmount: 2775,
      totalAmount: 28225,
      paymentMethod: 'COD',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      deliveredAt: deliveredDate,
      hasReturnRequest: true,
      returnStatus: 'pending',
      courier: {
        name: 'Pathao Express',
        trackingCode: 'PTH-6677881',
        trackingUrl: 'https://pathao.com/tracking/PTH-6677881'
      },
      trackingTimeline: [
        {
          status: 'pending',
          title: 'Order Placed',
          note: 'Customer requested Cash on Delivery in Uttara.',
          timestamp: new Date(Date.now() - 5 * 86400000),
          updatedBy: 'System'
        },
        {
          status: 'confirmed',
          title: 'Order Confirmed',
          note: 'Phone confirmation received.',
          timestamp: new Date(Date.now() - 4 * 86400000),
          updatedBy: 'Vantero Concierge'
        },
        {
          status: 'shipped',
          title: 'Dispatched via Pathao Express',
          note: 'Parcel out for delivery.',
          timestamp: new Date(Date.now() - 3 * 86400000),
          updatedBy: 'Logistics'
        },
        {
          status: 'delivered',
          title: 'Delivered & Payment Received',
          note: 'Cash collected by courier rider. Thank you.',
          timestamp: deliveredDate,
          updatedBy: 'Pathao Courier'
        }
      ]
    });

    // Create Sample Return Request for Order 2
    const returnNumber = 'RET-VT-20261122-4412-1001';
    const sampleReturn = await ReturnRequest.create({
      returnNumber,
      order: deliveredOrder._id,
      orderNumber: deliveredOrderNumber,
      customer: adminUser._id,
      items: [
        {
          product: courtLow._id,
          title: courtLow.title,
          image: courtLow.images[0].url,
          size: '41',
          color: 'Chalk / Gum',
          quantity: 1,
          unitPrice: 15725,
          totalRefund: 15725,
          reason: 'size_fit_issue'
        }
      ],
      totalReturnQuantity: 1,
      totalReturnAmount: 15725,
      customerReason: 'size_fit_issue',
      customerNotes: 'Sneakers fit slightly tight on the instep. Need doorstep exchange for size 42.',
      proofImages: [
        {
          url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800',
          publicId: 'returns/sample-court-41.jpg'
        }
      ],
      status: 'pending',
      timeline: [
        {
          status: 'pending',
          title: 'Return Request Under Review',
          note: 'Customer requested size exchange from 41 to 42 within 7-day post-delivery guarantee.',
          timestamp: new Date(Date.now() - 24 * 3600000),
          updatedBy: 'Sayed Karim'
        }
      ]
    });

    deliveredOrder.returnRequest = sampleReturn._id;
    await deliveredOrder.save();
    console.log(`[Seed] Sample delivered order ${deliveredOrderNumber} and return request ${returnNumber} seeded.`);
    console.log(`[Seed] Sample order ${initialOrderNumber} seeded for live tracking demo.`);

    // 8. Seed Customer Reviews (Admin-managed)
    await Review.deleteMany({});
    await Review.insertMany([
      {
        customerName: 'Faheem Rahman',
        customerLocation: 'Gulshan 2, Dhaka',
        rating: 5,
        title: 'European Luxury Craftsmanship in Dhaka',
        comment: 'The quality of the Italian Nappa leather rivals high-end European labels. Cash on delivery was seamless—arrived in 24 hours in Dhaka.',
        productName: 'Court Low — Chalk / Gum',
        categoryLabel: 'Sneakers',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        isPublished: true,
        sortOrder: 1
      },
      {
        customerName: 'Shahrier Kabir',
        customerLocation: 'Banani, Dhaka',
        rating: 5,
        title: 'Sensational Wool Drape & Tailoring',
        comment: 'The drape and weight of the double-faced wool is sensational. You can feel the craftsmanship in every stitch. Unmatched in Bangladesh.',
        productName: 'Wool Overcoat — Charcoal',
        categoryLabel: 'Apparel',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        isPublished: true,
        sortOrder: 2
      },
      {
        customerName: 'Tanvir Hossain',
        customerLocation: 'Dhanmondi, Dhaka',
        rating: 5,
        title: 'Exquisite Longevity and Magnetic Gold Cap',
        comment: 'A magnificent, deep Cambodian oud that lasts over 14 hours. The packaging with magnetic gold cap feels like pure luxury.',
        productName: 'Nocturne Extrait de Parfum',
        categoryLabel: 'Fragrance',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200',
        isPublished: true,
        sortOrder: 3
      },
      {
        customerName: 'Zubair Ahmed',
        customerLocation: 'Uttara, Dhaka',
        rating: 5,
        title: 'Impeccable Crease-Resistant Pleats',
        comment: 'The side adjusters and tropical wool fabric drape flawlessly without needing a belt. Exceptional craftsmanship and doorstep delivery.',
        productName: 'Pleated Tailored Trousers — Oat',
        categoryLabel: 'Apparel',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
        isPublished: true,
        sortOrder: 4
      }
    ]);
    console.log('[Seed] Customer reviews seeded.');

    // 9. Seed Legal Policies (Terms of Service, Privacy Policy, Refund Policy)
    await Policy.deleteMany({});
    for (const pol of Object.values(DEFAULT_POLICIES)) {
      await Policy.create({
        ...pol,
        lastUpdated: new Date(),
        isPublished: true
      });
    }
    console.log('[Seed] Legal policies seeded (Terms, Privacy, Refund).');

    console.log('[Seed] Database seeding completed successfully!\n');
  } catch (error) {
    console.error('[Seed Error]:', error);
  } finally {
    await closeDB();
  }
};

// Run directly if invoked from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
