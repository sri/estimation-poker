Sprints = new Mongo.Collection("sprints");
Estimates = new Mongo.Collection("estimates");
Votes = new Mongo.Collection("votes");
Users = new Mongo.Collection("users");

if (Meteor.isClient) {
  Meteor.startup(function () {

    Meteor.subscribe("users", function() {
      var username = Session.get("username");
      if (username) {
        var userSelector = {username: username, sprint: currentSprintId()};
        if (!Users.findOne(userSelector)) {
          var insertSelector = _.extend({}, userSelector, {joinedAt: (new Date).valueOf()});
          Users.insert(insertSelector);
        }
      }
    });
  });

  if (localStorage["username"]) {
    Session.set("username", localStorage["username"]);
  }
  function currentSprintId() {
    return window.location.pathname.substring(1);
  }

  if (window.location.pathname === "/") {
    var sprintId = Sprints.insert({active: true, createdAt: (new Date).valueOf()});
    var estimateId = Estimates.insert({current: true, createdAt: (new Date).valueOf(), name: "", sprint: sprintId});

    history.pushState(null, null, "/" + sprintId);
  }

  $(document).ready(function() {
    if ($("#username").is(":visible")) {
      $("#username").focus();
    } else if ($("#estimatename").is(":visible")) {
      $("#estimatename").focus();
    }
  });

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
      Users.insert({username: username, sprint: currentSprintId(), joinedAt: (new Date).valueOf()});
      $(".page-header").hide();
      return false;
    }
  });

  Template.users.helpers({
    connectedUsers: function() {
      var asc = 1; // smallest to larges
      return Users.find({sprint: currentSprintId()}, {sort: {createdAt: asc}});
    },
    hasVote: function(username) {
      var estimateId = Template.parentData(1).id;
      return Votes.findOne({username: username, estimate: estimateId});
    }
  });

  Template.estimates.events({
    'blur input[name=estimatename]': function(event, template) {
      $(".open-estimate").find("form").submit();
    },
    'click .estimate-name': function(event, template) {
      $(".estimate-name").hide();
      $(".estimate-edit").show();
      $(".estimate-edit input").focus();
    },
    'click .clear-user': function(event, template) {
      localStorage.removeItem('username');
      Session.set("username", null);
    },
    'click .show-votes': function(event, template) {
      // TODO(sri): what if two click on show-votes
      // one right after another?
      var current = Estimates.findOne({current: true, sprint: currentSprintId()});
      if (!Votes.findOne({estimate: current._id})) {
        return false;
      }
      Estimates.update({_id: current._id}, {$set: {current: false}});
      Estimates.insert({current: true, createdAt: (new Date).valueOf(), name: "", sprint: currentSprintId()});
      var closedEstimate = $( $(".closed-estimate").get(0) );
      closedEstimate.find(".list-group-item").css("background-color", "gold");
      closedEstimate.focus();
      closedEstimate.find(".list-group-item").addClass("newly-minted");
      closedEstimate.find(".list-group-item").css("background-color", "#fff");
      return false;
    },

    'submit form': function(event, template) {
      $(".estimate-edit").hide();
      $(".estimate-name").show();

      var name = $.trim(event.target.estimatename.value).toUpperCase();
      if (!name) {
        return false;
      }
      event.target.estimatename.value = "";

      var current = Estimates.findOne({current: true, sprint: currentSprintId()});
      if (current) {
        Estimates.update({_id: current._id}, {$set: {name: name}});
      }
      return false;
    },

    'click .point, click .point2, click .dd-point': function(event, template) {
      var username = Session.get("username");
      if (!username) {
        alert("set user name");
        return;
      }
      var points = event.target.innerHTML;
      var current = Estimates.findOne({current: true, sprint: currentSprintId()});
      if (!current) {
        alert("err");
        // current = Estimates.insert({current: true, createdAt: (new Date).valueOf()});
      }
      var currentVote = Votes.findOne({username: username, estimate: current._id});
      if (currentVote) {
        Votes.update({_id: currentVote._id}, {$set: {points: points}});
      } else {
        Votes.insert({username: username, estimate: current._id, points: points});
      }
      // dd-points are points in the dropdown.
      // If they return false, then
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
      return Estimates.findOne({current: true, sprint: currentSprintId()});
      // if (current) {
      //   return current;
      // }
      // Estimates.insert({current: true, createdAt: (new Date).valueOf(), name: ""});
      // return Estimates.findOne({current: true});
    },
    closedEstimates: function() {
      return Estimates.find({current: false, sprint: currentSprintId()}, {sort: {createdAt: -1}});
    },
    consensus: function(estimateId) {
      var total = 0,
          count = 0;

      Votes.find({estimate: estimateId}).forEach(function(vote) {
        total += vote.points;
        count += 1;
      });
      if (count === 0) {
        return 0;
      }
      return Math.ceil(total / count);
    }

  })

  Template.votes.helpers({
    votes: function(estimateId) {
      return Votes.find({estimate: estimateId});
    },
    isClosed: function() {
      return Template.parentData(1).closed === "true";
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {

    Meteor.publish("users", function() {
      return Users.find({});
    });

    return Meteor.methods({
      // In console:
      // > Meteor.call("removeAll")
      removeAll: function() {
        Votes.remove({});
        Estimates.remove({});
        Sprints.remove({});
        Users.remove({});
      }
    });

  });
}
