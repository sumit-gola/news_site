# 🧪 Complete Testing Guide - RBAC Module

## Pre-Testing Checklist

- [x] All migrations run
- [x] All seeders executed
- [x] No TypeScript errors
- [x] No Laravel syntax errors
- [x] Routes configured
- [x] Middleware registered

---

## Login Credentials

| Role     | Email                      | Password |
|----------|----------------------------|----------|
| **Admin**    | admin@newsportal.com   | password |
| **Manager**  | manager@newsportal.com | password |
| **Reporter** | reporter@newsportal.com | password |

---

## Test Case 1: Admin Create User ✅

### Steps:
1. Login with: `admin@newsportal.com / password`
2. Navigate to `/admin/users`
3. Click "Add User" button
4. Fill in form:
   ```
   Name: Test Reporter
   Email: testreporter@example.com
   Password: TestPass123!
   Password Confirmation: TestPass123!
   Role: Reporter
   Status: Active
   ```
5. Click "Create User"

### Expected Results:
- [ ] Modal closes
- [ ] Toast: "User created successfully"
- [ ] New user appears in table
- [ ] User has "Reporter" role badge (green)
- [ ] Activity log created
- [ ] Can search by new user's email

---

## Test Case 2: Admin Edit User ✅

### Steps:
1. Still logged in as Admin
2. In `/admin/users` table, click Edit icon on any user
3. Change name to "Updated Name"
4. Leave password blank (to keep existing)
5. Change status to "Inactive"
6. Click "Save Changes"

### Expected Results:
- [ ] Modal closes
- [ ] Toast: "User updated successfully"
- [ ] Table shows updated name
- [ ] Status shows "Inactive"
- [ ] Activity log shows update

---

## Test Case 3: Admin Bulk Delete Users ✅

### Steps:
1. In `/admin/users`, select checkboxes for 2+ users
2. "Delete X selected" button appears
3. Click the button
4. Confirmation dialog appears
5. Click "Delete"

### Expected Results:
- [ ] Dialog closes
- [ ] Toast: "X users deleted"
- [ ] Users removed from table
- [ ] Activity logs for each deletion
- [ ] Cannot delete self

---

## Test Case 4: Admin Toggle User Status ✅

### Steps:
1. In `/admin/users`, look for status cell
2. Click status toggle button
3. Status changes: active ↔ inactive

### Expected Results:
- [ ] Status changes immediately
- [ ] Toast: "User status updated"
- [ ] Badge reflects new status
- [ ] Activity logged

---

## Test Case 5: Admin Manage Roles ✅

### Steps:
1. Navigate to `/admin/roles`
2. See table with: Name, Display Name, Color, Users Count
3. Click on "Reporter" role
4. View/Edit modal opens

### Expected Results:
- [ ] Role details display
- [ ] Permissions shown in tabs/checkboxes
- [ ] Can toggle permissions on/off
- [ ] Changes save
- [ ] Cannot delete system roles (admin, manager, reporter)

---

## Test Case 6: Reporter Create Article ✅

### Steps:
1. Logout and login as: `reporter@newsportal.com / password`
2. Sidebar shows: Dashboard, Articles
3. Click Articles
4. Click "New Article"
5. Fill form:
   ```
   Title: My First Article
   Excerpt: Short summary
   Content: Detailed article content here...
   ```
6. Click Save

### Expected Results:
- [ ] Redirected to edit page
- [ ] Toast: "Article created. Edit and submit for review."
- [ ] Article status: Draft
- [ ] Can see "Submit for Review" button
- [ ] Reporter can only edit own article

---

## Test Case 7: Reporter Submit Article ✅

### Steps:
1. Still as Reporter
2. In Articles list, find draft article
3. Click Edit or View
4. Click "Submit for Review"

### Expected Results:
- [ ] Article status changes to Pending
- [ ] Toast: "Article submitted for review"
- [ ] Cannot edit after submission
- [ ] Manager can now see it

---

## Test Case 8: Manager Approve Article ✅

### Steps:
1. Logout and login as: `manager@newsportal.com / password`
2. Navigate to `/manager/articles`
3. See pending articles
4. Find the article from Test Case 7
5. Click "Approve"

### Expected Results:
- [ ] Article status: Published
- [ ] Toast: "Article approved and published"
- [ ] Article appears in Published section
- [ ] published_at timestamp set
- [ ] Now publicly visible

---

## Test Case 9: Manager Dashboard ✅

### Steps:
1. Manager logged in
2. Click Dashboard
3. View `/manager/dashboard`

### Expected Results:
- [ ] Shows stats cards: Pending, Published, Reporters
- [ ] Numbers display
- [ ] Cards have icon and color
- [ ] Quick access section visible

---

## Test Case 10: Reporter Dashboard ✅

### Steps:
1. Logout and login as: `reporter@newsportal.com / password`
2. Click Dashboard
3. View `/reporter/dashboard`

### Expected Results:
- [ ] Shows stat cards: Drafts, Pending, Published
- [ ] Performance summary shows: Total Views, This Month, Rating, Approval Rate
- [ ] Recent articles list visible
- [ ] "New Article" button prominent

---

## Test Case 11: Search and Filter Users ✅

### Steps:
1. Admin at `/admin/users`
2. Type in search: "manager"
3. Press Enter or wait for debounce
4. Filter by Role: Select "Manager"
5. Filter by Status: Select "Inactive"

### Expected Results:
- [ ] Results update in real-time
- [ ] Only matching users shown
- [ ] Filters work together
- [ ] Results persist in URL (query string)
- [ ] Pagination resets to page 1

---

## Test Case 12: Permission-Based Features ✅

### Steps:
1. Create a custom role (as Admin)
2. Give it only "articles. view" permission
3. Assign to a user
4. Logout and login as that user

### Expected Results:
- [ ] User can see articles
- [ ] Cannot create articles
- [ ] Cannot edit articles
- [ ] Cannot approve articles
- [ ] Sidebar shows limited options

---

## Test Case 13: Access Control - Unauthorized ✅

### Steps:
1. Login as Reporter
2. Try to access `/admin/users` directly
3. Try to access `/manager/articles` as reporter

### Expected Results:
- [ ] Get 403 Forbidden error
- [ ] Cannot create, edit, delete other users
- [ ] Cannot approve articles
- [ ] Sidebar doesn't show unauthorized sections

---

## Test Case 14: Inactive User Restrictions ✅

### Steps:
1. Admin toggles a user to "Inactive"
2. That user tries to login
3. User logs in with valid credentials

### Expected Results:
- [ ] User can still login (status doesn't block auth)
- [ ] Actions checking `$user->isActive()` fail (future enhancement)
- [ ] Display warning if needed

---

## Test Case 15: Activity Logging ✅

### Steps:
1. Perform these actions as Admin:
   - Create user
   - Edit user
   - Toggle status
   - Delete user
2. Use Tinker to check logs:
   ```bash
   php artisan tinker
   >>> ActivityLog::latest()->limit(10)->get()
   ```

### Expected Results:
- [ ] All actions logged
- [ ] Each log has: user_id, action, subject, description, timestamp
- [ ] Properties captured for changes
- [ ] IP address recorded

---

## Test Case 16: Modals & Forms ✅

### Steps:
1. Admin at `/admin/users`
2. Click "Add User"
3. Modal opens with form
4. Try submitting empty form
5. Fill all fields correctly
6. Submit

### Expected Results:
- [ ] Validation errors show inline
- [ ] Error messages clear and helpful
- [ ] Required fields marked
- [ ] Submit button shows loading state
- [ ] Modal smooth open/close animations
- [ ] Clicking outside modal closes it (if enabled)

---

## Test Case 17: Pagination ✅

### Steps:
1. Admin with many users (create 15+)
2. Go to `/admin/users`
3. See pagination controls
4. Click next page
5. Click previous page

### Expected Results:
- [ ] Table shows 10 items per page
- [ ] Pagination links work
- [ ] Page number highlighted
- [ ] Previous/Next buttons active/disabled correctly
- [ ] Total count accurate

---

## Test Case 18: Toast Notifications ✅

### Steps:
1. Perform successful action: Create user
2. Perform error action: Duplicate email
3. Perform warning action: Delete confirmation

### Expected Results:
- [ ] Success toasts show (green)
- [ ] Error toasts show (red)
- [ ] Toast auto-dismisses after 5s
- [ ] Can manually dismiss
- [ ] Stacking works for multiple toasts
- [ ] Positioned consistently

---

## Test Case 19: Role Badge Colors ✅

### Steps:
1. Admin at `/admin/users`
2. Look at role column
3. See different roles: Admin, Manager, Reporter

### Expected Results:
- [ ] Admin badge: Red/crimson
- [ ] Manager badge: Blue
- [ ] Reporter badge: Green
- [ ] Colors consistent across app
- [ ] Text readable with contrast

---

## Test Case 20: Responsive Design ✅

### Steps:
1. Open app on desktop
2. Resize to tablet (768px)
3. Resize to mobile (375px)

### Expected Results:
- [ ] Tables scroll horizontally on mobile
- [ ] Sidebar collapses on mobile
- [ ] Forms stack vertically
- [ ] Buttons remain clickable
- [ ] Modals fit screen
- [ ] Text readable on all sizes

---

## Test Case 21: Dark/Light Mode (if enabled) ✅

### Steps:
1. Toggle dark mode in settings
2. Check all pages

### Expected Results:
- [ ] Sidebar dark-aware
- [ ] Tables readable in dark mode
- [ ] Modals follow theme
- [ ] Text contrast maintained
- [ ] Colors adjusted for visibility

---

## Test Case 22: State Management ✅

### Steps:
1. Click "Add User"
2. Close modal without submitting
3. Click "Add User" again
4. Form should be empty

### Expected Results:
- [ ] Form resets on open
- [ ] No state persists unnecessarily
- [ ] Edit modal pre-fills correctly
- [ ] Closing/reopening resets

---

## Test Case 23: Concurrent Operations ✅

### Steps:
1. Admin at `/admin/users`
2. Open "Edit User 1" modal
3. In another tab, delete User 1
4. Try to submit edit on first tab

### Expected Results:
- [ ] Server returns 404 or similar
- [ ] Graceful error handling
- [ ] Table auto-updates if needed
- [ ] Clear error message to user

---

## Test Case 24: Permission Grouping ✅

### Steps:
1. Admin at `/admin/roles`
2. Click on a role to edit
3. View permissions tabs

### Expected Results:
- [ ] Permissions grouped by category (users, articles, etc.)
- [ ] Tabs show group names
- [ ] Checkboxes within each tab
- [ ] Can toggle multiple permissions
- [ ] All changes save together

---

## Test Case 25: Empty States ✅

### Steps:
1. Create new user with Reporter role
2. As that Reporter, go to Articles
3. Initially, should be empty

### Expected Results:
- [ ] Shows "No articles" or similar message
- [ ] Offers action to create first article
- [ ] Button links to create form
- [ ] Friendly messaging

---

## Performance Tests

### Load Time Test
```bash
# Measure /admin/users with 100+ users
# Expected: < 1s load time
# Check browser DevTools Network tab
```

### Search Responsiveness
```
# Type quickly in search box
# Should debounce and not lag
# Results update smoothly
```

### Modal Open Speed
```
# Click "Add User"
# Modal should open instantly (< 100ms)
# No noticeable delay
```

---

## Security Tests

### Vulnerable to CSRF?
- [ ] All POST/PUT/DELETE require CSRF token (Laravel handles)

### SQL Injection?
- [ ] All queries use Eloquent ORM (parameterized)
- [ ] Test: `'; DROP TABLE users; --` in search (should safely escape)

### XSS?
- [ ] User input sanitized in templates
- [ ] Test: Input `<script>alert('xss')</script>` in name (should escape)

### Access Control Bypass?
- [ ] Cannot directly access `/admin/*` as non-admin
- [ ] Cannot call unauthorized endpoints
- [ ] Middleware enforces permissions

---

## Database Tests

### Check Migrations
```bash
php artisan migrate --list
# All migrations should show ✓ Ran
```

### Check Seeded Data
```bash
php artisan tinker
>>> Role::count()  # Should be 3+
>>> Permission::count()  # Should be 23+
>>> User::count()  # Should be 3+
```

### Check Relationships
```bash
php artisan tinker
>>> $user = User::find(1);
>>> $user->roles;  # Should return ArrayCollection
>>> $user->permissions;  # Should return ArrayCollection
>>> $user->hasRole('admin');  # Should return boolean
```

---

## API Tests (using Postman/curl)

### Create User via API
```bash
curl -X POST http://localhost:8000/admin/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "email": "new@test.com",
    "password": "pass",
    "role": "reporter"
  }'
```

### Expected: 201 Created with user data

---

## Cleanup After Testing

```bash
# Reset database
php artisan migrate:fresh --seed

# Clear cache
php artisan cache:clear

# Clear logs if needed
rm storage/logs/laravel.log
```

---

## Known Limitations (v1.0)

- [ ] No email notifications yet
- [ ] No file uploads for images
- [ ] Limited category management
- [ ] No advanced reporting/analytics
- [ ] No bulk export features
- [ ] No API documentation

---

## Test Summary Template

| Test # | Name | Status | Notes |
|--------|------|--------|-------|
| 1 | Admin Create User | ✅ | |
| 2 | Admin Edit User | ✅ | |
| 3 | Admin Bulk Delete | ✅ | |
| ... | ... | ... | |
| 25 | Empty States | ✅ | |

---

## Bugs Found During Testing

(Fill in as you find them)

| Bug # | Description | Severity | Status |
|-------|-------------|----------|--------|
| B1 | | | |
| B2 | | | |

---

## Test Results

**Date**: ______________  
**Tester**: ______________  
**Total Tests**: 25  
**Passed**: ____  
**Failed**: ____  
**Blocked**: ____  

**Overall Status**:  ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

**Sign-off**: ______________

---

**Testing Guide Version**: 1.0  
**Last Updated**: March 2026
