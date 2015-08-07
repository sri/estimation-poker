Sprints = new Mongo.Collection("sprints");
Epics = new Mongo.Collection("epics");
Votes = new Mongo.Collection("votes");

if (Meteor.isClient) {

  if (localStorage["username"]) {
    Session.set("username", localStorage["username"]);
  }

  $(document).ready(function() {
    if ($("#username").is(":visible")) {
      $("#username").focus();
    } else if ($("#epicname").is(":visible")) {
      $("#epicname").focus();
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
        return;
      }
      Session.set("username", username);
      localStorage["username"] = username;
      $(".page-header").hide();
      return false;
    }
  });

  Template.epics.events({
    'click .show-votes': function(event, template) {
      // TODO(sri): what if two click on show-votes
      // one right after another?
      var current = Epics.findOne({current: true});
      if (!Votes.findOne({epic: current._id})) {
        return false;
      }
      Epics.update({_id: current._id}, {$set: {current: false}});
      Epics.insert({current: true, createdAt: (new Date).valueOf(), name: ""});
      var closedEpic = $($(".closed-epic").get(0));
      closedEpic.addClass("newly-minted newly-minted-div");
      closedEpic.focus();
      closedEpic.removeClass("newly-minted-div");
      $("#epicname").focus();
      return false;
    },

    'submit form': function(event, template) {
      var name = $.trim(event.target.epicname.value).toUpperCase();
      if (!name) {
        return false;
      }
      var current = Epics.findOne({current: true});
      if (current) {
        Epics.update({_id: current._id}, {$set: {name: name}});
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
      var current = Epics.findOne({current: true});
      if (!current) {
        alert("err");
        // current = Epics.insert({current: true, createdAt: (new Date).valueOf()});
      }
      var currentVote = Votes.findOne({by: username, epic: current._id});
      if (currentVote) {
        Votes.update({_id: currentVote._id}, {$set: {points: points}});
      } else {
        Votes.insert({by: username, epic: current._id, points: points});
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

  Template.epics.helpers({
    user: function() {
      return Session.get("username");
    },
    hasName: function(name) {
      if (!name) return false;
      return true;
    },
    openEpic: function() {
      return Epics.findOne({current: true});
      // if (current) {
      //   return current;
      // }
      // Epics.insert({current: true, createdAt: (new Date).valueOf(), name: ""});
      // return Epics.findOne({current: true});
    },
    closedEpics: function() {
      return Epics.find({current: false}, {sort: {createdAt: -1}});
    },
    consensus: function(epicId) {
      var total = 0,
          count = 0;

      Votes.find({epic: epicId}).forEach(function(vote) {
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
    votes: function(epicId) {
      return Votes.find({epic: epicId});
    },
    isClosed: function() {
      return Template.parentData(1).closed === "true";
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {

   if (!Epics.findOne({current: true})) {
      Epics.insert({
        current: true,
        createdAt: (new Date).valueOf(),
        name: ""
      });
    }

    return Meteor.methods({
      // In console:
      // > Meteor.call("removeAll")
      removeAll: function() {
        Votes.remove({});
        Epics.remove({});
        Epics.insert({current: true, createdAt: (new Date).valueOf(), name: ""});
      }
    });

  });
}
