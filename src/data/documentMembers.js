import { USERS } from './users'

// Mock assignment per ticket. Backend nantinya mengirim daftar ini berdasarkan
// request/task yang sedang dibuka. Role mengikuti role bisnis SITARA.
export const DEFAULT_DOCUMENT_MEMBERS = [
  { role: 'Requestor', name: USERS.requestor.name, email: USERS.requestor.email },
  { role: 'Team Legal', name: USERS.legal.name, email: USERS.legal.email },
  { role: 'Collaborator', name: USERS.collaborator.name, email: USERS.collaborator.email },
]

export function getDocumentMembers() {
  return DEFAULT_DOCUMENT_MEMBERS
}
