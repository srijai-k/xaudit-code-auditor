// Small, realistic ad-tech style tracking snippet. This kind of code is
// usually copy-pasted from a vendor's integration docs verbatim.
(function initTracking(campaignId, visitorId) {
    document.write(
        '<img src="https://track.example.com/pixel?campaign=' + campaignId + '&visitor=' + visitorId + '" style="display:none">'
    );

    window.addEventListener("load", function () {
        console.log("tracking pixel loaded for campaign", campaignId);
    });
})(window.__CAMPAIGN_ID__, window.__VISITOR_ID__);
