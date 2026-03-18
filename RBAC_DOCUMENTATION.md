# 🔐 Role-Based Access Control (RBAC) System - News Portal

## Overview

A comprehensive RBAC system built with Laravel, React/Inertia, and shadcn/ui components. This system provides three main roles (Admin, Manager, Reporter) with granular permission control and activity logging.

---

## 📋 System Architecture

### Database Schema

```
┌─────────────────────────────────────────────────────────┐
│ users                                                   │
├─────────────────────────────────────────────────────────┤
│ id, name, email, password, status, created_at           │
└─────────────────────────────────────────────────────────┘
              │
              ├─→ model_has_roles (morphToMany)
              │
              └─→ model_has_permissions (morphToMany)
                        │
                        ├─→ roles
                        │    │
                        │    └─→ role_has_permissions
                        │
                        └─→ permissions

┌─────────────────────────────────────────────────────────┐
│ articles                                                │
├─────────────────────────────────────────────────────────┤
│ id, user_id, title, slug, content, status, ...          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ activity_logs                                           │
├─────────────────────────────────────────────────────────┤
│ id, user_id, action, subject_type, description          │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 Roles & Permissions

### 1. **Admin** (Red Badge)
Full system access. Can manage everything.

**Permissions:**
- Users: `view`, `create`, `edit`, `delete`
- Roles: `view`, `create`, `edit`, `delete`, `assign`
- Articles: `view`, `create`, `edit`, `delete`, `approve`, `publish`
- Categories: `view`, `create`, `edit`, `delete`
- Media: `upload`, `delete`
- Analytics: `view`

**Features:**
- User management (CRUD + bulk operations)
- Role and permission assignment
- Article approval/publication
- Full system visibility

---

### 2. **Manager** (Blue Badge)
Supervises reporters and approves/rejects content.

**Permissions:**
- Users: `view` (limited)
- Articles: `view`, `edit`, `approve`, `publish`, `delete`
- Categories: `view`, `create`, `edit`
- Media: `upload`, `delete`
- Analytics: `view`

**Features:**
- View and approve pending articles
- Edit any article (except published)
- Manage content categories
- View analytics dashboard
- Cannot create users or manage roles

---

### 3. **Reporter** (Green Badge)
Creates and submits articles for approval.

**Permissions:**
- Articles: `view`, `create`
- Categories: `view`
- Media: `upload`

**Features:**
- Create articles (saved as drafts)
- Edit own draft articles
- Submit articles for review
- Cannot publish or edit others' articles
- Media upload for articles

---

## 🛠️ Backend Implementation

### Models

#### User Model
```php
$user->roles();                    // Get all roles
$user->permissions();              // Get direct permissions
$user->assignRole('admin');        // Assign role
$user->syncRoles(['manager', 'reporter']); // Replace roles
$user->hasRole('admin');           // Check role
$user->hasPermission('users.create'); // Check permission
$user->isAdmin();                  // Helper method
```

#### Role Model
```php
$role->users();                    // Get users with this role
$role->permissions();              // Get permissions
$role->syncPermissionsByName(['users.view', 'articles.create']);
$role->hasPermission('articles.approve');
```

#### Permission Model
```php
Permission::grouped();             // Get permissions grouped by category
```

#### Article Model
```php
$article->author();                // Get author user
$article->published();             // Scope: get published articles
$article->pending();               // Scope: get pending articles
$article->draft();                 // Scope: get draft articles
```

---

### Controllers

#### UserController
- `index()` - List users with filters (role, status, search)
- `store()` - Create user with role assignment
- `update()` - Update user details
- `destroy()` - Delete user
- `bulkDestroy()` - Delete multiple users
- `toggleStatus()` - Toggle active/inactive

#### RoleController
- `index()` - List roles with permissions
- `store()` - Create new role
- `update()` - Update role and permissions
- `destroy()` - Delete role (except system roles)

#### ArticleController
- `index()` - List articles (filtered by role)
- `create()` - Show create form
- `store()` - Create article
- `edit()` - Show edit form
- `update()` - Update article
- `destroy()` - Delete article
- `submit()` - Submit for approval
- `approve()` - Manager/Admin approve
- `reject()` - Manager/Admin reject

---

### Middleware

#### CheckRole
```php
Route::middleware('role:admin')->group(...);           // Single role
Route::middleware('role:admin,manager')->group(...);  // Multiple roles
```

#### CheckPermission
```php
Route::middleware('permission:users.create')->group(...);
Route::middleware('permission:articles.approve,articles.edit')->group(...);
```

---

### Policies

#### ArticlePolicy
Authorizes article actions based on user role:

```php
// Admins bypass all checks via before()
$user->can('create', Article::class);    // Reporter+
$user->can('update', $article);          // Author (draft) or Manager+
$user->can('delete', $article);          // Author (draft) or Admin
$user->can('approve', $article);         // Manager+ on pending articles
$user->can('publish', $article);         // Admin only
```

---

## 🎨 Frontend Components

### Admin Dashboard Pages

#### 1. **User Management** (`/admin/users`)
**Features:**
- Data table with columns: Name, Email, Role, Status, Actions
- Filters: Search (name/email), Role dropdown, Status dropdown
- Pagination: 10 items per page
- Bulk deletion with confirmation
- Actions dropdown: Edit, Delete
- Modals: Add/Edit User, Delete Confirmation

**Form Validation:**
- Name: required, max 255
- Email: required, unique, valid format
- Password: required (8+ chars), confirmed
- Role: required, exists in roles
- Status: required, active/inactive

#### 2. **Role Management** (`/admin/roles`)
**Features:**
- Roles table with columns: Name, Display Name, Color, Users Count
- Permissions grouped by category in tabs
- Checkboxes for fine-grained permission assignment
- Modal forms for create/edit
- System roles (admin, manager, reporter) cannot be deleted

#### 3. **Dashboard** (`/admin/dashboard`)
System overview with stats and controls

---

### Manager Dashboard
- Stats: Pending articles, Published articles, Report count
- Quick access to article management
- Overview of workflow

---

### Reporter Dashboard
- Stats: Draft articles, Pending review, Published
- Recent articles with status badges
- Quick "New Article" button
- Chart showing articles & views over time

---

## 🔌 API Routes

### Admin Routes (Requires: `role:admin`)
```
GET    /admin/users              - List users
POST   /admin/users              - Create user
PUT    /admin/users/{id}         - Update user
DELETE /admin/users/{id}         - Delete user
DELETE /admin/users              - Bulk delete (with ids[])
PATCH  /admin/users/{id}/toggle-status - Toggle status

GET    /admin/roles              - List roles
POST   /admin/roles              - Create role
PUT    /admin/roles/{id}         - Update role
DELETE /admin/roles/{id}         - Delete role
```

### Manager Routes (Requires: `role:admin,manager`)
```
GET    /manager/dashboard        - Manager dashboard
GET    /manager/articles         - List articles (pending, published)
POST   /articles/{id}/approve    - Approve article
POST   /articles/{id}/reject     - Reject article
```

### Reporter Routes (Requires: `role:admin,manager,reporter`)
```
GET    /reporter/dashboard       - Reporter dashboard
GET    /reporter/articles        - List articles (own)
GET    /reporter/articles/create - Create form
POST   /reporter/articles        - Store article
GET    /reporter/articles/{id}/edit - Edit form
PUT    /reporter/articles/{id}   - Update article
DELETE /reporter/articles/{id}   - Delete article
POST   /articles/{id}/submit     - Submit for approval
```

### Public Routes
```
GET    /articles/{slug}          - View published article
```

---

## 📊 Activity Logging

All user actions are logged in `activity_logs` table:

```php
ActivityLog::record('created', 'Created user John', $user, [
    'name'  => 'John Doe',
    'email' => 'john@example.com',
    'role'  => 'reporter'
]);
```

**Logged Actions:**
- User creation, update, deletion
- Role/Permission changes
- Article status changes
- Status toggles

---

## 🔄 Data Flow Examples

### Creating a User (Admin)
1. Admin opens `/admin/users`
2. Clicks "Add User" → Modal opens
3. Enters name, email, password, selects role
4. Form validates on backend
5. User created with assigned role
6. Activity logged
7. Toast notification shown
8. Table refreshed

### Submitting an Article (Reporter)
1. Reporter creates article as "draft"
2. Clicks "Submit for Review"
3. Article status changes to "pending"
4. Manager receives notification
5. Manager can approve/reject
6. Reporter notified of decision

---

## 🚀 Default Seeded Data

### Users
```php
Email: admin@newsportal.com       | Password: password | Role: Admin
Email: manager@newsportal.com     | Password: password | Role: Manager
Email: reporter@newsportal.com    | Password: password | Role: Reporter
```

### Permissions
- **Users**: view, create, edit, delete
- **Roles**: view, create, edit, delete, assign
- **Articles**: view, create, edit, delete, approve, publish
- **Categories**: view, create, edit, delete
- **Media**: upload, delete
- **Analytics**: view

---

## 🎯 UI Components Used

### shadcn/ui Components
- **Button** - Actions and CTAs
- **Dialog** - Modals for forms
- **Dropdown Menu** - Row actions
- **Table** - Data display
- **Badge** - Role/Status indicators
- **Input** - Form fields
- **Select** - Dropdowns
- **Switch** - Toggle controls
- **Tabs** - Permission grouping
- **Checkbox** - Permission selection
- **Card** - Content containers
- **Alert** - Notifications
- **Toast** - Success/Error messages
- **Sidebar** - Main navigation

---

## 🎨 Design System

### Colors
- **Admin** → Red (#ef4444)
- **Manager** → Blue (#3b82f6)
- **Reporter** → Green (#10b981)

### Status Badges
- **active** → Green
- **inactive** → Gray
- **draft** → Gray
- **pending** → Yellow
- **published** → Green
- **rejected** → Red

---

## 🔐 Security Considerations

1. **Authentication**: All admin/manager/reporter routes require authentication + verification
2. **Authorization**: Policies enforce role-based access at controller level
3. **Validation**: All inputs validated on backend
4. **Activity Logging**: All changes tracked for audit trail
5. **Status Checks**: Inactive users cannot perform actions
6. **Password Hashing**: Bcrypt hashing with automatic casting
7. **CSRF Protection**: Built-in Laravel protection

---

## 📝 Usage Examples

### Assigning Permissions Programmatically
```php
// In a migration or artisan command
$admin = Role::findByName('admin');
$admin->syncPermissionsByName([
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'articles.view', 'articles.approve'
]);
```

### Checking Permissions in Controller
```php
if ($user->hasPermission('articles.approve')) {
    // Show approval UI
}
```

### Using Policies
```php
// In Controller
$this->authorize('approve', $article);

// In Blade (if using Blade templates)
@can('approve', $article)
    <button>Approve</button>
@endcan
```

---

## 📦 File Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/
│   │   │   ├── UserController.php
│   │   │   └── RoleController.php
│   │   └── ArticleController.php
│   └── Middleware/
│       ├── CheckRole.php
│       └── CheckPermission.php
├── Models/
│   ├── User.php
│   ├── Role.php
│   ├── Permission.php
│   ├── Article.php
│   └── ActivityLog.php
└── Policies/
    └── ArticlePolicy.php

resources/js/
├── pages/
│   ├── admin/
│   │   ├── users/index.tsx
│   │   └── roles/index.tsx
│   ├── manager/dashboard.tsx
│   └── reporter/dashboard.tsx
└── types/
    └── auth.ts

database/
├── migrations/
│   ├── *_create_users_table.php
│   ├── *_create_roles_table.php
│   ├── *_create_permissions_table.php
│   ├── *_create_role_has_permissions_table.php
│   ├── *_create_model_has_roles_table.php
│   ├── *_create_model_has_permissions_table.php
│   ├── *_create_activity_logs_table.php
│   └── *_create_articles_table.php
└── seeders/
    └── RolesAndPermissionsSeeder.php
```

---

## 🧪 Testing

### Test User Scenarios

**Scenario 1: Admin Creates User**
1. Login as admin@newsportal.com (password: password)
2. Go to /admin/users
3. Click "Add User"
4. Fill form with:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPass123
   - Role: Reporter
5. Submit → User created with Reporter role

**Scenario 2: Reporter Submits Article**
1. Login as reporter@newsportal.com
2. Go to /reporter/articles
3. Click "New Article"
4. Fill title, content
5. Save as draft
6. Submit for review → Status = pending

**Scenario 3: Manager Approves Article**
1. Login as manager@newsportal.com
2. Go to /manager/articles
3. Find pending article
4. Click "Approve" → Published

---

## 🔧 Extending the System

### Adding a New Permission
```php
// In migration or seeder
Permission::firstOrCreate([
    'name' => 'comments.moderate',
    'display_name' => 'Moderate Comments',
    'group' => 'comments'
]);
```

### Adding a Custom Role
```php
$moderator = Role::create([
    'name'         => 'moderator',
    'display_name' => 'Moderator',
    'description'  => 'Moderate user-generated content',
    'color'        => 'purple'
]);

$moderator->syncPermissionsByName([
    'comments.view', 'comments.delete'
]);
```

---

## 🐛 Troubleshooting

**Issue**: `SQLSTATE[HY000]: General error: 1 no such table: roles`
**Solution**: Run migrations - `php artisan migrate`

**Issue**: Users not seeing admin menu
**Solution**: Check user roles - ensure user has 'admin' role assigned

**Issue**: Edit modal shows old data
**Solution**: Clear browser cache or use incognito mode

---

## 📚 References

- [Laravel Authorization Docs](https://laravel.com/docs/11.x/authorization)
- [Inertia.js React Docs](https://inertiajs.com/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Laravel Policies](https://laravel.com/docs/11.x/authorization#creating-policies)

---

## 📄 License

MIT License - Free for commercial and personal use.

---

**Version**: 1.0.0  
**Last Updated**: March 2026  
**Maintainer**: News Portal Team
