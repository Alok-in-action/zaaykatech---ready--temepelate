# ZaaykaTech — Phase 3 Plan: Menu Management

**Author:** Antigravity Architect & Senior SaaS Engineer  
**Status:** Approved for Implementation  
**Phase:** 3 — Category Management, Item Management, Pricing Models, Reordering & R2 Dish Media  

---

## 1. Exact Pages, Components, Server Actions & Zod Schemas

### Pages
1. `/owner/menu` (`src/app/(owner)/owner/menu/page.tsx`):
   - Category navigation tabs & category action buttons (Add Category, Edit, Toggle Active, Delete, Reorder)
   - Category-wise item counter badge
   - Search bar for quick dish filtering across categories
   - Item management grid/list with quick Availability Toggle, Edit, Delete, Reorder
   - Mobile-first drawer/dialog for "Add/Edit Category"
   - Mobile-first drawer/dialog for "Add/Edit Menu Item"

### Reusable Components
1. `src/components/owner/menu/CategoryManager.tsx`:
   - Category list with reordering drag handles
   - Category active/inactive status switch
   - Add/Edit category modal
   - Delete confirmation with safeguard check (blocks deletion if category contains dishes, unless explicitly confirmed)
2. `src/components/owner/menu/ItemManager.tsx`:
   - Category-filtered dish cards/table with thumbnail preview
   - Quick availability toggle switch (instant optimistic toggle)
   - Badges display: Veg/Non-Veg, Signature, Bestseller, Monsoon, Custom Tag
   - Reorder handles within the selected category
   - Price display: formatted single price or variant price pills
3. `src/components/owner/menu/ItemEditorDialog.tsx`:
   - Full dish editor modal/drawer:
     - Name & Description
     - Veg / Non-veg selector
     - Pricing mode switch: **Single Price** vs. **Variant Prices**
     - Single price input (Rupees in UI, converted to integer paise in payload)
     - Variant prices builder (e.g. Regular / Large, Half / Full, NY / Neapolitan) with positive integer validation
     - Cloudflare R2 Image Uploader (Max 5MB, JPEG/PNG/WebP, stored under `restaurants/{id}/menu-items/{itemId}/`)
     - Badges selector: Signature, Bestseller, Monsoon, Custom Tag (e.g. "Chef Special", "Barista Choice")
     - Allergens and Tags multi-input
4. `src/components/owner/menu/CategoryEditorDialog.tsx`:
   - Add/Edit Category modal with Name, Description, and Active toggle.

### Server Actions
Located in `src/actions/`:
1. `src/actions/category.ts`:
   - `createCategory(restaurantId: string, input: CreateCategoryInput)`
   - `updateCategory(categoryId: string, input: UpdateCategoryInput)`
   - `deleteCategory(categoryId: string, cascadeDeleteItems: boolean)`: Verifies item count; prevents accidental deletion if dishes exist unless `cascadeDeleteItems` is explicitly true.
   - `toggleCategoryActive(categoryId: string, isActive: boolean)`
   - `reorderCategories(restaurantId: string, categoryIds: string[])`: Updates sequential `position` integers (0, 1, 2, ...).
2. `src/actions/item.ts`:
   - `createMenuItem(restaurantId: string, input: CreateMenuItemInput)`
   - `updateMenuItem(itemId: string, input: UpdateMenuItemInput)`
   - `deleteMenuItem(itemId: string)`
   - `toggleItemAvailability(itemId: string, isAvailable: boolean)`
   - `reorderMenuItems(categoryId: string, itemIds: string[])`: Updates sequential `position` integers within the parent category.

### Zod Schemas (`src/validations/menu.ts`)
- `CategorySchema`:
  - `name`: 2-80 characters
  - `description`: optional, max 250 characters
  - `is_active`: boolean, default true
- `MenuItemSchema`:
  - `name`: 2-100 characters
  - `categoryId`: UUID
  - `description`: optional, max 500 characters
  - `pricingMode`: `'single'` | `'variants'`
  - `price_paise`: integer paise >= 0 (required when `pricingMode === 'single'`)
  - `variant_prices`: record of string key -> positive integer paise (required when `pricingMode === 'variants'`)
  - `refine`: Strictly enforces that **single price OR variant prices** is provided, never both simultaneously.
  - `image_url`: optional URL
  - `tags`: array of strings
  - `allergens`: array of strings
  - `is_veg`: boolean
  - `is_available`: boolean
  - `is_signature`: boolean
  - `is_most_ordered`: boolean
  - `is_monsoon`: boolean
  - `custom_tag`: optional string max 30 characters

---

## 2. Database Fields Used

1. **`menu_categories`**:
   - `id UUID`, `restaurant_id UUID`, `name TEXT`, `slug TEXT`, `description TEXT`, `position INTEGER`, `is_active BOOLEAN`, `created_at`, `updated_at`.
2. **`menu_items`**:
   - `id UUID`, `restaurant_id UUID`, `category_id UUID`, `name TEXT`, `slug TEXT`, `description TEXT`, `price_paise INTEGER`, `variant_prices JSONB`, `image_url TEXT`, `tags TEXT[]`, `allergens TEXT[]`, `is_veg BOOLEAN`, `is_available BOOLEAN`, `is_signature BOOLEAN`, `is_most_ordered BOOLEAN`, `is_monsoon BOOLEAN`, `custom_tag TEXT`, `position INTEGER`, `created_at`, `updated_at`.

---

## 3. Reordering Implementation

- **Category Reordering**:
  - Drag-and-drop handles and keyboard up/down controls.
  - Generates updated array of `categoryIds` in requested order.
  - Server action `reorderCategories(restaurantId, categoryIds)` updates each category's `position` to `index`.
- **Item Reordering**:
  - Drag-and-drop handles within the selected category.
  - Generates updated array of `itemIds`.
  - Server action `reorderMenuItems(categoryId, itemIds)` updates each item's `position` to `index`.
  - Prevents reordering items across categories in this version (strictly scoped by `category_id`).

---

## 4. Image Upload Flow for Menu Items

- Integrated with existing Cloudflare R2 pipeline:
  - Generates object key: `restaurants/{restaurantId}/menu-items/{itemId}/{timestamp}-{random}.ext`.
  - Enforces max 5 MB, JPEG/PNG/WebP only.
  - Directly uploads to Cloudflare R2 via presigned PUT URL.
  - Verifies storage existence before committing to `menu_items.image_url`.
  - Supports image replacement and removal.

---

## 5. Price Variant Handling

- Single price:
  - Integer paise (e.g., input ₹250.00 -> stored as `25000`, `variant_prices = null`).
- Variant prices:
  - Record of variant name -> integer paise (e.g., `{"regular": 15000, "large": 22000}`, `price_paise = null`).
- Public menu rendering:
  - Displays single price: `₹250`
  - Displays variant prices: `REGULAR: ₹150 | LARGE: ₹220`

---

## 6. Test Plan (`tests/phase3-verification.ts`)

1. **Category CRUD & Reordering**:
   - Create category with auto-slug.
   - Update category name and toggle active.
   - Reorder categories and verify sequential positions.
   - Category deletion safeguard (blocks deletion if dishes exist).
2. **Item CRUD & Pricing Validation**:
   - Create single-price item (valid integer paise).
   - Create variant-price item (valid positive integer paise per variant).
   - Reject item with both single price and variant prices simultaneously.
   - Reject item with negative or decimal prices.
3. **Availability & Visibility Rules**:
   - Toggle availability (`is_available = false`).
   - Verify public SQL query / function excludes unavailable items and inactive categories.
4. **Ownership Authorization**:
   - Verify non-owner cannot edit, delete, or reorder another restaurant's categories or items.
5. **Lint, Typecheck & Production Build**.

---

## 7. Files to Create or Modify

- **New Files**:
  - `src/validations/menu.ts` (Zod schemas for categories, items, and pricing)
  - `src/actions/category.ts` (Server actions for category CRUD, toggle, reorder)
  - `src/actions/item.ts` (Server actions for item CRUD, availability toggle, reorder)
  - `src/components/owner/menu/CategoryManager.tsx`
  - `src/components/owner/menu/CategoryEditorDialog.tsx`
  - `src/components/owner/menu/ItemManager.tsx`
  - `src/components/owner/menu/ItemEditorDialog.tsx`
  - `src/app/(owner)/owner/menu/page.tsx`
  - `tests/phase3-verification.ts`
- **Modified Files**:
  - `src/app/(owner)/owner/page.tsx` (Live category & item counts)
  - `src/app/(owner)/owner/layout.tsx` (Menu link active state)
