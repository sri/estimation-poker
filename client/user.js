Template.user.helpers({
  user: function() {
    return Session.get("username");
  }
});

Template.user.events({
  'submit form': function(event, template) {
    event.preventDefault();
    var username = $.trim(event.target.username.value);
    if (!username) {
      return false;
    }
    Session.set("username", username);
    localStorage["username"] = username;
    Users.insert({username: username, session: currentSessionId(), joinedAt: (new Date).valueOf()});
    $(".page-header").hide();
    return false;
  }
});
