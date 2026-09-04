test('returns the stored password', () => {
  const user = getUser();
  expect(user.password).toBe("test123");
});
