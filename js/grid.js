function Grid(){

  // Configuration parameters.
  var margin = { left: 40, right: 40, top: 35, bottom: 5 }
    , side = 16 // length of each square cell
    , width, height // of the viz
    , xColumn = "State"
    , yColumn = "Year"
    , moneyFormat = function (n){ return "$" + d3.format(",")(n); }
    , colorScale
    , tooltipContent
  ;

  // DOM Elements.
  var svg
    , xAxisG
    , yAxisG
    , yAxis2G
    , buttonG
    , tooltip
  ;

  // D3 Objects.
  var xScale = d3.scaleBand().padding(0).align(0)
    , yScale = d3.scaleBand().padding(0).align(0)
    , axisX = d3.axisTop()
    , axisY = d3.axisLeft()
    , axisY2 = d3.axisRight()
  ;
  // Internal state variables.
  var selectedColumn
    , selectedColumnLabel
    , valueAccessor // The accessor function(d) for the value to visualize.
    , format // The formatter function, works from the output of valueAccessor(d).
    , data
    , sortYear
    , scorecard
    , empty = false
    , reset = true
    , dispatch
  ;

  // Main Function Object
  function my() {
      if(!data || !colorScale) return;

      // Adjust to the size of the HTML container
      size_up();

      // Sort, if a year has been selected
      if(sortYear) resort();

      // Set up the domains
      domainify();

      // Render DOM elements
      render_cells();
      render_axes();
      render_button();

      // Set up data download buttons.
      connect_download_buttons();

      // Further changes will cause a reset
      reset = true;
  } // Main Function Object


  // Internal Helper Functions
  function size_up() {
      width = xScale.domain().length * side;
      height = yScale.domain().length * side;

      xScale.rangeRound([0, width]);
      yScale.rangeRound([0, height]);

      svg.attr(
          "viewBox"
        , "0 0 "
            + (width + margin.left + margin.right)
            + " "
            + (height + margin.top + margin.bottom)
      );
  } // size_up()


  // Visualize the selectedColumn.
  function render_cells() {
    if(!colorScale) return;
    var rects = svg.select(".viz").selectAll("rect")
          .data(data, function (d){ return d.Identifier; })
      , w = xScale.step()
      , h = yScale.step()
      , msg = []
    ;
    rects
      .enter()
        .append("rect")
        .attr("x", function (d){ return xScale(d[xColumn]); })
        .attr("y", function (d){ return yScale(d[yColumn]); })
        .attr("width", 0)
        .attr("height", 0)
      .merge(rects)
        .attr("class", "grid-rect")
        .on("mouseover", function(d) {
            tooltip
                .html(tooltipContent(d))
                .show()
            ;
          })
        .on("mouseout", tooltip.hide)
      .transition().duration(500)
        .attr("x", function (d){ return xScale(d[xColumn]); })
        .attr("y", function (d){ return yScale(d[yColumn]); })
        .attr("width", w)
        .attr("height", h)
        .style("color", function (d){
            var value = valueAccessor(d);

            // Construct the message passed into the choropleth.
            if(d.Year === sortYear) {
                msg.push({
                    d: d
                  , state: d[xColumn]
                  , year: d[yColumn]
                  , color: colorScale(value)
                  , column: selectedColumn
                  , limit: d[selectedColumn]
                });
            }

            return colorScale(value);
          })
    ;
    dispatch.call("update", this, msg);
  } // render_cells()

  function render_axes() {
      var t = d3.transition().duration(500);
      xAxisG
        .transition(t)
          .call(axisX.scale(xScale))
      ;
      xAxisG.selectAll(".tick line")
          .attr("transform", "translate(" + (xScale.step() / 2) + ",0)")
      ;
      xAxisG.selectAll(".tick text")
          .attr("dy", "-1em")
      ;
      yAxisG
        .transition(t)
          .call(axisY.scale(yScale))
      ;
      yAxis2G
          .attr("transform", "translate(" + width + ",0)")
        .transition(t)
          .call(axisY2.scale(yScale))
      ;
      svg.selectAll(".y.axis .tick line")
          .attr("transform", "translate(0," + (yScale.step() / 2) + ")")
      ;
      svg.selectAll(".y.axis .tick text")
          // Sort dataset when y-axis labels are clicked
          .on("click", function (d){
              dispatch.call("selectYear", null, d);
            }
          );
      ;
      if(reset)
          // Set the ticks to normal font-weight
          svg.selectAll(".y.axis .tick text")
              .classed("sortby", false)
          ;
  } // render_axes()


  function render_button() {
      buttonG
          .attr("transform", "translate(" + width + ",0)")
        .selectAll("foreignObject")
          .data([1])
        .enter().append("foreignObject")
          .attr("width", side)
          .attr("height", side)
          .each(function(d) {
              d3.select(this)
                .append("button")
                .append("i")
                  .attr("class", "fa fa-sort-alpha-asc")
                  .text("Blah")
              ;
            })
      ;
  } // render_button()

  function domainify() {
      if(reset) {
          xScale.domain(
            data
                .map(function (d){ return d[xColumn]; })
                .sort(d3.ascending)
          );
          yScale.domain(
            data
                .map(function (d){ return d[yColumn]; })
                .sort(d3.descending)
          );
      }
  } // domainify()

  function score() {
      scorecard = d3.nest()
          .key(function(d) { return d[xColumn]; })
          // .key(function(d) { return d[yColumn]; })
          // .rollup(function(leaves) { return leaves[0]; })
          .object(data);
      ;
  } // score();

  function resort() {
      if(!colorScale) return;
      var sorted = data
          .filter(function(d) { return d[yColumn] === sortYear; })
          .sort(function(m, n) {
              return d3.ascending(valueAccessor(m), valueAccessor(n));
            })
          .map(function(d) { return d[xColumn]; })
      ;
      xAxisG
        .transition(d3.transition().duration(500))
          .call(d3.axisTop().scale(xScale.domain(sorted)))
      ;
      render_cells();
  } // resort()

  // Sets up the click handlers on the data download buttons.
  function connect_download_buttons() {
    d3.select("#data-download-button")
      .on("click", function (){
          dispatch.call("downloadAllLimits", null, xColumn, yColumn);
        })
    ;
    d3.select("#data-button-download-current-view")
      .on("click", function (){
          dispatch.call("downloadCurrentLimits", null, xColumn, yColumn, selectedColumn);
        })
    ;
  } // connect_download_buttons()


  // API - Getter/Setter Methods
  my.svg = function(_) {
      if(!arguments.length) return svg;
      svg = _
            .attr("preserveAspectRatio", "xMinYMin meet")
      ;
      var g = svg.append("g")
              .attr("transform", "translate(" + [margin.left, margin.top] + ")")
        , viz = g.append("g")
              .attr("class", "viz")
        , axes = g.append("g")
              .attr("class", "axes")
      ;
      xAxisG = axes.append("g")
          .attr("class", "x axis")
      ;
      yAxisG = axes.append("g")
          .attr("class", "y axis")
      ;
      yAxis2G = axes.append("g")
          .attr("class", "y axis")
      ;
      buttonG = g.append("g")
          .attr("class", "reset-sort")
      ;
      return my;
    } // my.svg()
  ;
  my.tooltip = function (_){
      if(!arguments.length) return tooltip;
      tooltip = _;
      svg.call(tooltip);
      return my;
    } // my.tooltip();
  ;
  my.tooltipContent = function (_){
      if(!arguments.length) return tooltipContent;
      tooltipContent = _;
      return my;
    } // my.tooltipContent()
  ;
  my.data = function (_){
      if(!arguments.length) return data;
      data = _
          .sort(function(a, b) {
              return d3.ascending(a.Year, b.Year);
            })
          // UPDATE THIS WHEN THE YEAR IS COMPLETE
          .filter(function(d) { return d.Year != 2016; })
      ;
      reset = true;
      domainify();
      score();
      return my;
    } // my.data()
  ;

  my.selectedColumn = function (_, useKeyColumn){
      if(!arguments.length) return selectedColumn;

      selectedColumn = _;
      var keyColumn = useKeyColumn && (
          ~selectedColumn.indexOf('Limit')
          ? selectedColumn.split('Limit')[0]
          : undefined
      );

      valueAccessor = function (d){
          var value;
          // Handle the case of a threshold scale.
          if(keyColumn){
              value = d[keyColumn] === "Limited"
                ? +d[selectedColumn]
                : d[keyColumn] === "No"
                  ? -Infinity
                  : Infinity
              ;
          } else {
              value = d[selectedColumn];
              value = (
                value === undefined ? "Missing Field" :
                value.trim() === "" ? (colorScale.emptyValue || "Missing Data") :
                isNaN(+value) ? value :
                +value
              );
          }
          return value;
      }

      format = function (value){
          return (
              value === -Infinity
                ? "Prohibited"
                : value === Infinity
                  ? "Unlimited"
                  : typeof value === "string"
                    ? value
                    : moneyFormat(value)
          );
      };

      reset = false;
      return my;
    } // my.selectedColumn()
  ;
  my.valueAccessor = function (_){
      if(!arguments.length) return valueAccessor;
      valueAccessor = _;
      return my;
    } // my.valueAccessor()
  ;
  my.format = function (_){
      if(!arguments.length) return format;
      format = _;
      return my;
    } // my.format()
  ;
  my.selectedColumnLabel = function (_){
      if(!arguments.length) return selectedColumnLabel;
      selectedColumnLabel = _;
      return my;
    } // my.selectedColumnLabel()
  ;
  my.resize = function (){
      size_up();
      reset = false;
      return my;
    } // my.resize()
  ;
  my.empty = function (_){
      if(!arguments.length) return empty;
      empty = _;
      reset = false;
      return my;
    } // my.empty()
  ;
  my.reset = function (){ // setter only
      reset = true;
      sortYear = null;
      return my;
    } // my.reset()
  ;
  my.connect = function (_){
      if(!arguments.length) return dispatch;
      dispatch = _;
      return my;
    } // my.connect()
  ;
  my.selectedYear = function(_) {
      if(!arguments.length) return sortYear;

      sortYear = _;
      resort();

      // Highlight the tick for the selected year.
      svg.selectAll(".y.axis .tick text")
          .each(function(d) {
              var self = d3.select(this);
              self.classed("sortby", sortYear === d);
              d3.select(self.node().parentNode).select("line")
                  .attr()
          })
      ;
    }
  ;
  my.colorScale = function (_){
      if(!arguments.length) return colorScale;
      colorScale = _;
      return my;
    } // my.colorScale()
  ;

  // This is always the last thing returned
  return my;
} // Grid()