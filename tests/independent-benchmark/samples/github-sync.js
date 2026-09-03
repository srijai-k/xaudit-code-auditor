// A small internal tool that syncs issues from GitHub. Realistic leak
// pattern: a token hardcoded directly into the header value instead of
// read from an environment variable, under a variable name ("githubAuth")
// that doesn't happen to contain API_KEY/SECRET/TOKEN/PASSWORD — so only
// the vendor-format check can catch this, not the name-context check.
async function fetchOpenIssues(repo) {
    const githubAuth = "ghp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ";
    const res = await fetch(`https://api.github.com/repos/${repo}/issues?state=open`, {
        headers: { Authorization: `Bearer ${githubAuth}` },
    });
    return res.json();
}

module.exports = { fetchOpenIssues };
