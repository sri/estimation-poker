currentSessionId = function() {
  return window.location.pathname.substring(1);
};

currentTimestamp = function() {
  return (new Date).valueOf();
};

setGlobals = function(key, val) {
  Session.set(key, val);
  if (val) {
    localStorage[key] = val;
  } else {
    localStorage.removeItem(key);
  }
};

castVote = function(points) {
  var userName = Session.get("userName");
  var userId = Session.get("userId");

  if (!userName || !userId) {
    alert("set user name");
    return;
  }

  var current = Estimates.findOne({
    current: true,
    sessionId: currentSessionId()});
  if (!current) {
      alert("Cannot find an estimate to vote on.");
      return false;
  }

  var currentPoint = Points.findOne({
    userId: userId,
    estimateId: current._id});
  if (currentPoint) {
    Points.update({_id: currentPoint._id}, {$set: {points: points}});
  } else {
    Meteor.call("setUserId", userId);
    Points.insert({
      userName: userName,
      userId: userId,
      estimateId: current._id,
      points: points});
  }

  var nPoints = Points.find({estimate: current._id}).count();
  var nUsers = Users.find({session: currentSessionId()}).count();

  if (nPoints === nUsers) {
    Estimates.update({_id: current._id}, {$set: {show: true}});
  }
};
