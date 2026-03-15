export const PROJECT_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EDITOR: 'EDITOR',
  REVIEWER: 'REVIEWER',
  AUTHOR: 'AUTHOR',
  CONTRIBUTOR: 'CONTRIBUTOR',
  VIEWER: 'VIEWER'
} as const;

export const ROLE_PERMISSIONS = {
  OWNER: ['create', 'read', 'update', 'delete', 'manage_team', 'manage_workflow'],
  ADMIN: ['create', 'read', 'update', 'delete', 'manage_team'],
  MANAGER: ['create', 'read', 'update', 'manage_team'],
  EDITOR: ['create', 'read', 'update'],
  REVIEWER: ['read', 'approve'],
  AUTHOR: ['create', 'read'],
  CONTRIBUTOR: ['create', 'read'],
  VIEWER: ['read']
};

export const ROLE_DESCRIPTIONS = {
  OWNER: 'Full access, manage everything',
  ADMIN: 'Full access except billing',
  MANAGER: 'Can manage content & team',
  EDITOR: 'Can create & edit content',
  REVIEWER: 'Can review & approve content',
  AUTHOR: 'Can only create own content',
  CONTRIBUTOR: 'Can suggest changes',
  VIEWER: 'Read-only access'
};