function handleGrant(grantType, credentials) {
  if (grantType === "password") {
    return authenticateWithCredentials(credentials);
  }
}
