export const generateApiId = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const isValidApiId = (apiId: string): boolean => {
  const apiIdRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return apiIdRegex.test(apiId);
};

export const generateUniqueApiId = (name: string, addTimestamp = false): string => {
  const baseApiId = generateApiId(name);
  
  if (addTimestamp) {
    return `${baseApiId}-${Date.now()}`;
  }
  
  return baseApiId;
};