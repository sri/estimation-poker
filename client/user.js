Template.user.helpers({
  hasUserName: function() {
    return Session.get("userName");
  }
});

Template.user.events({
  'submit form': function(event, template) {
    event.preventDefault();

    var userName = $.trim(event.target.username.value);
    if (!userName) {
      return false;
    }

    var userId = Users.insert({
      userName: userName,
      sessionId: currentSessionId(),
      joinedAt: currentTimestamp()});
    if (!userId) {
      alert("Error creating user -- try again.")
      return;
    }

    setGlobals("userName", userName);
    setGlobals("userId", userId);

    Meteor.call("setUserId", userId);
    var userSession = UserSessions.insert({
      userName: userName,
      userId: userId,
      sessionId: currentSessionId()
    });
    if (!userSession) {
      alert("Unable to join session -- reload page to try again");
      return;
    }

    $(".page-header").hide();
    return false;
  }
});
