function schedule(cb) {
  setTimeout(() => { cb(); }, 1000);
}
schedule(() => console.log('tick'));
