function poll(expr) {
  setInterval(`checkStatus(${expr})`, 5000);
}
