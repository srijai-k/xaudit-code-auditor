async function getUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
}
