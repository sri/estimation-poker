currentSessionId = function() {
  return window.location.pathname.substring(1);
};

if (localStorage["username"]) {
  Session.set("username", localStorage["username"]);
}

if (window.location.pathname === "/") {
  var sessionId = Sessions.insert({active: true, createdAt: (new Date).valueOf()});
  var estimateId = Estimates.insert({current: true, createdAt: (new Date).valueOf(), name: "", session: sessionId});

  history.pushState(null, null, "/" + sessionId);
}

Meteor.startup(function () {

  Meteor.subscribe("users", function() {
    var username = Session.get("username");
    if (username) {
      var userSelector = {username: username, session: currentSessionId()};
      if (!Users.findOne(userSelector)) {
        var insertSelector = _.extend({}, userSelector, {joinedAt: (new Date).valueOf()});
        Users.insert(insertSelector);
      }
    }
  });

  if ($("#username").is(":visible")) {
    $("#username").focus();
  } else if ($("#estimatename").is(":visible")) {
    $("#estimatename").focus();
  }

  $("#share-btn").on("shown.bs.dropdown", function() {
    var shareLink = document.getElementById('share-link');
    shareLink.value = window.location;
    shareLink.focus();
    shareLink.select();
  });

});
