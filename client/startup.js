if (localStorage["userName"] && localStorage["userId"]) {
  Session.set("userName", localStorage["userName"]);
  Session.set("userId", localStorage["userId"]);
} else {
  setGlobals("userName", null);
  setGlobals("userId", null);
}

if (window.location.pathname === "/") {
  // If they land on the domain without a session,
  // create a new one for them. Also, create a current
  // Estimate for it.
  var sessionId = Sessions.insert({createdAt: currentTimestamp()});
  var estimateId = Estimates.insert({current: true,
                                     createdAt: currentTimestamp(),
                                     name: "",
                                     sessionId: sessionId});

  // TODO(sri): doesn't seem to work with Safari on iOS.
  history.pushState(null, null, "/" + sessionId);
}

Meteor.startup(function () {

  Meteor.subscribe("usersessions", function() {
    var userId = Session.get("userId");
    var userName = Session.get("userName");

    // If the user already has a name & id
    // automatically create a user session for
    // them.
    if (userId && userName) {
      var sel = {
        userId: userId,
        sessionId: currentSessionId()};
      if (!UserSessions.findOne(sel)) {
        UserSessions.insert(_.extend({}, sel, {userName: userName}));
      }
    }
  });

  if ($("#username").is(":visible")) {
    $("#username").focus();
  } else if ($("#estimatename").is(":visible")) {
    $("#estimatename").focus();
  }

  // Key bindings:
  // TODO(sri): Add for Show Points and Another Estimate.
  var keys = {
    49: "1",               // Ctrl-1
    50: "2",               // Ctrl-2
    51: "3",               // Ctrl-3
    53: "5",               // Ctrl-5
    56: "8",               // Ctrl-8
    20: "13",              // Ctrl-t
    9:  "∞",               // Ctrl-i
    2:  "Back to Product", // Ctrl-b
  };

  $(document).keypress(function(event) {
    if (event.ctrlKey) {
      var points = keys[event.which];
      if (points) {
        castVote(points);
      }
    }
  });

  // When Invite button is clicked, focus & select the URL
  // to share, so that they can easily cut/copy it.
  $("#invite-btn").on("shown.bs.dropdown", function() {
    var inviteLink = document.getElementById('invite-link');
    inviteLink.value = window.location;
    inviteLink.focus();
    inviteLink.select();
  });

  $(".about-close").click(function(event) {
    event.preventDefault();
    $("#about").hide();
    return false;
  });

  $(".about-btn").click(function(event) {
    event.preventDefault();
    $("#about").show();
    window.scroll(0, 0);
    return false;
  });

});
