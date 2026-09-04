function append(el, userBio) {
  el.insertAdjacentHTML('beforeend', userBio);
  return el;
}
