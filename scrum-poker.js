Sessions = new Mongo.Collection("sessions");
Estimates = new Mongo.Collection("estimates");
Points = new Mongo.Collection("points");
Users = new Mongo.Collection("users");

if (Meteor.isClient) {
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
  });

  if (localStorage["username"]) {
    Session.set("username", localStorage["username"]);
  }
  function currentSessionId() {
    return window.location.pathname.substring(1);
  }

  if (window.location.pathname === "/") {
    var sessionId = Sessions.insert({active: true, createdAt: (new Date).valueOf()});
    var estimateId = Estimates.insert({current: true, createdAt: (new Date).valueOf(), name: "", session: sessionId});

    history.pushState(null, null, "/" + sessionId);
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
      username = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
      Session.set("username", username);
      localStorage["username"] = username;
      Users.insert({username: username, session: currentSessionId(), joinedAt: (new Date).valueOf()});
      $(".page-header").hide();
      return false;
    }
  });

  Template.users.helpers({
    connectedUsers: function() {
      var asc = 1;
      return Users.find({session: currentSessionId()}, {sort: {username: asc}});
    },
    hasPoint: function(username) {
      var estimateId = Template.parentData(1).id;
      return Points.findOne({username: username, estimate: estimateId});
    },
    userPoints: function(username) {
      var estimateId = Template.parentData(1).id;
      return Points.findOne({username: username, estimate: estimateId}).points;
    },
    showPoint: function() {
      var estimateId = Template.parentData(1).id;
      return Estimates.findOne({_id: estimateId}).show;
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
      var username = Session.get("username");
      if (!username) {
        alert("set user name");
        return;
      }
      var points = event.target.innerHTML;
      var current = Estimates.findOne({current: true, session: currentSessionId()});
      if (!current) {
        alert("err");
        // current = Estimates.insert({current: true, createdAt: (new Date).valueOf()});
      }
      var currentPoint = Points.findOne({username: username, estimate: current._id});
      if (currentPoint) {
        Points.update({_id: currentPoint._id}, {$set: {points: points}});
      } else {
        Points.insert({username: username, estimate: current._id, points: points});
      }

      var nPoints = Points.find({estimate: current._id}).count();
      var nUsers = Users.find({session: currentSessionId()}).count();

      if (nPoints === nUsers) {
        Estimates.update({_id: current._id}, {$set: {show: true}});
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
      return Estimates.findOne({current: true, session: currentSessionId()});
      // if (current) {
      //   return current;
      // }
      // Estimates.insert({current: true, createdAt: (new Date).valueOf(), name: ""});
      // return Estimates.findOne({current: true});
    },
    closedEstimates: function() {
      return Estimates.find({current: false, session: currentSessionId()}, {sort: {createdAt: -1}});
    },
    consensus: function(estimateId) {
      var total = 0,
          count = 0;

      Points.find({estimate: estimateId}).forEach(function(point) {
        total += point.points;
        count += 1;
      });
      if (count === 0) {
        return 0;
      }
      return Math.ceil(total / count);
    }

  })

  Template.points.helpers({
    pointsForEstimate: function(estimateId) {
      var asc = 1;
      return Points.find({estimate: estimateId}, {sort: {username: asc}});
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
        Points.remove({});
        Estimates.remove({});
        Sessions.remove({});
        Users.remove({});
      }
    });

  });
}
