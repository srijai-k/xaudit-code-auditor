function show(user) {
  const box = document.querySelector('.box');
  box.innerHTML = `<span>${user.bio}</span>`;
  return box;
}
