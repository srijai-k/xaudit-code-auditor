const express = require("express");
const router = express.Router();

// A realistic small Express router: one handler builds SQL by hand (a
// common mistake when someone "just needs a quick filter"), the other two
// use parameterized queries correctly.
router.get("/users/:id", async (req, res) => {
    const user = await db.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    res.json(user);
});

router.get("/users", async (req, res) => {
    const search = req.query.name || "";
    // Bug: built by hand instead of parameterized, presumably because the
    // author needed a LIKE clause and didn't realize db.query supports
    // parameters there too.
    const sql = "SELECT * FROM users WHERE name LIKE '%" + search + "%'";
    const results = await db.query(sql);
    res.json(results);
});

router.delete("/users/:id", async (req, res) => {
    await db.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.status(204).end();
});

module.exports = router;
