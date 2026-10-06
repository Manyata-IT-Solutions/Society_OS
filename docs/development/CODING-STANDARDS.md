# Coding Standards & Engineering Conventions

## 1. TypeScript & Code Quality Rules

1. **Strict TypeScript is Mandatory**:
   - `strict: true` and `noUncheckedIndexedAccess: true` must remain enabled.
   - Never use `any` unless writing generic serialization adapters with explicit justification. Use `unknown` and runtime type guards / Zod schemas instead.
   - Never use `@ts-ignore` or `@ts-nocheck` to bypass compilation errors.
2. **Explicit Return Types**:
   - Public service methods, repository methods, and API controller endpoints should specify explicit return types.
3. **No Circular Dependencies**:
   - Shared domain entities and contracts belong in `@community-os/types` or `@community-os/contracts`.
4. **No Console Logs in Production Code**:
   - Use the structured logger (`createLogger` or `LoggerService`) with contextual metadata.
5. **No Giant Utility Files**:
   - Avoid generic `utils.ts` files containing 50 unrelated functions. Group utilities by single responsibility (e.g., `date-utils.ts`, `currency-utils.ts`).

---

## 2. Git & Commit Guidelines

### Conventional Commits

All commits must follow the Conventional Commits specification:

- `feat(property): add tower cluster hierarchy model`
- `fix(auth): correct token expiry calculation`
- `refactor(database): extract base repository query helper`
- `docs(api): update multi-tenancy architecture guide`
- `chore(deps): update pnpm lockfile`
- `test(health): add readiness probe failure tests`

### Branching Strategy

- `main`: Production-ready trunk branch.
- Feature branches: `feat/<domain>-<short-description>` (e.g. `feat/auth-session-management`).
- Bugfix branches: `fix/<issue-description>`.
- Pull Requests require passing CI checks (`lint`, `typecheck`, `test`, `build`) before merging.
