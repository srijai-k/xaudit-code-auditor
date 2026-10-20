const secret = process.env.JWT_SECRET;
const token = jwt.sign({ id: user.id }, secret, { expiresIn: "1h" });
