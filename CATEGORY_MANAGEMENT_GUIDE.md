# Category Management System Documentation

## Overview

The News Portal includes a **hierarchical category management system** that allows organizations to organize articles into main categories and subcategories. Each article can belong to multiple categories, providing flexible content organization.

## Features

### ✅ Hierarchical Categories
- **Main Categories**: Top-level categories (Technology, Business, Health, etc.)
- **Subcategories**: Child categories under main categories (AI, Cybersecurity, etc.)
- **Unlimited Nesting**: Support for multiple hierarchy levels
- **Circular Reference Prevention**: Cannot set descendant as parent
- **Drag-Drop Reordering**: Reorganize categories visually

### ✅ Many-to-Many Articles
- One article can belong to **multiple categories**
- Category listing shows all articles
- Filter articles by category

### ✅ SEO Support
- Meta title, description, keywords per category
- OG image for social sharing
- Auto-generated slugs
- Structured data ready

### ✅ Visual Customization
- Category color (hex color picker)
- Category icon/emoji support
- Featured image per category
- Active/inactive status toggle

### ✅ Full Authorization
- **Admin**: Full control
- **Manager**: Can create, edit, delete, reorder categories
- **Reporter**: View-only access

---

## Database Schema

### Categories Table
```sql
CREATE TABLE categories (
    id                  BIGINT PRIMARY KEY,
    parent_id           BIGINT NULLABLE,          -- Parent category for hierarchy
    name                VARCHAR(255) NOT NULL,    -- Category name
    slug                VARCHAR(255) UNIQUE,      -- URL-friendly slug
    description         TEXT NULLABLE,            -- Category description
    featured_image      VARCHAR(255) NULLABLE,    -- Image path
    color               VARCHAR(7) DEFAULT '#6366f1', -- Hex color
    icon                VARCHAR(255) NULLABLE,    -- Icon class/name
    meta_title          VARCHAR(255) NULLABLE,    -- SEO title
    meta_description    VARCHAR(160) NULLABLE,    -- SEO meta description
    meta_keywords       VARCHAR(255) NULLABLE,    -- SEO keywords
    og_image            VARCHAR(255) NULLABLE,    -- OG image for sharing
    order               INT DEFAULT 0,            -- Display order
    is_active           BOOLEAN DEFAULT TRUE,     -- Active status
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_parent_id ON categories(parent_id);
CREATE INDEX idx_slug ON categories(slug);
CREATE INDEX idx_active_order ON categories(is_active, order);
CREATE INDEX idx_parent_active ON categories(parent_id, is_active);
```

### Article-Category Pivot Table
```sql
CREATE TABLE article_category (
    id              BIGINT PRIMARY KEY,
    article_id      BIGINT NOT NULL,
    category_id     BIGINT NOT NULL,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    UNIQUE (article_id, category_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_category_id ON article_category(category_id);
```

---

## Model Usage

### Article Model
```php
// Get articles in a category
$category = Category::find(1);
$articles = $category->articles()->published()->paginate(15);

// Attach articles to categories
$article->categories()->attach([1, 2, 3]);
$article->categories()->sync([1, 2]);  // Replace all
$article->categories()->detach(1);     // Remove from category

// Get categories for article
$categories = $article->categories;
```

### Category Model
```php
// Hierarchical operations
$main = Category::main()->active()->get();  // Main categories only
$tech = Category::where('slug', 'technology')->first();

// Get children
$subcats = $tech->children;  // Direct children
$descendants = $tech->descendants();  // All descendants

// Breadcrumb path
$breadcrumbs = $category->breadcrumbs();  // Ancestors + self

// Helpers
$category->isMain();           // Is this a main category?
$category->hasChildren();      // Has subcategories?
$category->getArticlesCountAttribute();  // Published articles count

// Accessors
$category->effective_meta_title;       // With fallback to name
$category->effective_meta_description;  // With fallback to description
```

---

## API Endpoints

### Category Management (Admin/Manager)

**List Categories**
```
GET /categories
Returns: Hierarchical tree structure
```

**Create Category**
```
POST /categories
Body: {
    "name": "Technology",
    "slug": "technology",
    "description": "...",
    "parent_id": null,
    "featured_image": "...",
    "color": "#3b82f6",
    "icon": "icon-tech",
    "meta_title": "...",
    "meta_description": "...",
    "is_active": true
}
```

**Edit Category**
```
GET /categories/{id}/edit
```

**Update Category**
```
PUT /categories/{id}
Body: { same as POST }
```

**Delete Category**
```
DELETE /categories/{id}
Note: Cannot delete if articles or children exist
```

**Reorder Categories**
```
POST /categories/reorder
Body: {
    "categories": [
        { "id": 1, "order": 1, "parent_id": null },
        { "id": 2, "order": 2, "parent_id": null }
    ]
}
```

**Get Categories List (for dropdowns)**
```
GET /categories/list
Returns: [
    { "id": 1, "name": "Technology", "parent_id": null },
    ...
]
```

### Public Routes

**View Category & Articles**
```
GET /category/{slug}
Returns: Category with breadcrumbs, children, paginated articles
```

---

## Frontend Implementation

### Category Management Page (Admin/Manager)
- Tree view of categories with indentation
- Drag-drop reordering
- Create/Edit/Delete buttons
- Color picker, icon selector
- SEO fields (meta title, description, keywords)
- Active/inactive toggle
- Article count per category

### Article Create/Edit Form
- **Categories Multi-Select**
  - Searchable dropdown
  - Multiple selection
  - Show selected with x-button to remove
  - Hierarchy visualization (Technology > AI)
  - Required or optional field

### Article List Page
- Category filter (multi-select)
- Category badges on each article
- Filter toggle to show articles under clicked category and subcategories

### Public Category Page
- Category header with featured image, description
- Breadcrumb navigation (Technology > AI)
- Subcategories list (with article counts)
- Paginated articles list
- Related articles from parent/sibling categories

---

## Authorization Rules

| Action | Reporter | Manager | Admin |
|--------|----------|---------|-------|
| View Categories | ✅ | ✅ | ✅ |
| Create Category | ❌ | ✅ | ✅ |
| Edit Category | ❌ | ✅ | ✅ |
| Delete Category | ❌ | ✅ | ✅ |
| Reorder Categories | ❌ | ✅ | ✅ |
| Assign to Article | ✅ | ✅ | ✅ |

---

## Validation Rules

### Category Creation/Update
```php
'name'              => 'required|string|max:100',
'slug'              => 'nullable|string|max:100|unique:categories[,slug,{id}]',
'description'       => 'nullable|string|max:1000',
'parent_id'         => 'nullable|integer|exists:categories,id',
'featured_image'    => 'nullable|string',
'color'             => 'nullable|regex:/^#[0-9a-fA-F]{6}$/',  // Hex color
'icon'              => 'nullable|string|max:50',
'meta_title'        => 'nullable|string|max:60',
'meta_description'  => 'nullable|string|max:160',
'meta_keywords'     => 'nullable|string',
'og_image'          => 'nullable|string',
'order'             => 'nullable|integer|min:0',
'is_active'         => 'boolean'
```

---

## Constraints & Safety

### Data Protection
- ❌ **Cannot delete**: If category has articles attached
- ❌ **Cannot delete**: If category has subcategories (children)
- ❌ **Cannot set**: Descendant as parent (circular reference)
- ✅ **Soft relationships**: Remove articles from category then delete

### Slug Generation
- Auto-generated from category name if not provided
- Must be unique (enforced at database level)
- Normalized to lowercase with hyphens

### Parent-Child Hierarchy
```
Valid:
Technology (main)
  └─ Artificial Intelligence (sub)
     └─ Machine Learning (sub-sub) ❌ Not recommended

Invalid (Circular):
❌ Technology as parent of AI, AI as parent of Technology
```

---

## Usage Examples

### Seed Sample Categories
```bash
php artisan db:seed --class=CategorySeeder
```

Creates:
- 4 main categories: Technology, Business, Health, Science
- 4 subcategories: AI, Cybersecurity, Startups, Finance
- Auto-attaches sample articles

### Get Articles by Category
```php
// In controller or model
$category = Category::where('slug', 'technology')->first();
$articles = $category->articles()
    ->published()
    ->with('author', 'meta', 'media')
    ->paginate(15);
```

### Filter Articles by Multiple Categories
```php
// Get articles in Technology OR Business
$articles = Article::published()
    ->whereHas('categories', function ($q) {
        $q->whereIn('category_id', [1, 2]);  // Technology (1), Business (2)
    })
    ->paginate(15);
```

### Create Breadcrumb Navigation
```php
@foreach ($category->breadcrumbs() as $cat)
    <a href="{{ route('public.category.show', $cat->slug) }}">
        {{ $cat->name }}
    </a> > 
@endforeach
```

---

## Best Practices

1. **Naming**: Use descriptive category names (e.g., "Artificial Intelligence" not "AI")
2. **Hierarchy**: Keep 2-3 levels max for usability (Main > Sub > Sub-sub)
3. **Colors**: Use consistent color scheme across categories
4. **Icons**: Use Font Awesome or other icon library for consistency
5. **SEO**: Fill meta fields for main categories (affects search ranking)
6. **Ordering**: Use drag-drop to order by importance/frequency
7. **Articles**: Always assign at least one category per article
8. **Cleanup**: Archive unused categories instead of deleting

---

## Migration & Rollback

```bash
# Run all pending migrations
php artisan migrate

# Rollback category migration
php artisan migrate:rollback --step=2

# Create new migration
php artisan make:migration add_new_column_to_categories

# Run specific seeder
php artisan db:seed --class=CategorySeeder
```

---

## Troubleshooting

### Categories not showing in dropdown
- Check `is_active` status in database
- Verify `parent_id` is set correctly for hierarchy
- Clear query cache: `php artisan cache:clear`

### Circular reference error
- Parent category is a descendant of current category
- Check hierarchy tree: `$category->descendants()`
- Reset parent_id to null

### Articles not attached to category
- Verify `article_category` pivot table has entries
- Check permissions (reporter can assign during article creation)
- Confirm article status is "published"

### Slug conflicts
- Database has duplicate slug (should be unique)
- Migrate with slug regeneration if needed
- Check for soft-deleted categories

---

## Performance Optimization

### Eager Loading
```php
// Load with relationships
$categories = Category::with(['parent', 'children', 'articles'])->get();

// Avoid N+1 queries
->with(['children' => fn($q) => $q->orderBy('order')])
```

### Indexing
All frequently-queried columns are indexed:
- `parent_id` - for hierarchy traversal
- `slug` - for URL lookups
- `is_active` & `order` - for listing pages
- `parent_id & is_active` - composite for tree queries

### Caching
Consider caching main category tree:
```php
$categories = cache()->remember('categories.main', 3600, function () {
    return Category::main()->active()->with('children')->get();
});
```

---

## Future Enhancements

- [ ] Category image gallery
- [ ] Category featured articles showcase
- [ ] Articles trending per category
- [ ] Category analytics (views, articles count over time)
- [ ] Automated category suggestions for articles
- [ ] Category permissions (reporter can only use certain categories)
- [ ] Category import/export (CSV)
- [ ] Nested article filtering (show articles from category + all subcategories)
