function getUser(id) {
  return prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`;
}
