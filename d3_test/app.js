// const svg = d3.select('#my_dataviz');
//
// const data = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']
//
// svg
//     .selectAll('circle')
//     .data['123']
//     .enter()
//     .append("circle")
//     .attr('cx', 300)
//     .attr('cy', 200)
//     .attr('r', 10);

const widget = d3.select("#widget")

// create a list of keys
const keys = ["Mister A", "Brigitte", "Eleonore", "Another friend", "Batman"]

// Usually you have a color scale in your chart already
// const color = d3.scaleOrdinal()
//     .domain(keys)
//     .range(d3.schemeSet2);
//
// svg.append("circle")
//     .attr("cx", 300)
//     .attr("cy", 200)
//     .attr("r", 200)
//     .style("fill", 'red')
//
// // Add one dot in the legend for each name.
// const g = svg.append('g')
//     .attr('transform', 'translate(20,350)');
//
// g.selectAll("mydots")
//     .data(keys)
//     .enter()
//     .append("circle")
//     .attr("cx", function(d,i){ return i*25})
//     .attr("cy", 0)
//     .attr("r", 7)
//     .style("fill", function(d){ return color(d)})
//
// // Add one dot in the legend for each name.
// g.selectAll("mylabels")
//     .data(keys)
//     .enter()
//     .append("text")
//     .attr("x", 20)
//     .attr("y", function(d,i){ return i*25})
//     .style("fill", function(d){ return color(d)})
//     .text(function(d){ return d})
//     .attr("text-anchor", "left")
//     .style("alignment-baseline", "middle")

const data = ["Cat A","Cat B","Cat C", "Cat D", "Dog A", "Dog B", "Dog C", "Dog D"];
const n = data.length/2;
const itemWidth =80;
const itemHeight = 18;

const color = d3.scaleOrdinal(d3.schemeCategory10);

widget.append("circle")
    .attr("cx", 300)
    .attr("cy", 200)
    .attr("r", 200)
    .style("fill", 'red')

const legendContainer = d3.select("#legend")

const legend = legendContainer.selectAll(".legend")
    .data(data)
    .enter()
    .append("g")
    .attr("transform", function(d,i) { return "translate(" + i%n * itemWidth + "," + Math.floor(i/n) * itemHeight + ")"; })
    .attr("class","legend");

const rects = legend.append('rect')
    .attr("width",15)
    .attr("height",15)
    .attr("fill", function(d,i) { return color(i); });

const text = legend.append('text')
    .attr("x", 15)
    .attr("y",12)
    .text(function(d) { return d; });