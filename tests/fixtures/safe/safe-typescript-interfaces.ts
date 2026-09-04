interface User {
  id: string;
  name: string;
  roles: string[];
}
export function isAdmin(user: User): boolean {
  return user.roles.includes('admin');
}
