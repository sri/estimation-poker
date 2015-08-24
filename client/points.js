Template.points.helpers({
  pointsForEstimate: function(estimateId) {
    var asc = 1;
    return Points.find(
        {estimateId: estimateId},
        {sort: {username: asc}});
  }
});
