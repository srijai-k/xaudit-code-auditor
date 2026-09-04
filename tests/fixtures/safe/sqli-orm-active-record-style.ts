function search(term) {
  return searchIndex.query({ text: term });
}
