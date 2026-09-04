function getUser(id) {
  return prisma.$queryRawUnsafe("SELECT * FROM users WHERE id = " + id);
}
