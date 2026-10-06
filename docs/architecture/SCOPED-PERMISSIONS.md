# Scoped Permissions & Hierarchy Resolution

## 1. Concept: Scope-Bound Entitlements

A role in Community OS is not a global stamp. A single user can hold different roles in different organizations or communities simultaneously:

- User A is an `ORG_ADMIN` in **Organization 1** (managing all communities inside Org 1).
- User A is a `COMMUNITY_ADMIN` in **Community X** of **Organization 2**.
- User A is a regular resident in **Community Y**.

---

## 2. Downward Scope Inheritance

Community OS implements explicit downward scope inheritance:
$$\text{PLATFORM} \implies \text{ORGANIZATION} \implies \text{COMMUNITY}$$

- An assignment at `ORGANIZATION` scope (`scopeType: 'ORGANIZATION', scopeId: 'org-A'`) automatically authorizes operations on any community where `community.organizationId == 'org-A'`.
- An assignment at `COMMUNITY` scope (`scopeType: 'COMMUNITY', scopeId: 'comm-B'`) only authorizes operations where `targetScope.scopeId == 'comm-B'`. It grants **zero** authority over other communities or the parent organization.

---

## 3. Upward Escalation Defense

Upward inheritance is strictly prohibited. Holding administrative permissions on a child community does not grant access to query or update the parent organization or sister communities.
