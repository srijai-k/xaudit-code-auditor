function preview(frame, userHtml) {
  frame.srcdoc = userHtml;
  return frame;
}
