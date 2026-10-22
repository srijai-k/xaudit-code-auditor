const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(attempt, hash);
