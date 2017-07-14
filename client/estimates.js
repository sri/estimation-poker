Template.estimates.events({
  'click #invite-link-a': function(event, template) {
    return false;
  },
  'blur input[name=estimatename]': function(event, template) {
    $(".open-estimate").find("form").submit();
  },
  'click .estimate-name': function(event, template) {
    $(".estimate-name").hide();
    $(".estimate-edit").show();
    $(".estimate-edit input").focus();
  },
  'click .clear-user': function(event, template) {
    event.preventDefault();

    var userId = Session.get("userId");
    var userSession = UserSessions.findOne({
      sessionId: currentSessionId(),
      userId: userId});

    Meteor.call("setUserId", userId);
    UserSessions.remove(userSession._id);
    Users.remove(userId);

    setGlobals("userName", null);
    setGlobals("userId", null);
  },
  'click .show-points': function(event, template) {
    // TODO(sri): what if two click on show-points
    // one right after another?
    var current = Estimates.findOne({current: true,
                                     sessionId: currentSessionId()});
    if (!Points.findOne({estimateId: current._id})) {
      // No one has voted.
      return false;
    }
    Estimates.update({_id: current._id},
                     {$set: {show: true}});
    return false;
  },

  'click .clear-points': function(event, template) {
    var current = Estimates.findOne({current: true,
                                     sessionId: currentSessionId()});
    if (!Points.findOne({estimateId: current._id})) {
      // No one has voted.
      return false;
    }
    Points.find({estimateId: current._id}).forEach(function(point) {
      Points.remove(point._id);
    });
    return false;
  },

  'click .new-estimate, click .new-estimate2': function(event, template) {
    var current = Estimates.findOne({current: true,
                                     sessionId: currentSessionId()});
    if (!current) {
      return;
    }
    if (!Points.findOne({estimateId: current._id})) {
      return;
    }
    Estimates.update(
      {_id: current._id},
      {$set: {show: false,
              current: false}});

    Meteor.call("setUserId", Session.get("userId"));
    Estimates.insert({
      current: true,
      createdAt: currentTimestamp(),
      name: "",
      sessionId: currentSessionId()});
  },

  'submit form': function(event, template) {
    $(".estimate-edit").hide();
    $(".estimate-name").show();

    var name = $.trim(event.target.estimatename.value).toUpperCase();
    if (!name) {
      return false;
    }
    event.target.estimatename.value = "";

    if (!Session.get("userName")) {
      alert("Please set username");
      return;
    }

    var current = Estimates.findOne({
      current: true,
      sessionId: currentSessionId()});
    if (current) {
      Meteor.call("setUserId", Session.get("userId"));
      Estimates.update({_id: current._id}, {$set: {name: name}});
    }
    return false;
  },

  'click .point, click .point2, click .dd-point': function(event, template) {
    castVote(event.target.innerHTML);

    // dd-points are points in the dropdown.
    // If they return false, then the don't close
    // after they are clicked.
    if ($(event.target).hasClass("dd-point")) {
      event.preventDefault();
    } else {
      return false;
    }
  }
});

Template.estimates.helpers({
  userName: function() {
    return Session.get("userName");
  },
  hasName: function(name) {
    if (!name) return false;
    return true;
  },
  openEstimate: function() {
    return Estimates.findOne({
      current: true,
      sessionId: currentSessionId()});
  },
  closedEstimates: function() {
    return Estimates.find({
      current: false,
      sessionId: currentSessionId()},
      {sort: {createdAt: -1}});
  }
});
