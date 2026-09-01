const sink = document.getElementById('x');
function setter(v) { sink.outerHTML = v; }
setter(location.hash.slice(1));
