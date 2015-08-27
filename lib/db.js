Sessions     = new Mongo.Collection("sessions");
Estimates    = new Mongo.Collection("estimates");
Points       = new Mongo.Collection("points");
Users        = new Mongo.Collection("users");
UserSessions = new Mongo.Collection("usersessions");

if (Meteor.isClient) {
  Counts = new Mongo.Collection("counts");
}
