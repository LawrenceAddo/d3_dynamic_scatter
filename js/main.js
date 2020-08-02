/*
*    main.js
*    Mastering Data Visualization with D3.js
*    Project 2 - Gapminder Clone
*/

//margin for axises
var margin = {left:80, right:20, top:50, bottom:100};

//svg area
var svg_x = 800;
var svg_y = 500;

//graph
var width = svg_x - margin.left - margin.right;
var height = svg_y - margin.top - margin.bottom;

//initial frame setting
var g = d3.select("#chart-area")
	.append("svg") //svg connection to class in html file
		.attr("width",svg_x)
		.attr("height",svg_y)
	.append("g") //margin for x and y axis. at graph setting graph size is created, after that needs to move by here
		.attr("transform", "translate(" + margin.left + 
			"," + margin.top + ")");

//time for interval setting (yr, start from 1800 to 2014yr)
var time = 0;

//declare for interval function
var interval;

// interval function would lik eto access formattedData function and needs declare
var formattedData;

//update and transition time
var dur = 150;

//tooltip
var tip = d3.tip().attr("class", "d3-tip")
	.html(d=>{
		var text = "<strong>Country:</strong> <span style = 'color:red'>" + d.country + "</span><br>";
		text += "<strong>Continent:</strong> <span style='color:red;text-transform:capitalize'>" + d.continent + "</span><br>";
        text += "<strong>Life Expectancy:</strong> <span style='color:red'>" + d3.format(".1f")(d.life_exp) + "</span><br>";
        text += "<strong>GDP Per Capita:</strong> <span style='color:red'>" + d3.format("$,.0f")(d.income) + "</span><br>";
        text += "<strong>Population:</strong> <span style='color:red'>" + d3.format(",.0f")(d.population) + "</span><br>";
		return text;
	});
g.call(tip);

//scaling
var x = d3.scaleLog()
	.base(10)
	// .domain([10, d3.max(data, d=>{return d.income;})]) //min 0 not work for log
	.domain([142, 150000]) //min 0 not work for log
	.range([0,width]);
var y = d3.scaleLinear()
	// .domain([0, d3.max(data, d=>{return d.life_exp;})])
	.domain([0, 90])
	.range([height,0]);
var area = d3.scaleLinear() //size of circle
	// .domain([0,d3.max(data, d=>{return d.population;})])
	.domain([2000, 1400000000])
	.range([25*Math.PI,1500*Math.PI]);
var continentColor = d3.scaleOrdinal(d3.schemePastel1); //color grouped by continent

//axis setting
var formatComma = d3.format(","); //comma for every 3 digits
var xAxisCall = d3.axisBottom(x)
	.tickValues([400,4000,40000])
	.tickFormat(d => {return "$"+formatComma(d);});
g.append("g")
	.attr("transform","translate(0," + height + ")")
	.attr("opacity", 0.6)
	.call(xAxisCall);
var yAxisCall = d3.axisLeft(y)
	.ticks(10);
g.append("g")
	.attr("opacity", 0.6)
	.call(yAxisCall);

//labels
var xLabel = g.append("text")
	.attr("x",width / 2)
	.attr("y", height + 30)
	.attr("font-size", 13)	
	.attr("opacity", 0.6)
	.attr("text-anchor", "middle") //centering
	.text("GDP Per Capita ($)");
var yLabel = g.append("text")
	.attr("transform", "rotate(-90)")
	.attr("x", -height /2)
	.attr("y", -30)
	.attr("opacity", 0.6)
	.attr("text-anchor", "middle")
	.attr("font-size", 13)
	.text("Life Expectancy (Yrs)");
var timeLabel = g.append("text")
	.attr("x", width - 40)
	.attr("y", height - 10)
	.attr("font-size", 35)
	.attr("opacity", 0.3)
	.attr("text-anchor", "middle")
	.text("1800");

//legend
var continents = ["europe", "asia", "americas", "africa"];
var legend = g.append("g")
    .attr("transform", "translate(" + (width - 10) + "," + (height - 125) + ")");
continents.forEach((continent, i) => {
    var legendRow = legend.append("g")
        .attr("transform", "translate(0, " + (i * 20) + ")");
    legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", continentColor(continent));
    legendRow.append("text")
        .attr("x", -10)
        .attr("y", 10)
        .attr("text-anchor", "end")
        .style("text-transform", "capitalize") //capitalize first character
        .attr("opacity", 0.6)
        .text(continent);
});


//data load
d3.json("data/data.json").then(data=>{
	console.log(data);
	
	//clean data. if the data includes na it does not show up
	formattedData = data.map(year=>{
		//remove na
		return year["countries"].filter(country=>{
			var dataExists = (country.income && country.life_exp);
			return dataExists
		//change chr to num
		}).map(country=>{
			country.income = +country.income;
			country.life_exp = +country.life_exp;
			return country;
		})
	});

	//first run for the visualization
	update(formattedData[0]);
	console.log(formattedData[0]);
})

$("#play-button")
	.on("click", function(){ //this anonymous function is event handler for on click
		var button = $(this);
		if (button.text() == "Play"){
			button.text("Pause");
			interval = setInterval(step, dur); //set interval is jquery function, step is function we've set, dur is duration we've declare for each step
		} else {
			button.text("Play");
			clearInterval(interval); //stop interval function
		}
	})

$("#reset-button")
	.on("click", function(){
		time = 0;
		update(formattedData[0]);
	})

//this needs real time update for whichever even either play or pause. without this selection only works under "play", and won't work for "pause"
$("#continent-select")
	.on("change", function(){
		update(formattedData[time]);
	})

//no longer used d3.interval function as we would like jquery to control interval
function step(){
	//at the end of our data (1800 to 2014), loop back to 0
	time = (time < 214) ? time + 1 : 0
	update(formattedData[time]);
}

//update function
function update(data){
	
	//standard transition time for the visualization
	var t = d3.transition()
		.duration(dur); //100usec

	//selection
	var continent = $("#continent-select").val(); //select value
	var data = data.filter(d => {
		if (continent == "all") {return true;}
		else {
			return d.continent == continent;
		}
	})

	//join new data with existing elements
	var circles = g.selectAll("circle")
		.data(data, d=>{return d.country;});

	//exit old elements not present in new data
	circles.exit()
		.remove();

	//enter new elements present in new data
	circles.enter()
		.append("circle")
		.attr("fill", d=>{return continentColor(d.continent);})
		.attr("opacity", 1)
		.on("mouseover", tip.show)
		.on("mouseout", tip.hide)
		.merge(circles) //merge old data to new data
		.transition(t)
			.attr("cx", d=>{return x(d.income);})
			.attr("cy", d=>{return y(d.life_exp);})
			.attr("r", d=>{return Math.sqrt(area(d.population)/Math.PI)});
	
	console.log(circles);

	//update the time label
	timeLabel.text(+(time + 1800));

}


