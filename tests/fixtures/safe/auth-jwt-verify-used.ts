import jwt from 'jsonwebtoken';
function authenticate(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
function peekClaims(token) {
  return jwt.decode(token);
}
