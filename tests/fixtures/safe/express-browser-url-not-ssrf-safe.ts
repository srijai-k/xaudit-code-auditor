const src = new URLSearchParams(location.search).get("src");
axios.get(src).then((r) => render(r.data));
