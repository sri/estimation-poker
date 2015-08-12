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
