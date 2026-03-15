export const getOrgRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
        case 'OWNER':
            return {
                className: 'bg-teal-100 text-teal-700',
                label: 'Owner'
            };
        case 'COLLABORATOR':
            return {
                className: 'bg-yellow-100 text-yellow-700',
                label: 'Collaborator'
            };
        default:
            return {
                className: 'bg-gray-100 text-gray-700',
                label: role || 'Unknown'
            };
    }
};

export const getProjectRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
        case 'OWNER':
            return {
                className: 'bg-blue-100 text-blue-700',
                label: 'Owner'
            };
        case 'SUPER_ADMIN':
        case 'SUPERADMIN':
            return {
                className: 'bg-blue-100 text-blue-700',
                label: 'Super Admin'
            };
        case 'EDITOR':
            return {
                className: 'bg-yellow-100 text-yellow-700',
                label: 'Editor'
            };
        case 'SEO_MANAGER':
        case 'SEOMANAGER':
            return {
                className: 'bg-pink-100 text-pink-700',
                label: 'SEO Manager'
            };
        case 'VIEWER':
            return {
                className: 'bg-gray-100 text-gray-700',
                label: 'Viewer'
            };
        default:
            return {
                className: 'bg-purple-100 text-purple-700',
                label: formatRoleLabel(role)
            };
    }
};

const formatRoleLabel = (role: string) => {
    if (!role) return 'Unknown';

    return role
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const isOrgOwner = (userRole: string) => {
    return userRole?.toUpperCase() === 'OWNER';
};

export const isProjectOwner = (userRole: string) => {
    return userRole?.toUpperCase() === 'OWNER';
};

export const canEditProject = (userRole: string) => {
    const role = userRole?.toUpperCase();
    return role === 'OWNER' || role === 'SUPER_ADMIN' || role === 'EDITOR';
};

export const canDeleteProject = (userRole: string) => {
    const role = userRole?.toUpperCase();
    return role === 'OWNER' || role === 'SUPER_ADMIN';
};