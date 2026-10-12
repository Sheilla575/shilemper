// Mock authenticated identities. In production this comes from SSO (see DESIGN.md §15) —
// SSO is the authentication mechanism only, never a business actor.
export const USERS = {
  requestor: {
    id: 'usr-001',
    name: 'Budi Santoso',
    role: 'Non-Legal',
    roleKey: 'nonlegal',
    division: 'Commercial & Sales Division',
    email: 'budi.santoso@sena.co.id',
    initials: 'BS',
  },
  legal: {
    id: 'usr-002',
    name: 'Ahmad Fauzi, S.H.',
    role: 'Team Legal',
    roleKey: 'legal',
    division: 'Senior Legal Counsel',
    email: 'a.fauzi@sena.co.id',
    initials: 'AF',
  },
  collaborator: {
    id: 'usr-003',
    name: 'Dimas Suryo, S.E., Ak.',
    role: 'Non-Legal',
    roleKey: 'nonlegal',
    division: 'Tax & Finance Specialist',
    email: 'd.suryo@sena.co.id',
    initials: 'DS',
  },
}
