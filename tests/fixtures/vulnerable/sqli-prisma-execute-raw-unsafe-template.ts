function rename(id, name) {
  return prisma.$executeRawUnsafe(`UPDATE users SET name = '${name}' WHERE id = ${id}`);
}
