export const WOMEN_CATEGORIES = [
  { name: "Clothing", children: ["Shirts", "T-Shirts", "Trousers & Leggings"] },
  { name: "Ethnics", children: ["Kurti", "Ethnic Suits Collection"] },
  { name: "Footwear", children: ["Heels & Flats", "Flip Flops"] },
  { name: "Accessories", children: ["Bags"] },
]
export function womenCategoryUrl(department: string, subcategory?: string) {
  const query = new URLSearchParams({ category: "Women", department })
  if (subcategory) query.set("subcategory", subcategory)
  return `/shop?${query.toString()}`
}

export const STOREFRONT_SUBCATEGORIES = WOMEN_CATEGORIES.flatMap(group => group.children)
