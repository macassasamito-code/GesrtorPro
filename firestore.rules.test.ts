/**
 * Verification specification for BancaFácil Firestore security rules.
 * Maps each of the "Dirty Dozen" adversarial payloads to the exact rule gate
 * that rejects it with PERMISSION_DENIED.
 */
export const DIRTY_DOZEN_CHECKS = [
  {
    id: 1,
    name: 'Self-Admin Escalation',
    target: 'users/{uid}',
    operation: 'create',
    payload: { role: 'admin', uid: 'attacker1' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: "incoming().role == 'owner' required for self-registration"
  },
  {
    id: 2,
    name: 'Ghost Field Shadow Write',
    target: 'products/{id}',
    operation: 'create',
    payload: { isPromoted: true },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isValidProduct(incoming()) keys().hasOnly(...)'
  },
  {
    id: 3,
    name: 'Cross-Tenant Product Read',
    target: 'products/{userA_product}',
    operation: 'get',
    payload: { actor: 'userB' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isBusinessMember(existing()) || isAdmin()'
  },
  {
    id: 4,
    name: 'Cross-Tenant List Scraping',
    target: 'sales',
    operation: 'list',
    payload: { actor: 'userB' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'resource.data.ownerUid == request.auth.uid || request.auth.uid in resource.data.memberUids'
  },
  {
    id: 5,
    name: 'Self-Approved Payment Request',
    target: 'paymentRequests/{id}',
    operation: 'create',
    payload: { status: 'approved' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: "incoming().status == 'pending' && incoming().adminNote == ''"
  },
  {
    id: 6,
    name: 'Self-Activated Subscription',
    target: 'subscriptions/{businessId}',
    operation: 'update',
    payload: { status: 'active', expiresAtMs: 9999999999999 },
    expected: 'PERMISSION_DENIED',
    enforcedBy: "Only isAdmin() may set status == 'active' or modify expiresAtMs"
  },
  {
    id: 7,
    name: 'Unverified Admin Email Spoof',
    target: 'paymentRequests',
    operation: 'list',
    payload: { email: 'macassasamito@gmail.com', email_verified: false },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isAdminToken() requires request.auth.token.email_verified == true'
  },
  {
    id: 8,
    name: 'ID Poisoning Attack',
    target: 'products/{1500_char_id}',
    operation: 'create',
    payload: { id: 'a'.repeat(1500) },
    expected: 'PERMISSION_DENIED',
    enforcedBy: "isValidId() enforces size <= 128 && matches('^[a-zA-Z0-9_\\\\-]+$')"
  },
  {
    id: 9,
    name: 'Unbounded Array Resource Exhaustion',
    target: 'sales/{id}',
    operation: 'create',
    payload: { itemsCount: 51 },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'data.items.size() >= 1 && data.items.size() <= 50'
  },
  {
    id: 10,
    name: 'Staff Price Tampering',
    target: 'products/{id}',
    operation: 'update',
    payload: { actorRole: 'staff', salePrice: 1 },
    expected: 'PERMISSION_DENIED',
    enforcedBy: "Staff update branch restricted to affectedKeys().hasOnly(['quantity', 'updatedAt'])"
  },
  {
    id: 11,
    name: 'Terminal Debt State Tampering',
    target: 'debts/{paidDebtId}',
    operation: 'update',
    payload: { status: 'open', remainingAmount: 500 },
    expected: 'PERMISSION_DENIED',
    enforcedBy: "existing().status != 'paid' enforced before non-admin updates"
  },
  {
    id: 12,
    name: 'Client Timestamp Forgery',
    target: 'sales/{id}',
    operation: 'create',
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().createdAt == request.time'
  }
];
