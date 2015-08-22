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

  var keys = {
    49: "1",              // Ctrl-1
    50: "2",              // Ctrl-2
    51: "3",              // Ctrl-3
    53: "5",              // Ctrl-5
    56: "8",              // Ctrl-8
    20: "13",             // Ctrl-t
    9: "∞",               // Ctrl-i
    2: "Back to Product", // Ctrl-b
  };

  $(document).keypress(function(event) {
    if (event.ctrlKey) {
      var points = keys[event.which];
      if (points) {
        castVote(points);
      }
    }
  });

  $("#invite-btn").on("shown.bs.dropdown", function() {
    var inviteLink = document.getElementById('invite-link');
    inviteLink.value = window.location;
    inviteLink.focus();
    inviteLink.select();
  });

  $("#about-btn").click(function(event) {
    event.preventDefault();
    $("#about").toggle();
  });

});
