const resetToken = Math.random().toString(36).slice(2);
await sendResetEmail(user.email, resetToken);
