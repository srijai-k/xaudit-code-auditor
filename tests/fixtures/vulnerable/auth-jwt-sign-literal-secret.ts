const token = jwt.sign({ id: user.id, role: user.role }, "mysecret123", { expiresIn: "7d" });
