# Tenant Memberships Architecture

## 1. Identity vs Membership

In Community OS, identity and tenancy are decoupled:

1. **User Identity (`User`)**: Represents the human principal (email, phone, credentials, preferred language, timezone). A user identity exists once in the platform.
2. **Tenant Membership (`TenantMembership`)**: Represents the association between a User and an Organization / Community tenant.

```
       +--------------------+
       |    User Identity   |
       +---------+----------+
                 |
        +--------+--------+
        |                 |
+-------v-------+ +-------v-------+
|  Membership   | |  Membership   |
|  (Org Alpha)  | |   (Org Beta)  |
+---------------+ +---------------+
```

---

## 2. Membership Lifecycle & States

Memberships follow a managed lifecycle:

- `INVITED`: Invitation sent; user has not completed onboarding.
- `ACTIVE`: Fully active membership; permissions apply.
- `SUSPENDED`: Temporarily halted (e.g. pending investigation); permissions suspended.
- `REVOKED`: Access revoked permanently.
- `EXPIRED`: Time-bound contractor/vendor access expired.
