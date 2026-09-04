function parseAuthHeader(tokenType, token) {
  if (tokenType === "Bearer") {
    return token;
  }
}
