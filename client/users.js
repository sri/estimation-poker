Template.users.helpers({
  connectedUsers: function() {
    var asc = 1;
    return UserSessions.find(
      {sessionId: currentSessionId()},
      {sort: {userName: asc}});
  },
  hasPoint: function(userId) {
    var estimateId = Template.parentData(1).id;
    return Points.findOne({
      userId: userId,
      estimateId: estimateId});
  },
  userPoints: function(userId) {
    var estimateId = Template.parentData(1).id;
    var point = Points.findOne({
      userId: userId,
      estimateId: estimateId});
    if (!point) {
      return null;
    }
    return point.points;
  },
  showPoint: function() {
    var estimateId = Template.parentData(1).id;
    return Estimates.findOne({_id: estimateId}).show;
  }
});
