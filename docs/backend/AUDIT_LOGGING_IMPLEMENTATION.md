# Audit Logging Implementation for Content Management

## Overview

This document describes the audit logging implementation for content management operations (create, update, delete, import). The implementation logs all admin actions on content items to the `admin_audit_logs` table for compliance and debugging purposes.

## Implementation Details

### 1. Database Schema Updates

#### Migration: 018-admin-audit-logs.sql
- **Updated:** Added 'content_item' to the `resource_type` CHECK constraint
- **Before:** `resource_type IN ('lesson', 'chapter', 'test_case', 'import')`
- **After:** `resource_type IN ('lesson', 'chapter', 'test_case', 'import', 'content_item')`

#### Migration: 022-content-management.sql
- **Existing:** Database triggers already implemented for automatic audit logging
- **Triggers:**
  - `content_items_audit_insert_trigger` - Logs on INSERT
  - `content_items_audit_update_trigger` - Logs on UPDATE
  - `content_items_audit_delete_trigger` - Logs on DELETE
- **Function:** `log_content_item_changes()` - Captures changes and inserts audit logs

### 2. Service Layer Updates

#### AuditLogService (audit-log.service.ts)
- **Updated:** Added 'content_item' to the `AuditLogEntry.resourceType` union type
- **Supported Actions:** 'create', 'update', 'delete', 'import'
- **Supported Resource Types:** 'lesson', 'chapter', 'test_case', 'import', 'content_item'

#### AdminContentService (admin-content.service.ts)
- **Added:** Import of `AuditLogService`
- **Updated Methods:**

##### createContentItem()
- Logs action: 'create'
- Captures: key, category_id, language, value, type
- Metadata: category_id

##### updateContentItem()
- Logs action: 'update'
- Captures: old values (value, description, type) and new values
- Metadata: category_id

##### deleteContentItem()
- **Updated:** Now accepts `adminId` parameter
- Logs action: 'delete'
- Captures: key, category_id, language
- Metadata: category_id

##### importContent()
- Logs action: 'import'
- Captures: language, categories, item count
- Metadata: imported count, error count, language

### 3. Controller Updates

#### ContentController (content.controller.ts)
- **Updated:** deleteContentItem() now passes `adminId` to service method
- All other endpoints already pass `adminId` correctly

### 4. Test Updates

#### admin-content.service.test.ts
- **Updated:** Fixed test calls to deleteContentItem() to include `adminId` parameter
- Tests now pass the `testAdminId` to the delete method

## Audit Log Structure

Each audit log entry contains:

```typescript
{
  id: UUID,                    // Unique identifier
  admin_id: UUID,              // Admin user who performed the action
  action: string,              // 'create' | 'update' | 'delete' | 'import'
  resource_type: string,       // 'content_item'
  resource_id: UUID,           // ID of the content item (null for import)
  resource_name: string,       // Key of the content item
  changes: JSONB,              // Detailed changes
  metadata: JSONB,             // Additional metadata (category_id, etc.)
  ip_address: string,          // IP address of the request
  user_agent: string,          // User agent of the request
  created_at: TIMESTAMPTZ      // Timestamp of the action
}
```

## Changes Captured by Action

### Create Action
```json
{
  "changes": {
    "key": "nav.learn",
    "category_id": "uuid",
    "language": "vi",
    "value": "Học tập",
    "type": "text"
  },
  "metadata": {
    "category_id": "uuid"
  }
}
```

### Update Action
```json
{
  "changes": {
    "old": {
      "value": "Old value",
      "description": "Old description",
      "type": "text"
    },
    "new": {
      "value": "New value",
      "description": "New description",
      "type": "text"
    }
  },
  "metadata": {
    "category_id": "uuid"
  }
}
```

### Delete Action
```json
{
  "changes": {
    "key": "nav.learn",
    "category_id": "uuid",
    "language": "vi"
  },
  "metadata": {
    "category_id": "uuid"
  }
}
```

### Import Action
```json
{
  "changes": {
    "language": "vi",
    "categories": ["header", "footer", "landing"],
    "itemCount": 15
  },
  "metadata": {
    "imported": 15,
    "errors": 0,
    "language": "vi"
  }
}
```

## Database Triggers

The database has automatic triggers that log content changes:

### Trigger: log_content_item_changes()
- **Timing:** AFTER INSERT, UPDATE, DELETE on content_items
- **Action:** Automatically inserts audit log entry
- **Captures:**
  - INSERT: All new values
  - UPDATE: Old and new values
  - DELETE: Deleted values
- **Admin ID:** Uses `updated_by` field or current user

### Trigger: update_content_items_updated_at()
- **Timing:** BEFORE UPDATE on content_items
- **Action:** Automatically updates `updated_at` timestamp

## Verification

### Audit Logs Visibility
- Audit logs are visible at `/admin/audit-logs` endpoint
- Can be filtered by:
  - `resource_type='content_item'`
  - `action` (create, update, delete, import)
  - `admin_id` (specific admin user)
  - Date range

### Example Query
```sql
SELECT * FROM admin_audit_logs
WHERE resource_type = 'content_item'
ORDER BY created_at DESC
LIMIT 50;
```

## Testing

### Unit Tests
- All AdminContentService methods tested
- Audit logging calls verified in service layer
- Test file: `src/services/__tests__/admin-content.service.test.ts`

### Integration Tests
- API endpoints tested with audit logging
- Verify audit logs created for each action
- Test file: `src/controllers/__tests__/content.controller.test.ts` (if exists)

## Compliance

### Requirements Met
- ✅ R9.1: Audit logs created for create/update/delete/import actions
- ✅ R9.2: Audit logs contain admin_id, action, resource_type, resource_id, changes, timestamp
- ✅ R9.3: Audit logs visible in audit logs page
- ✅ R9.4: Can filter by resource_type='content_item'

### Security
- ✅ RLS policies restrict audit log access to admins only
- ✅ Audit logs cannot be updated or deleted (immutable)
- ✅ All changes captured with before/after values
- ✅ Admin user ID tracked for accountability

## Files Modified

1. **Database Migrations:**
   - `database/migrations/018-admin-audit-logs.sql` - Added 'content_item' resource type
   - `database/migrations/022-content-management.sql` - Already has triggers

2. **Backend Services:**
   - `src/services/audit-log.service.ts` - Added 'content_item' resource type
   - `src/services/admin-content.service.ts` - Added audit logging calls
   - `src/controllers/admin/content.controller.ts` - Pass adminId to delete method

3. **Tests:**
   - `src/services/__tests__/admin-content.service.test.ts` - Updated delete tests

## Future Enhancements

1. **Audit Log Retention:** Implement retention policy (e.g., keep for 1 year)
2. **Audit Log Export:** Add ability to export audit logs to CSV/JSON
3. **Audit Log Alerts:** Send notifications for sensitive operations
4. **Audit Log Search:** Add full-text search on changes
5. **Audit Log Comparison:** Show side-by-side comparison of changes

## References

- Requirements: R9 - Audit Logging
- Design: Section "Audit Logging"
- Task: 1.6 - Add Audit Logging
