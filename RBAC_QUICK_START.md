# RBAC Implementation Quick Start Guide

## 🚀 Getting Started

### Step 1: Database Setup
```bash
# Run migrations
php artisan migrate

# Seed default roles, permissions, and users
php artisan db:seed
```

### Step 2: Default Credentials

| Role     | Email                        | Password  |
|----------|------------------------------|-----------|
| Admin    | admin@newsportal.com       | password  |
| Manager  | manager@newsportal.com     | password  |
| Reporter | reporter@newsportal.com    | password  |

### Step 3: Start Development Server
```bash
npm run dev      # Start Vite (frontend)
php artisan serve  # Start Laravel server (backend)
```

---

## 🗺️ Navigation Map

### Admin Panel (`/admin/*`)
- **Users Management** `/admin/users`
  - List all users
  - Filter by role, status, search
  - Create, edit, delete users
  - Bulk operations
  - Status toggle

- **Roles & Permissions** `/admin/roles`
  - Manage roles
  - Assign permissions to roles
  - View role usage

### Manager Panel (`/manager/*`)
- **Dashboard** `/manager/dashboard`
  - Quick stats
  - Pending articles count
  
- **Articles** `/manager/articles`
  - View pending/published articles
  - Approve/reject articles

### Reporter Panel (`/reporter/*`)
- **Dashboard** `/reporter/dashboard`
  - Article stats
  - Recent articles
  - New article CTA

- **Articles** `/reporter/articles`
  - List own articles
  - Create new article
  - Edit draft articles
  - Submit for approval

---

## 🔑 Key Files & Their Purpose

### Backend

#### Controllers
| File | Purpose |
|------|---------|
| `app/Http/Controllers/Admin/UserController.php` | User CRUD operations |
| `app/Http/Controllers/Admin/RoleController.php` | Role management |
| `app/Http/Controllers/ArticleController.php` | Article workflow |

#### Models
| File | Purpose |
|------|---------|
| `app/Models/User.php` | User with RBAC helpers |
| `app/Models/Role.php` | Role with permission sync |
| `app/Models/Permission.php` | Granular permission control |
| `app/Models/Article.php` | Article with status scopes |
| `app/Models/ActivityLog.php` | Audit trail |

#### Middleware
| File | Purpose |
|------|---------|
| `app/Http/Middleware/CheckRole.php` | Verify user has required role(s) |
| `app/Http/Middleware/CheckPermission.php` | Verify user has permission(s) |

#### Policies
| File | Purpose |
|------|---------|
| `app/Policies/ArticlePolicy.php` | Article action authorization |

#### Migrations
| File | Purpose |
|------|---------|
| `*_create_roles_table.php` | Store roles |
| `*_create_permissions_table.php` | Store permissions |
| `*_create_role_has_permissions_table.php` | Role-permission mapping |
| `*_create_model_has_roles_table.php` | User-role mapping (polymorphic) |
| `*_create_model_has_permissions_table.php` | User-permission mapping (polymorphic) |
| `*_create_activity_logs_table.php` | Action audit trail |
| `*_create_articles_table.php` | Articles with status tracking |

#### Seeders
| File | Purpose |
|------|---------|
| `database/seeders/RolesAndPermissionsSeeder.php` | Seed initial data |

### Frontend

#### Pages
| File | Purpose |
|------|---------|
| `resources/js/pages/admin/users/index.tsx` | User management UI |
| `resources/js/pages/admin/roles/index.tsx` | Role management UI |
| `resources/js/pages/manager/dashboard.tsx` | Manager overview |
| `resources/js/pages/reporter/dashboard.tsx` | Reporter overview |

#### Types
| File | Purpose |
|------|---------|
| `resources/js/types/auth.ts` | TypeScript interfaces for RBAC |

#### Components
The following shadcn/ui components are used:
- `ui/button.tsx` - Action buttons
- `ui/dialog.tsx` - Modal dialogs
- `ui/dropdown-menu.tsx` - Row actions
- `ui/table.tsx` - Data tables
- `ui/badge.tsx` - Status/role indicators
- `ui/input.tsx` - Form inputs
- `ui/select.tsx` - Dropdowns
- `ui/checkbox.tsx` - Permission selection
- `ui/card.tsx` - Content containers
- `ui/toast.tsx` - Notifications

#### Layout
| File | Purpose |
|------|---------|
| `resources/js/layouts/app-layout.tsx` | Main layout wrapper |
| `resources/js/layouts/app/app-sidebar-layout.tsx` | Sidebar + content layout |
| `resources/js/components/app-sidebar.tsx` | Sidebar with role-based nav |

---

## 🔄 Common Workflows

### Workflow 1: Create a New User (Admin)
```
1. Login as admin@newsportal.com
2. Navigate to /admin/users
3. Click "Add User" button
4. Fill form:
   - Name: John Doe
   - Email: john@example.com
   - Password: SecurePass123
   - Password Confirmation: SecurePass123
   - Role: Reporter
   - Status: Active
5. Click "Create User"
6. Toast notification: "User created successfully"
7. User appears in table with role badge
8. Activity logged in activity_logs table
```

### Workflow 2: Assign Permissions to Role (Admin)
```
1. Login as admin@newsportal.com
2. Navigate to /admin/roles
3. Find "Reporter" role
4. Click edit or view
5. See grouped permissions in tabs:
   - Users:      [✓] view
   - Articles:   [✓] view, [✓] create
   - Categories:[✓] view
   - Media:      [✓] upload
6. Checkboxes show current state
7. Toggle as needed
8. Save changes
```

### Workflow 3: Submit Article for Review (Reporter)
```
1. Login as reporter@newsportal.com
2. Navigate to /reporter/articles
3. Click "New Article" → Create form
4. Title: "Breaking News Story"
5. Content: "Comprehensive article content..."
6. Save as Draft (stored with status: 'draft')
7. View in articles list as "Draft"
8. Click Edit to refine
9. Click "Submit for Review"
   → Status changes to 'pending'
   → Appears in Manager queue
```

### Workflow 4: Approve Article (Manager)
```
1. Login as manager@newsportal.com
2. Navigate to /manager/articles
3. See pending articles section
4. Find "Breaking News Story" (pending)
5. Click "Approve" button
   → Status: pending → published
   → Published at timestamp set
   → Activity logged
   → Author notified (future: email)
6. Article now visible in published list
```

---

## 🧪 Testing Checklist

### User Management
- [ ] Create user with all fields
- [ ] Edit user (name, email, role, status)
- [ ] Delete single user (with confirmation)
- [ ] Bulk delete multiple users
- [ ] Toggle user status (active ↔ inactive)
- [ ] Filter users by role
- [ ] Filter users by status
- [ ] Search users by name/email
- [ ] Pagination works (10 per page)
- [ ] Prevent self-deletion

### Role Management
- [ ] Create custom role
- [ ] Edit role name and color
- [ ] Assign permissions to role
- [ ] Revoke permissions from role
- [ ] Cannot delete system roles (admin, manager, reporter)
- [ ] Permissions grouped by category
- [ ] User count shows correctly

### Article Workflow
- [ ] Reporter can create article (draft)
- [ ] Reporter can edit own draft
- [ ] Reporter cannot edit other articles
- [ ] Reporter can submit for approval
- [ ] Manager sees pending articles
- [ ] Manager can approve article
- [ ] Manager can reject article
- [ ] Admin can do all operations
- [ ] Rejected articles revert to pending

### Access Control
- [ ] Admin can access `/admin/*`
- [ ] Non-admin cannot access `/admin/*` (403)
- [ ] Manager cannot access `/admin/*`
- [ ] Reporter cannot access `/admin/*`
- [ ] Inactive users cannot perform actions
- [ ] Unauthenticated users cannot access protected routes (401)

### Activity Logging
- [ ] User creation logged
- [ ] User update logged
- [ ] User deletion logged
- [ ] Role assignment logged
- [ ] Article status changes logged
- [ ] Includes user_id, description, timestamp
- [ ] Property changes tracked

### UI/UX
- [ ] Success toasts show
- [ ] Error toasts show
- [ ] Modals open/close properly
- [ ] Pagination links work
- [ ] Badge colors correct (red/blue/green)
- [ ] Sidebar navigation shows correct section
- [ ] Breadcrumbs display correctly
- [ ] Dark/light mode works (if enabled)

---

## 🔗 Important Routes

### Dashboard
- `/dashboard` - Main dashboard (all authenticated users)

### Admin Routes
- `GET /admin/users` - List users
- `POST /admin/users` - Create user
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user
- `PATCH /admin/users/{id}/toggle-status` - Toggle status
- `GET /admin/roles` - List roles
- `POST /admin/roles` - Create role
- `PUT /admin/roles/{id}` - Update role
- `DELETE /admin/roles/{id}` - Delete role

### Manager Routes
- `GET /manager/dashboard` - Manager dashboard
- `GET /manager/articles` - List articles

### Reporter Routes
- `GET /reporter/dashboard` - Reporter dashboard
- `GET /reporter/articles` - List articles
- `GET /reporter/articles/create` - Create form
- `POST /reporter/articles` - Store article
- `GET /reporter/articles/{id}/edit` - Edit form
- `PUT /reporter/articles/{id}` - Update article
- `DELETE /reporter/articles/{id}` - Delete article
- `POST /articles/{id}/submit` - Submit for approval

---

## 🔍 Debugging Tips

### Check User Roles
```php
// In tinker or controller
$user = User::find(1);
dd($user->roles);           // All roles
dd($user->hasRole('admin')); // Boolean
```

### Check User Permissions
```php
$user = User::find(1);
dd($user->permissions);              // Direct permissions
dd($user->hasPermission('users.view')); // Via role or direct
```

### Check Article Permissions
```php
$article = Article::find(1);
$user = User::find(1);

$user->can('update', $article);  // Uses ArticlePolicy
$user->can('approve', $article); // Checks authorization
```

### View Activity Log
```php
// Get recent activities
$logs = ActivityLog::latest()->limit(10)->get();
dd($logs);
```

### Force Reseed Database
```bash
# Reset and reseed (WARNING: destroys data)
php artisan migrate:fresh --seed
```

---

## 🎯 Performance Tips

1. **Use eager loading** to avoid N+1 queries:
   ```php
   $users = User::with('roles', 'permissions')->paginate(10);
   ```

2. **Cache permissions** if using frequently:
   ```php
   // In User model
   protected $appends = ['cached_permissions'];
   ```

3. **Index foreign keys** in migrations (already done)

4. **Paginate large datasets** (already done with 10 per page)

---

## 📞 Support

For issues or questions:
1. Check migrations are running: `php artisan migrate --list`
2. Verify seeds executed: `php artisan db:seed`
3. Check middleware registered in `bootstrap/app.php`
4. Review policy in `app/Policies/ArticlePolicy.php`
5. Check controller authorization calls

---

**Created**: March 2026  
**Status**: Production Ready  
**Version**: 1.0.0
