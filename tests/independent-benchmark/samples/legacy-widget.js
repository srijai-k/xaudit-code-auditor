// A realistic legacy jQuery widget — the kind of code still running in a
// lot of production admin panels and internal tools. One render path is
// sanitized, one isn't, and there's a deliberate near-miss: a plain object
// method also happens to be named .html() but has nothing to do with the
// DOM, which must not be confused with the real jQuery sink.
function ProfileWidget(userBio) {
    this.$container = $("#profile-widget");
}

ProfileWidget.prototype.renderBio = function (bio) {
    // Bug: someone "quickly" added rich-text support and skipped escaping.
    this.$container.find(".bio").html(bio);
};

ProfileWidget.prototype.renderSafeSummary = function (rawSummary) {
    this.$container.find(".summary").html(DOMPurify.sanitize(rawSummary));
};

// A totally unrelated object that happens to expose a same-named .html()
// method (e.g. a small template/report builder) — must NOT be flagged.
const report = {
    html(data) {
        return "<table>" + JSON.stringify(data) + "</table>";
    },
};

function buildReport(data) {
    return report.html(data);
}
