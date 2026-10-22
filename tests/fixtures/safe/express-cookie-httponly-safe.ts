res.cookie("session", token, { httpOnly: true, secure: true, sameSite: "lax" });
res.cookie("theme", "dark");
