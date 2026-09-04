function ProfileWidget() {
  this.$container = $('#profile-widget');
}
ProfileWidget.prototype.renderBio = function (bio) {
  this.$container.find('.bio').html(bio);
};
