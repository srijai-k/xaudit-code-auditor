import jwt from 'jsonwebtoken';
function getUserId(token) {
  const decoded = jwt.decode(token);
  return decoded.userId;
}
