var requested_columns = [
        "IndividualToCandLimit_H_Max"
          , "IndividualToCandLimit_S_Max"
          , "IndividualToCandLimit_G_Max"
          , "PACToCandLimit_H_Max"
          , "PACToCandLimit_S_Max"
          , "PACToCandLimit_G_Max"
          , "CorpToCandLimit_H_Max"
          , "CorpToCandLimit_S_Max"
          , "CorpToCandLimit_G_Max"
          , "LaborToCandLimit_H_Max"
          , "LaborToCandLimit_S_Max"
          , "LaborToCandLimit_G_Max"
          , "IndividualToPartyLimit_Max"
          , "CorpToPartyLimit_Max"
          , "LaborToPartyLimit_Max"
          , "IndividualToPACLimit_Max"
          , "CorpToPACLimit_Max"
          , "LaborToPACLimit_Max"
      ]
  , data_files = ["Laws_02_Contributions_1", "Laws_02_Contributions_2"]
  , query = { donor: false, recipient: false, branch: false }
;
var grid = Grid();

// Load the data and kick-off the visualization.
d3.queue()
    .defer(d3.csv, "../data/CSVs/Laws_02_Contributions_1.csv")
    .defer(d3.csv, "../data/CSVs/Laws_02_Contributions_2.csv")
    .await(corpus)
;
// Responsive
d3.select(window).on("resize", function() { grid.resize()(); });

/*
** Helper Functions
*/
function corpus(error, contribs, contribs2) {
    if(error) throw error;
    var data = d3.nest()
            .key(function(d) { return d.Identifier; })
            .rollup(function(leaves) {
                // Combine the two datasets
                d3.keys(leaves[1]).forEach(function(l) {
                    leaves[0][l] = leaves[1][l];
                })
                return leaves[0];
              })
            .map(d3.merge([contribs, contribs2]))
            .values()
      , columns = d3.keys(data[0])
            .filter(function(c) { return c.endsWith("_Max"); })
            .filter(function(c) { return ~requested_columns.indexOf(c); })
            .map(function(c) {
                var ret = c
                        .split("Limit_Max")[0]
                        .split("_Max")[0]
                        .split("To")
                  , receiver = ret[1].split("Limit_")
                ;
                return [ret[0], receiver[0], receiver[1]];
              })
    ;
    d3.select("form").selectAll(".chooser")
        .data(d3.keys(query), identity)
      .enter().append("select")
        .attr("class", "chooser")
        .attr("id", function(d) { return "chooser-" + d; })
        .on("change", function() {
            query[this.id.split("chooser-")[1]] = this.value;
            grid
                .selectedColumn(querify())
              () // call grid()
            ;
            d3.select("#query-string")
                .text(grid.selectedColumn())
            ;
          })
        .each(function(d, i) {
            var opts = columns
                  .map(function(c) { return c[i]; })
                  .filter(identity)
            ;
            d3.select(this)
              .append("optgroup")
                .attr("label", "Select a " + d)
              .selectAll("option")
                .data(d3.set(opts).values(), identity)
              .enter().append("option")
                .attr("value", identity)
                .text(identity)
            ;
        })
    ;
    d3.selectAll("form select")
        .each(function() {
            var key = this.id.split("-")[1];
            query[key] = this.value;
          })
    ;
    grid
        .data(data)
        .selectedColumn(querify())
      () // Call grid()
    ;
    d3.select("#query-string")
        .text(grid.selectedColumn())
    ;
    // Responsive
    d3.select(window).on("resize", function() { grid.resize()(); });

    // Local Helper Functions
    function querify() {
        var col = query.donor + "To" + query.recipient + "Limit"
          , branch = !d3.map(data[0]).has([col + "_Max"])
        ;
        d3.select("#chooser-branch")
            .attr("disabled", !branch || null)
            .property("value", !branch ? "" : query.branch)
        ;
        return col + (branch ? "_" + query.branch : "") + "_Max";
    } // querify()
} // corpus()

// Helper Utility Function
function identity(d) { return d; }
