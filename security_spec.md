# BancaFácil — Security Rules Specification

## 1. Data Invariants
1. **Business Isolation**: Every `products`, `sales`, `customers`, `debts`, `payments`, and `subscriptions` document MUST belong to an existing `businesses/{businessId}` document and restrict read/write strictly to `ownerUid`, `memberUids` (max 3 UIDs: owner + up to 2 staff), or verified platform `admin`.
2. **RBAC Privilege Protection**: Users cannot self-assign `role: 'admin'` or self-approve `paymentRequests` (`status: 'approved'`) or self-activate `subscriptions` (`status: 'active'`).
3. **Staff Scope Restriction**: `staff` members can create `sales`, `debts`, `payments`, and decrement `products.quantity` during a sale, but cannot create/delete products, edit product prices, edit business settings, or manage team members.
4. **Terminal State Locking**: Once a `paymentRequest` reaches `'approved'` or `'rejected'`, non-admin users cannot update it.
5. **Temporal Integrity & Immutability**: `createdAt` and `updatedAt` MUST match `request.time`, and `ownerUid` / `businessId` / `createdAt` remain immutable on update.
6. **Zero-Blanket PII Protection**: `users`, `customers`, `businesses`, `paymentRequests`, and `passwordResetRequests` never allow blanket `isSignedIn()` reads or list queries without `resource.data` ownership filters.

## 2. The "Dirty Dozen" Payloads (Adversarial Tests)
1. **Self-Admin Escalation**: `users/{uid}` create with `{ role: 'admin' }` -> `PERMISSION_DENIED`.
2. **Ghost Field Shadow Write**: `products/{id}` create with `{ ..., isPromoted: true }` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Product Read**: User B attempts `get(/products/{userA_product})` -> `PERMISSION_DENIED`.
4. **Cross-Tenant List Scraping**: User B runs `list(/sales)` without `memberUids` / `ownerUid` match -> `PERMISSION_DENIED`.
5. **Self-Approved Payment Request**: Owner creates `paymentRequests/{id}` with `{ status: 'approved' }` -> `PERMISSION_DENIED`.
6. **Self-Activated Subscription**: Owner updates `subscriptions/{businessId}` to `{ status: 'active', expiresAtMs: 9999999999999 }` -> `PERMISSION_DENIED`.
7. **Unverified Admin Email Spoof**: Unverified user token claiming `macassasamito@gmail.com` with `email_verified: false` attempts admin read -> `PERMISSION_DENIED`.
8. **ID Poisoning Attack**: `products/{1500_char_id}` create -> `PERMISSION_DENIED`.
9. **Unbounded Array / Resource Exhaustion**: `sales/{id}` create with `items.size() > 50` -> `PERMISSION_DENIED`.
10. **Staff Price Tampering**: Staff user attempts `update` on `products/{id}` changing `salePrice` -> `PERMISSION_DENIED`.
11. **Terminal State Tampering**: Owner attempts to revert `paymentRequests/{id}` from `rejected` back to `pending` -> `PERMISSION_DENIED`.
12. **Client Timestamp Forgery**: `sales/{id}` create with backdated `createdAt` (`!= request.time`) -> `PERMISSION_DENIED`.
