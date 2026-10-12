"""Import Shopify CSV into the storefront. Usage: python scripts/import-products.py path.csv"""
import csv
import html
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def classify(title, kind):
    t = title.lower()
    if any(x in t for x in ['handbag', 'sling bag', 'shoulder bag', 'backpack', 'cosmetic bag', 'hand-held bag']) or kind == 'Accessories':
        return 'Accessories', 'Bags'
    if kind == 'Footwear' or any(x in t for x in ['shoes', 'sneaker', 'lace-ups']):
        if any(x in t for x in ['flip', 'slipper', 'chappal', 'slides', 'orthop', 'cloud cushion']):
            return 'Footwear', 'Flip Flops'
        if any(x in t for x in ['heel', 'sandal']):
            return 'Footwear', 'Heels & Flats'
        return 'Footwear', 'Casual Shoes'
    if 'kurti' in t or 'kurta' in t or 'sharara' in t:
        return 'Ethnics', 'Ethnic Suits Collection' if any(x in t for x in ['set', 'dupatta', 'sharara']) else 'Kurti'
    if 'jeans' in t or kind == 'Jeans': return 'Clothing', 'Jeans'
    if any(x in t for x in ['jogger', 'shorts']): return 'Clothing', 'Joggers & Shorts'
    if 't-shirt' in t or 't shirt' in t: return 'Clothing', 'T-Shirts'
    if 'shirt' in t or kind == 'Shirt': return 'Clothing', 'Shirts'
    if any(x in t for x in ['dress', 'gown']): return 'Clothing', 'Dresses'
    if 'skirt' in t: return 'Clothing', 'Skirts'
    if any(x in t for x in ['trouser', 'legging', 'stocking', 'tights']): return 'Clothing', 'Trousers & Leggings'
    return 'Clothing', 'Tops'

groups = defaultdict(list)
with open(sys.argv[1], encoding='utf-8-sig', newline='') as source:
    for row in csv.DictReader(source): groups[row['Handle']].append(row)
products, excluded = [], []
for handle, rows in groups.items():
    base = next((r for r in rows if r['Title']), None)
    if not base: raise ValueError(f'Missing title: {handle}')
    title = html.unescape(base['Title']).replace('\ufffd', "'").strip()
    if re.match(r'^men\b', title, re.I):
        excluded.append({'handle': handle, 'reason': 'Explicitly menswear title'})
        continue
    if base['Status'] != 'active' or base['Published'].lower() != 'true': continue
    department, subcategory = classify(title, base['Type'])
    option_names = [base.get(f'Option{i} Name') for i in range(1, 4)]
    variants = []
    for i, row in enumerate(rows):
        if not row['Variant Price']: continue
        options = {name: row.get(f'Option{j} Value', '') for j, name in enumerate(option_names, 1) if name}
        name = ' / '.join(options.values()) or 'One Size'
        price = float(row['Variant Price'])
        if price <= 0: raise ValueError(f'Invalid price: {handle}')
        variant = {'id': f'{handle}-{i}', 'name': name, 'price': price, 'sku': row['Variant SKU'], 'options': options}
        compare = float(row['Variant Compare At Price'] or 0)
        if compare > price: variant['originalPrice'] = compare
        variants.append(variant)
    if not variants: raise ValueError(f'Missing variants: {handle}')
    image_rows = sorted((r for r in rows if r['Image Src']), key=lambda r: int(r['Image Position'] or 999))
    images = list(dict.fromkeys(r['Image Src'] for r in image_rows))
    if not images: raise ValueError(f'Missing images: {handle}')
    description = html.unescape(re.sub('<[^>]+>', ' ', base['Body (HTML)']))
    product = {'id': handle, 'slug': handle, 'name': title, 'category': 'Women', 'department': department,
               'subcategory': subcategory, 'brand': base['Vendor'], 'sourceType': base['Type'], 'currency': 'INR',
               'price': variants[0]['price'], 'rating': 0, 'reviews': 0, 'image': images[0], 'details': images[1:],
               'description': re.sub(r'\s+', ' ', description).strip(), 'sizes': variants,
               'accordionInfo': [{'title': 'Product details', 'content': f'{base["Vendor"]} | {subcategory}'},
                                 {'title': 'Sizing', 'content': 'Options are imported as supplied. Refer to the brand sizing information before ordering.'}]}
    if variants[0].get('originalPrice'): product['originalPrice'] = variants[0]['originalPrice']
    products.append(product)
(ROOT / 'lib/women-products.json').write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding='utf-8')
report = {'sourceProducts': len(groups), 'imported': len(products), 'variants': sum(len(p['sizes']) for p in products),
          'categories': dict(Counter(f'{p["department"]} / {p["subcategory"]}' for p in products)), 'excluded': excluded,
          'notes': ['Currency INR inferred from supplied store screenshots.', 'Inventory quantities are absent from the export; no stock levels are fabricated.', 'Images remain at their supplied Shopify CDN URLs.', 'Classification uses titles to correct mismatched source types.']}
(ROOT / 'lib/catalog-import-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
