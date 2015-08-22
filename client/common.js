castVote = function(points) {
  var username = Session.get("username");
  if (!username) {
    alert("set user name");
    return;
  }

  var current = Estimates.findOne({current: true, session: currentSessionId()});
  if (!current) {
      alert("err");
      return false;
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
};
