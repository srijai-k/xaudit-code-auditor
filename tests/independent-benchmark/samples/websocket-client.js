// A real, historically common anti-pattern: using eval() to parse a
// WebSocket message before JSON.parse was trusted / before the author knew
// better. Still shows up in older codebases and tutorials copied from them.
function connect(url) {
    const socket = new WebSocket(url);

    socket.onmessage = function (event) {
        const payload = eval("(" + event.data + ")");
        handleServerMessage(payload);
    };

    socket.onclose = function () {
        console.log("socket closed, reconnecting in 5s");
        setTimeout(() => connect(url), 5000);
    };

    return socket;
}

function handleServerMessage(payload) {
    console.log("received", payload.type);
}
