// A realistic post-login redirect handler. Most of this is completely
// ordinary — redirecting to a path or an external URL based on user
// state — except one code path that builds a "callback URL" by trusting
// a query parameter's scheme, which a real attacker could set to
// javascript: to get arbitrary script execution on click-through.
function redirectAfterLogin(user, returnTo) {
    if (user.isAdmin) {
        location.href = "/admin/dashboard";
        return;
    }
    location.href = "/dashboard/" + user.id;
}

function redirectToPartner(partnerSlug) {
    window.location.href = "https://partners.example.com/" + partnerSlug;
}

function buildCallbackLink(el, callbackScheme, callbackTarget) {
    // Bug: callbackScheme is meant to always be "https:" but nothing
    // actually enforces that, and someone "helpfully" made it configurable.
    el.setAttribute("href", callbackScheme + callbackTarget);
}

function buildKnownJsBookmarklet(el) {
    // A deliberate, fully static bookmarklet — not attacker-influenced at
    // all, must not be confused with the dynamic case above.
    el.setAttribute("href", "javascript:void(document.title='pinned')");
}

function renderCustomAction(actionPayload) {
    // A real bug: someone building a "quick action" link by hand-rolling a
    // javascript: URI with user-supplied content spliced directly in.
    const href = "javascript:" + actionPayload;
    location.href = href;
}
