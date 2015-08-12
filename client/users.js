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
