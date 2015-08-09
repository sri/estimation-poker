Sprints = new Mongo.Collection("sprints");
Tickets = new Mongo.Collection("tickets");
Votes = new Mongo.Collection("votes");
Users = new Mongo.Collection("users");

if (Meteor.isClient) {

  if (localStorage["username"]) {
    Session.set("username", localStorage["username"]);
  }
  function currentSprintId() {
    return window.location.pathname.substring(1);
  }

  // function addCurrentUser() {
  //   console.log("addCurrentUser")
  //   var username = Session.get("username");
  //   if (!username) {
  //     return;
  //   }
  //   var selector = {username: username,
  //                   sprint: currentSprintId()};
  //   var user = Users.findOne(selector);
  //   console.log("selector", selector, "user", user);
  //   if (!user) {
  //     Users.insert(selector);
  //   }
  //   console.log("atEnd", Users.findOne(selector))
  // }

  if (window.location.pathname === "/") {
    var sprintId = Sprints.insert({active: true, createdAt: (new Date).valueOf()});
    var ticketId = Tickets.insert({current: true, createdAt: (new Date).valueOf(), name: "", sprint: sprintId});

    history.pushState(null, null, "/" + sprintId);
  }

  // Meteor.subscribe('users', function() {
  //   addCurrentUser();
  // });


  $(document).ready(function() {
    if ($("#username").is(":visible")) {
      $("#username").focus();
    } else if ($("#ticketname").is(":visible")) {
      $("#ticketname").focus();
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
      Users.insert({username: username, sprint: currentSprintId()});
      $(".page-header").hide();
      return false;
    }
  });

  Template.users.helpers({
    connectedUsers: function() {
      var username = Session.get("username");
      console.log("username", username);
      if (username) {
        var userSelector = {username: username, sprint: currentSprintId()};
        if (!Users.findOne(userSelector)) {
          console.log("inserting", userSelector);
          Users.insert(userSelector);
        }
      }
      return Users.find({sprint: currentSprintId()});
    },
    hasVote: function(username) {
      var ticketId = Template.parentData(1).id;
      return Votes.findOne({username: username, ticket: ticketId});
    }
  });

  Template.tickets.events({
    'blur input[name=ticketname]': function(event, template) {
      $(".open-ticket").find("form").submit();
    },
    'click .ticket-name': function(event, template) {
      $(".ticket-name").hide();
      $(".ticket-edit").show();
      $(".ticket-edit input").focus();
    },
    'click .clear-user': function(event, template) {
      localStorage.removeItem('username');
      Session.set("username", null);
    },
    'click .show-votes': function(event, template) {
      // TODO(sri): what if two click on show-votes
      // one right after another?
      var current = Tickets.findOne({current: true, sprint: currentSprintId()});
      if (!Votes.findOne({ticket: current._id})) {
        return false;
      }
      Tickets.update({_id: current._id}, {$set: {current: false}});
      Tickets.insert({current: true, createdAt: (new Date).valueOf(), name: "", sprint: currentSprintId()});
      var closedTicket = $( $(".closed-ticket").get(0) );
      closedTicket.find(".list-group-item").css("background-color", "gold");
      closedTicket.focus();
      closedTicket.find(".list-group-item").addClass("newly-minted");
      closedTicket.find(".list-group-item").css("background-color", "#fff");
      return false;
    },

    'submit form': function(event, template) {
      $(".ticket-edit").hide();
      $(".ticket-name").show();

      var name = $.trim(event.target.ticketname.value).toUpperCase();
      if (!name) {
        return false;
      }
      event.target.ticketname.value = "";

      var current = Tickets.findOne({current: true, sprint: currentSprintId()});
      if (current) {
        Tickets.update({_id: current._id}, {$set: {name: name}});
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
      var current = Tickets.findOne({current: true, sprint: currentSprintId()});
      if (!current) {
        alert("err");
        // current = Tickets.insert({current: true, createdAt: (new Date).valueOf()});
      }
      var currentVote = Votes.findOne({username: username, ticket: current._id});
      if (currentVote) {
        Votes.update({_id: currentVote._id}, {$set: {points: points}});
      } else {
        Votes.insert({username: username, ticket: current._id, points: points});
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

  Template.tickets.helpers({
    user: function() {
      return Session.get("username");
    },
    hasName: function(name) {
      if (!name) return false;
      return true;
    },
    openTicket: function() {
      return Tickets.findOne({current: true, sprint: currentSprintId()});
      // if (current) {
      //   return current;
      // }
      // Tickets.insert({current: true, createdAt: (new Date).valueOf(), name: ""});
      // return Tickets.findOne({current: true});
    },
    closedTickets: function() {
      return Tickets.find({current: false, sprint: currentSprintId()}, {sort: {createdAt: -1}});
    },
    consensus: function(ticketId) {
      var total = 0,
          count = 0;

      Votes.find({ticket: ticketId}).forEach(function(vote) {
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
    votes: function(ticketId) {
      return Votes.find({ticket: ticketId});
    },
    isClosed: function() {
      return Template.parentData(1).closed === "true";
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {

   // if (!Tickets.findOne({current: true})) {
   //    Tickets.insert({
   //      current: true,
   //      createdAt: (new Date).valueOf(),
   //      name: ""
   //    });
   //  }

    return Meteor.methods({
      // In console:
      // > Meteor.call("removeAll")
      removeAll: function() {
        Votes.remove({});
        Tickets.remove({});
        Sprints.remove({});
        Users.remove({});
      }
    });

  });
}
