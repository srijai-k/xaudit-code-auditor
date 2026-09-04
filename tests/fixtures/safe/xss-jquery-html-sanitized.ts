import DOMPurify from 'dompurify';
function render(userBio) {
  $('#profile-bio').html(DOMPurify.sanitize(userBio));
}
