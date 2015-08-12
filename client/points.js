Template.points.helpers({
  pointsForEstimate: function(estimateId) {
    var asc = 1;
    return Points.find({estimate: estimateId}, {sort: {username: asc}});
  }
});
