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
    var user = Users.findOne({session: currentSessionId(), username: Session.get('username')});
    Users.remove(user._id);
    localStorage.removeItem('username');
    Session.set("username", null);
  },
  'click .show-points': function(event, template) {
    // TODO(sri): what if two click on show-points
    // one right after another?
    var current = Estimates.findOne({current: true, session: currentSessionId()});
    if (!Points.findOne({estimate: current._id})) {
      return false;
    }
    Estimates.update({_id: current._id}, {$set: {show: true}});
    return false;
  },

  'click .new-session, click .new-session2': function(event, template) {
    var current = Estimates.findOne({current: true, session: currentSessionId()});
    if (!Points.findOne({estimate: current._id})) {
      return false;
    }
    Estimates.update({_id: current._id}, {$set: {show: false, current: false}});
    Estimates.insert({current: true, createdAt: (new Date).valueOf(), name: "", session: currentSessionId()});
    return false;
  },

  'submit form': function(event, template) {
    if (!Session.get("username")) {
      alert("Please set username");
      return false;
    }

    $(".estimate-edit").hide();
    $(".estimate-name").show();

    var name = $.trim(event.target.estimatename.value).toUpperCase();
    if (!name) {
      return false;
    }
    event.target.estimatename.value = "";

    var current = Estimates.findOne({current: true, session: currentSessionId()});
    if (current) {
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
  user: function() {
    return Session.get("username");
  },
  hasName: function(name) {
    if (!name) return false;
    return true;
  },
  openEstimate: function() {
    return Estimates.findOne({current: true, session: currentSessionId()});
  },
  closedEstimates: function() {
    return Estimates.find({current: false, session: currentSessionId()}, {sort: {createdAt: -1}});
  }
});
