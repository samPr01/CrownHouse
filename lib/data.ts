import womenProducts from "./women-products.json"
import { STOREFRONT_SUBCATEGORIES } from "./categories"
export interface Product {
  id: string
  slug: string
  name: string
  department?: string
  subcategory?: string
  brand?: string
  currency?: string
  sourceType?: string
  category: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  description: string
  details?: string[]
  discount?: number
  sizes?: { id?: string; name: string; price: number; originalPrice?: number; sku?: string; options?: Record<string, string>; outOfStock?: boolean }[]
  accordionInfo?: { title: string; content: string }[]
}

// Demonstration clothing catalog. Replace with verified product details before launch.
const DEMO_PRODUCTS: Product[] = [
  {
    "id": "1",
    "slug": "signature-cotton-trench",
    "name": "Signature Cotton Trench",
    "category": "Women",
    "price": 479,
    "rating": 0,
    "reviews": 0,
    "image": "/assets/product/trench-1.png",
    "description": "A clean silhouette, a relaxed fit, and a layer you can make your own.",
    "details": [
      "/assets/product/trench-2.png"
    ],
    "sizes": [
      {
        "name": "XS",
        "price": 479
      },
      {
        "name": "S",
        "price": 479
      },
      {
        "name": "M",
        "price": 479
      },
      {
        "name": "L",
        "price": 479
      },
      {
        "name": "XL",
        "price": 479
      }
    ],
    "accordionInfo": [
      {
        "title": "Fit & sizing",
        "content": "Choose your preferred size. Check the garment measurements before ordering."
      },
      {
        "title": "Care",
        "content": "Follow the care instructions on the garment label."
      }
    ]
  },
  {
    "id": "2",
    "slug": "essential-linen-shirt",
    "name": "Essential Linen Shirt",
    "category": "Men",
    "price": 75,
    "rating": 0,
    "reviews": 0,
    "image": "/assets/shop/category-apparel.png",
    "description": "An easy linen shirt for understated everyday dressing.",
    "details": [],
    "sizes": [
      {
        "name": "XS",
        "price": 75
      },
      {
        "name": "S",
        "price": 75
      },
      {
        "name": "M",
        "price": 75
      },
      {
        "name": "L",
        "price": 75
      },
      {
        "name": "XL",
        "price": 75
      }
    ],
    "accordionInfo": [
      {
        "title": "Fit & sizing",
        "content": "Choose your preferred size. Check the garment measurements before ordering."
      },
      {
        "title": "Care",
        "content": "Follow the care instructions on the garment label."
      }
    ]
  },
  {
    "id": "3",
    "slug": "tailored-minimalist-trouser",
    "name": "Tailored Minimalist Trouser",
    "category": "Men",
    "price": 145,
    "rating": 0,
    "reviews": 0,
    "image": "/assets/product/trouser-1.png",
    "description": "A considered tailored shape that moves from workdays to weekends.",
    "details": [
      "/assets/product/detail-trouser-1.png"
    ],
    "sizes": [
      {
        "name": "XS",
        "price": 145
      },
      {
        "name": "S",
        "price": 145
      },
      {
        "name": "M",
        "price": 145
      },
      {
        "name": "L",
        "price": 145
      },
      {
        "name": "XL",
        "price": 145
      }
    ],
    "accordionInfo": [
      {
        "title": "Fit & sizing",
        "content": "Choose your preferred size. Check the garment measurements before ordering."
      },
      {
        "title": "Care",
        "content": "Follow the care instructions on the garment label."
      }
    ]
  },
  {
    "id": "4",
    "slug": "relaxed-cotton-trench",
    "name": "Relaxed Cotton Trench",
    "category": "Men",
    "price": 489,
    "rating": 0,
    "reviews": 0,
    "image": "/assets/product/trench-2.png",
    "description": "A versatile outer layer with a modern, relaxed silhouette.",
    "details": [
      "/assets/product/trench-1.png"
    ],
    "sizes": [
      {
        "name": "XS",
        "price": 489
      },
      {
        "name": "S",
        "price": 489
      },
      {
        "name": "M",
        "price": 489
      },
      {
        "name": "L",
        "price": 489
      },
      {
        "name": "XL",
        "price": 489
      }
    ],
    "accordionInfo": [
      {
        "title": "Fit & sizing",
        "content": "Choose your preferred size. Check the garment measurements before ordering."
      },
      {
        "title": "Care",
        "content": "Follow the care instructions on the garment label."
      }
    ]
  },
  {
    "id": "5",
    "slug": "everyday-tailored-trouser",
    "name": "Everyday Tailored Trouser",
    "category": "Women",
    "price": 139,
    "rating": 0,
    "reviews": 0,
    "image": "/assets/product/trouser-1.png",
    "description": "Easy tailoring in a neutral palette, made for your everyday rotation.",
    "details": [
      "/assets/product/detail-trouser-1.png"
    ],
    "sizes": [
      {
        "name": "XS",
        "price": 139
      },
      {
        "name": "S",
        "price": 139
      },
      {
        "name": "M",
        "price": 139
      },
      {
        "name": "L",
        "price": 139
      },
      {
        "name": "XL",
        "price": 139
      }
    ],
    "accordionInfo": [
      {
        "title": "Fit & sizing",
        "content": "Choose your preferred size. Check the garment measurements before ordering."
      },
      {
        "title": "Care",
        "content": "Follow the care instructions on the garment label."
      }
    ]
  },
  {
    "id": "6",
    "slug": "signature-relaxed-shirt",
    "name": "Signature Relaxed Shirt",
    "category": "Women",
    "price": 79,
    "rating": 0,
    "reviews": 0,
    "image": "/assets/shop/category-apparel.png",
    "description": "A relaxed wardrobe essential to wear your way.",
    "details": [],
    "sizes": [
      {
        "name": "XS",
        "price": 79
      },
      {
        "name": "S",
        "price": 79
      },
      {
        "name": "M",
        "price": 79
      },
      {
        "name": "L",
        "price": 79
      },
      {
        "name": "XL",
        "price": 79
      }
    ],
    "accordionInfo": [
      {
        "title": "Fit & sizing",
        "content": "Choose your preferred size. Check the garment measurements before ordering."
      },
      {
        "title": "Care",
        "content": "Follow the care instructions on the garment label."
      }
    ]
  }
]

// Keep supplier metadata in the source import, never in storefront copy.
function storefrontProduct(product: Product): Product {
  const vendor = product.brand?.trim()
  const pattern = vendor
    ? new RegExp(`(^|[^\\p{L}\\p{N}])${vendor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^\\p{L}\\p{N}])`, "giu")
    : null
  const clean = (text: string) => (pattern ? text.replace(pattern, "$1") : text)
    .replace(/\s*\|\s*/g, " ").replace(/\s{2,}/g, " ").replace(/^[\s,;:\-]+|[\s,;:\-]+$/g, "").trim()
  return {
    ...product,
    brand: undefined,
    name: clean(product.name),
    description: clean(product.description),
    accordionInfo: product.accordionInfo?.map(item => ({
      title: clean(item.title),
      content: clean(item.content).replace("Refer to the brand sizing information", "Refer to the sizing information"),
    })),
  }
}
export const PRODUCTS: Product[] = (womenProducts as Product[])
  .filter(p => STOREFRONT_SUBCATEGORIES.includes(p.subcategory || ""))
  .map(storefrontProduct)
