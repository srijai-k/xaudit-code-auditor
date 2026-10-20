const name = new URLSearchParams(location.search).get("name");
greeting.innerHTML = "Hi " + name;
