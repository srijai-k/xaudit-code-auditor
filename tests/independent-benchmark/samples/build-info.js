// Build metadata stamped in at build time — commit hashes, a package
// integrity hash, and a CDN asset URL. None of this is a secret; all of it
// is meant to be public. Realistic stress-test for the entropy fallback in
// a file that isn't specifically designed to test it.
const BUILD_INFO = {
    commitSha: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
    shortSha: "da39a3e",
    builtAt: "2026-09-03T00:00:00.000Z",
    mainBundleUrl: "https://cdn.example.com/assets/main-8f3a9c2e1b7d4f6a.js",
    lockfileIntegrity: "sha512-abc123DEFghiJKLmnoPQRstuVWXyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno==",
};

function printBuildInfo() {
    console.log(`Built from ${BUILD_INFO.shortSha} at ${BUILD_INFO.builtAt}`);
}

module.exports = { BUILD_INFO, printBuildInfo };
