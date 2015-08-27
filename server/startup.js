Meteor.startup(function () {

  Meteor.publish("usersessions", function(sessionId) {
    check(sessionId, String);
    return UserSessions.find({sessionId: sessionId});
  });

  Meteor.publish("estimates", function(sessionId) {
    check(sessionId, String);
    return Estimates.find({sessionId: sessionId});
  });

  Meteor.publish("points", function(sessionId) {
    check(sessionId, String);
    return Points.find({sessionId: sessionId});
  });

  var publishCounts = function(params) {
    Meteor.publish(params.pubName, function() {
      var self = this;
      var init = true;
      var count = 0;

      var handle = params.collection.find().observeChanges({
        added: function(id) {
          count++;
          if (!init) {
            self.changed("counts", params.docId, {count: count});
          }
        }
      });

      init = false;
      self.added("counts", params.docId, {count: count});
      self.ready();

      self.onStop(function() {
        handle.stop();
      });

    });
  };

  publishCounts({
    pubName: "total-sessions",
    collection: Sessions,
    docId: "sessions"
  });

  publishCounts({
    pubName: "total-estimates",
    collection: Estimates,
    docId: "estimates"
  });

  publishCounts({
    pubName: "total-votes",
    collection: Points,
    docId: "votes"
  });

  Meteor.methods({
    setUserId: function(userId) {
      this.setUserId(userId);
    }
  });

  ///////////////////////////////////////////////////////////////////
  // DB access restrictions:
  //

  // Anyone can create an estimation session,
  // but cannot update or remove existing ones.
  Sessions.allow({
    insert: function() {
      return true;
    }
  });

  // Only users that are part of the estimation
  // session can create estimates or update it
  // (and only the 'current' and 'name' attributes).
  // Estimates can't be removed.
  Estimates.allow({
    insert: function(userId, estimate, fields) {
      if (!estimate.current) {
        return false;
      }
      var totalEstimates = Estimates.find({
        sessionId: estimate.sessionId
      }).count();
      if (totalEstimates === 0 &&
          estimate.name === "") {
        // Special case -- allow anyone (in our case client/startup.js)
        // to insert the 1st estimate.
        return true;
      }
      var totalOpenEstimates = Estimates.find({
        sessionId: estimate.sessionId,
        current: true
      }).count();
      if (totalOpenEstimates > 0) {
        return false;
      }
      if (!userId) {
        return false;
      }
      var user = UserSessions.findOne({
        userId: userId,
        sessionId: estimate.sessionId});
      if (!user) {
        return false;
      }
      return true;
    },
    update: function(userId, estimate, fields, modifier) {
      if (!userId) {
        return false;
      }
      if (!estimate.current) {
        return false;
      }
      if (_.contains(fields, "sessionId") ||
          _.contains(fields, "createdAt")) {
        return false;
      }
      var user = UserSessions.findOne({
        userId: userId,
        sessionId: estimate.sessionId});
      if (!user) {
        return false;
      }
      return true;
    }
  });

  Points.allow({
    insert: function(userId, point) {
      return point.userId === userId;
    },
    update: function(userId, point, fields, modifier) {
      return (point.userId === userId &&
              fields.length === 1 &&
              fields[0] === "points");
    }
  });

  Users.allow({
    insert: function() {
      return true;
    },
    update: function(userId, user, fields) {
      return (userId === user._id &&
              fields.length === 1 &&
              // TODO(sri): userName?
              fields[0] === "username");
    },
    remove: function(userId, user) {
      return userId === user._id;
    }
  });

  UserSessions.allow({
    insert: function(userId, userSession) {
      return !UserSessions.findOne({userId: userId,
                                    sessionId: userSession.sessionId});
    },
    remove: function(userId, user) {
      return userId === user.userId;
    }
  });
});
