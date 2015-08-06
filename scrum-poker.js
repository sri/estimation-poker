Sprints = new Mongo.Collection("sprints");
Epics = new Mongo.Collection("epics");
Votes = new Mongo.Collection("votes");

if (Meteor.isClient) {

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
      $(".page-header").hide();
      return false;
    }
  });

  Template.epics.events({
    'click .show-votes': function(event, template) {
      var current = Epics.findOne({current: true});
      Epics.update({_id: current._id}, {$set: {current: false}});
      return false;
    },

    'click .create-epic': function(event, template) {
      var name = $.trim(prompt("Epic Name") || "").toUpperCase();
      if (!name) {
        return;
      }
      var current = Epics.findOne({current: true});
      if (current) {
        Epics.update({_id: current._id}, {$set: {current: false}});
      }
      Epics.insert({current: true, name: name, createdAt: (new Date).valueOf()});
    },

    'click .point': function(event, template) {
      var username = Session.get("username");
      if (!username) {
        alert("set user name");
        return;
      }
      var points = parseInt(event.target.innerHTML);
      var current = Epics.findOne({current: true});
      if (!current) {
        current = Epics.insert({current: true, createdAt: (new Date).valueOf()});
      }
      var currentVote = Votes.findOne({by: username, epic: current._id});
      if (currentVote) {
        Votes.update({_id: currentVote._id}, {$set: {points: points}});
      } else {
        console.log("done inserting")
        Votes.insert({by: username, epic: current._id, points: points});
      }
    }

  })

  Template.epics.helpers({
    openEpic: function() {
      return Epics.findOne({current: true});
    },

    closedEpics: function() {
      return Epics.find({current: false}, {sort: {createdAt: -1}});
    }
  })

  Template.votes.helpers({
    votes: function(epicId) {
      return Votes.find({epic: epicId});
    },
    isClosed: function() {
      return Template.parentData(1).closed === "true";
    },
    avg: function(epicId) {
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
  });

  Template.points.events({
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {

    return Meteor.methods({
      // In console:
      // > Meteor.call("removeAll")
      removeAll: function() {
        Votes.remove({});
        Epics.remove({});
      }
    })
    // if (!Epics.findOne({current: true})) {
    //   Epics.insert({
    //     current: true
    //   })
    // }
  });
}
