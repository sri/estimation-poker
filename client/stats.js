var countsFor = function(docId) {
  return function() {
    var count = Counts.findOne(docId);
    if (!count) {
      return 0;
    }
    return count.count;
  };
}

Template.stats.helpers({
  totalSessions: countsFor("sessions"),
  totalEstimates: countsFor("estimates"),
  totalVotes: countsFor("votes")
});
