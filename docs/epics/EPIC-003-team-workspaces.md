# EPIC-003: Team Workspaces

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** 8 (Platform Scale)
**Priority:** Medium

---

## Problem Statement

Omnis currently operates as a single-user platform. Users can add people and create boards, but there's no way to:

1. **Collaborate** with family members or partners on shared profile data
2. **Share access** to a household's profiles without sharing login credentials
3. **Enable practitioners** to manage client groups professionally
4. **Separate contexts** (personal family vs. client work)

The Phase 8 roadmap calls for "Team workspaces (households/teams)" with role-based access, shared boards, and group reports.

## Proposed Solution

Implement multi-tenant workspaces with:

### Workspace Types
- **Personal** (default): Single user, current behavior
- **Household**: Family members collaborating on shared profiles
- **Practitioner**: Professional managing client profiles

### Roles & Permissions
| Role | Capabilities |
|------|--------------|
| Owner | Full access, billing, member management |
| Admin | Full access except billing |
| Editor | Add/edit profiles, create boards |
| Viewer | Read-only access to profiles and boards |

### Key Features
1. **Workspace Creation**: Convert personal account to workspace or create new
2. **Member Invitations**: Email invites with role assignment
3. **Shared Profiles**: Profiles belong to workspace, visible to members
4. **Shared Boards**: Boards can be workspace-level or personal
5. **Workspace Switching**: Users can belong to multiple workspaces
6. **Billing per Workspace**: Practitioner plan unlocks workspace features

## Affected Components

| Component | Changes |
|-----------|---------|
| `src/lib/services/workspaces.ts` | New - Workspace CRUD, member management |
| `src/lib/services/invitations.ts` | New - Invite flow, email sending |
| `src/app/api/workspaces/` | New - Workspace API endpoints |
| `src/app/app/settings/workspace/` | New - Workspace settings UI |
| `src/components/workspace/` | New - WorkspaceSwitcher, MemberList, InviteModal |
| `src/lib/hooks/use-workspace.ts` | New - Current workspace context |
| Database | New tables: workspaces, workspace_members, invitations |
| All existing queries | Update - Add workspace_id filtering |

## Success Criteria

- [ ] Users can create a workspace (Practitioner plan required)
- [ ] Workspace owner can invite members via email
- [ ] Members accept invites and join with assigned role
- [ ] All profiles/boards scoped to workspace
- [ ] Role-based permission checks on all mutations
- [ ] Users can switch between workspaces
- [ ] Workspace settings page with member management
- [ ] Owner can transfer ownership
- [ ] Member can leave workspace
- [ ] Owner can remove members
- [ ] Personal workspace remains default for all users

## Tasks (Post-Approval)

1. Design database schema for workspaces and members
2. Create migrations
3. Build workspace service with CRUD operations
4. Create invitation service with email flow
5. Add workspace context provider
6. Update all data queries to filter by workspace
7. Build workspace settings UI
8. Create member management components
9. Build workspace switcher in sidebar
10. Add permission middleware for role checks
11. Update onboarding to create personal workspace
12. Write comprehensive tests
13. Document workspace model for users

## Dependencies

- EPIC-001 (Billing) - Practitioner plan gates workspace creation
- Email service for invitations (Resend/SendGrid)

## Database Schema Preview

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal', -- personal, household, practitioner
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'viewer', -- owner, admin, editor, viewer
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  PRIMARY KEY (workspace_id, user_id)
);
```

## Estimated Effort

- **Development:** 4-5 weeks
- **Testing:** 1 week
- **Total:** 5-6 weeks

## References

- `/specs/FEATURE_ROADMAP.md` - Phase 8 description
- Multi-tenant SaaS patterns
