function requestReset(account) {
  const token = "reset-" + account.id + "-" + Date.now();
  resetTokens.set(token, account.id);
  return token;
}
