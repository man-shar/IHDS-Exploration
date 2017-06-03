/*
I am a AGE year old MALE in STATE EDUCATION RELIGION_CASTE_GROUP"
ro3 -> Sex
ro5 -> age
groups -> religion and caste
*/ 

function redraw(people) {
    
    var people;
    var sankeySvg;

    q = d3.queue();
    q.defer(d3.csv, "data_final.csv");
    q.await(function(error, data) {
        people = data;

        createSankey(people);

        createHistogram(people);
    });


    function getData(sankeyData, filter_choices, level) {
        if(sankeyData[0]["key"])
        {
            for (var i = sankeyData.length - 1; i >= 0; i--) {
                if(sankeyData[i]["key"] === filter_choices[level])
                {
                    var final_data =  getData(sankeyData[i]["values"], filter_choices, ++level);

                    if(final_data === "No Match")
                        return "No Match";

                    return final_data;
                }
            }
            return "No Match"
        }
        return sankeyData;
    }

    function createSankeyJson(data) {

        var sankeyJson = {"nodes": [], "links": []};

        var temp_links = {};

        sankeyJson.nodes  = [
            {"node": 0, "name": "Government"},
            {"node": 1, "name": "Private"},
            {"node": 2, "name": "Others"},
            {"node": 3, "name": "Unknown"},
            {"node": 4, "name": "Agriculture"},
            {"node": 5, "name": "HFF"},
            {"node": 6, "name": "Mining"},
            {"node": 7, "name": "Manufacturing"},
            {"node": 8, "name": "Energy"},
            {"node": 9, "name": "Construction"},
            {"node": 10, "name": "Wholesale"},
            {"node": 11, "name": "Retail"},
            {"node": 12, "name": "Transport"},
            {"node": 13, "name": "Others"},
            {"node": 14, "name": "Business"},
            {"node": 15, "name": "Retired"},
            {"node": 16, "name": "Housework"},
            {"node": 17, "name": "Student"},
            {"node": 18, "name": "Unemployed"},
            {"node": 19, "name": "Too Young/Unfit"},
            {"node": 20, "name": "Public Admin"},
            {"node": 21, "name": "Education"}
        ];

        for (var i = data.length - 1; i >= 0; i--) {

            link_hash = sector_codes[data[i]["WS14"]] + "-" + (+data[i]["WS5"] + 4);
            if(!temp_links[link_hash])
                temp_links[link_hash] = {"name": link_hash, "value": 1};


            else
                temp_links[link_hash]["value"] += 1;

        }
        
        for (var hash in temp_links) {
            var nodes = temp_links[hash]["name"].split("-");

            var source = nodes[0];

            var target = nodes[1];

            var linkForJson = {
                "source": +source, "target": +target, "value": +temp_links[hash]["value"]
            };

            sankeyJson["links"].push(linkForJson);
        }
        return sankeyJson;
    }

    function createAgeData(){
    	var age = document.getElementById("age_choice").value;

        var age_upper, age_lower;

    	if(age == "All"){
    		age_lower = 18;

            age_upper = 200;
        }

        else if(age == "Above 60"){
            age_lower = 60;

            age_upper = 200;
        }


    	else{
    		age = age.split("-");

    		age_lower = +age[0];

    		age_upper = +age[1];
        }

		var ageData = d3.nest().key(function(d){ return d["RO5"]; }).entries(people);

		ageData = ageData.reduce(function(final, age_object) {

			if(+age_object["key"] <= age_upper && +age_object["key"] >= age_lower)

				final = final.concat(age_object["values"]);

			return final;

		}, []);

		return ageData;
    	}

    function createData() {
        var sex = document.getElementById("sex_choice").value;
        var education = document.getElementById("education_choice").value;
        var rnc = document.getElementById("rnc_choice").value;

        var ageData = createAgeData();

        var chosen = [sex, education, rnc]; //what the user has entered
        var choice_labels = ["RO3", "EDUC7", "GROUPS"]; //labels for our dropdowns as in the Codebook

        var filter_choices = []; //contains the values enterred by the user which are not "All".

        //find the labels that have something other than "All" and also push those enterred choices to filter_choices.

        var entered_choice_labels = chosen.reduce(function(acc, choice, i) {
            if (choice != "All"){
                acc.push(choice_labels[i]);
                filter_choices.push(choice);
            }
            return acc;
        }, []);

        var matchJson = {};

        var sankeyData = entered_choice_labels.reduce(function(acc, choice_label, i){
        	matchJson[choice_label] = filter_choices[i];
            return acc.key(function(d) {
                return d[choice_label];
            });
        }, d3.nest());

        var final_data = _.where(ageData, matchJson); // final data to make sankey. Not a JSON yet. That happens in createSankeyJson().

        return final_data;
    }

    function createSankey() {

        var sankeyData = createData();

        if(sankeyData === "No Match"){
    	    return "No People";
    	    d3.select(".sankey-container").select("svg").selectAll("*").remove
        }

        var sankeyJson = createSankeyJson(sankeyData);

        var margin = {top: 10, right: 10, bottom: 10, left: 10},
            width = 550 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom,
            color = d3.scaleOrdinal(d3.schemeCategory20);

        d3.select(".sankey-container")
            .selectAll("svg")
            .data(["sankey-svg"], function(d) {
                return "sankey-svg";
            })
            .enter()
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var sankeySvg = d3.select(".sankey-container").select("svg");

        var sankey = d3.sankey()
            .nodeWidth(36)
            .nodePadding(5)
            .size([width, height]);

        path = sankey.link();

        sankey
            .nodes(sankeyJson.nodes)
            .links(sankeyJson.links)
            .layout(10);

        var linkGBound = sankeySvg.selectAll(".links-g")
            .data(["links-g"], function() {
            	return ["links-g"];
            });

        var linkG = linkGBound
            .enter()
            .append("g")
            .attr("class", "links-g")
            .merge(linkGBound);

        var linksBound = linkG.selectAll(".link")
            .data(sankeyJson.links, function(d) {
            	return d.source.node + "-" + d.target.node;
            });

		linksBound.exit()
			.transition()
			.duration(700)
            .style("opacity", 1e6)
			.remove();

		linksBound.enter()
		    .append("path")
			.attr("class", "link")
            .attr("d", path)
            .style("stroke-width", function(d){ return Math.max(1, d.dy); })
			.append("title")
            .text(function(d) {
                return d.source.name + " -> " + d.target.name + "\n" + d.value;
            });

        linksBound
            .transition()
            .duration(700)
            .attr("d", path)
            .style("stroke-width", function(d){ return Math.max(1, d.dy); });

        linksBound.select("title")
            .text(function(d) {
                return d.source.name + " -> " + d.target.name + "\n" + d.value;
            });			

        var nodeGBound = sankeySvg.selectAll(".nodes-g")
            .data(["nodes-g"], function(d) {
                return d;
            });

        var nodeG = nodeGBound
            .enter()
            .append("g")
            .attr("class", "nodes-g")
            .merge(nodeGBound);

        var nodesBound = nodeG
            .selectAll(".node")
            .data(sankeyJson.nodes, function(d) { var key = d.node; return key;});

        nodesBound.exit()
            .transition()
            .duration(700)
            .attr("height", 0)
            .remove();

        nodesBound.enter()
            .append("rect")
        	.attr("class", "node")
        	.attr("x", function(d){ return d.x; })
        	.attr("width", sankey.nodeWidth())
        	.style("fill", function(d) { 
                return d.color = color(d.name.replace(/ .*/, "")); })
            .style("stroke", "black")
            .style("stroke-width", 0.4)
            .append("title")
            .text(function(d) { 
                return d.name + "\n" + d.value;
            });

        d3.selectAll(".node")
            .transition()
            .duration(700)
            .attr("y", function(d){ return d.y; })
            .attr("height", function(d){ return d.dy;});

        var nodeLabelsBound = sankeySvg.selectAll(".node-label")
            .data(sankeyJson.nodes, function(d) {
                return d.name + d.x;
            });

        nodeLabelsBound
            .enter()
            .append("text")
            .attr("class", "node-label")
            .text(function(d) {
                return d.name;
            })
            .attr("x", function(d) {
                if(d.x >= d.dx)
                {
                    d3.select(this).style("text-anchor", "end");
                    return d.x - 3;
                }

                return d.x + d.dx + 3;
            })
            .merge(nodeLabelsBound)
            .transition()
            .duration(700)
            .attr("y", function(d) {
                return d.y + d.dy / 2;
            });


        nodeLabelsBound.exit()
            .remove();
        }



    function createHistogram() {

        var ageData = createAgeData(people);
    	var data = createData(ageData);
    	var data_filtered = data.filter(function(person) { return person["WSEARN"] !== "NA"; });
        var max_earnings = d3.max(people, function(person){ if(person["WSEARN"] == "NA"){ return 0; } return +person["WSEARN"]; });
        var min_earnings = 0;

        var width = 550;
        var height = 400;
        var margin = 20;

        var histogram_svg, histogram_g;

        var yScale = d3.scaleLinear().range([height, 0]).domain([0, 100]),
            xScale = d3.scaleLinear().range([0, width]).domain([0, max_earnings]);

        var histogram = d3.histogram()
            .value(function(d) { return +d["WSEARN"]; })
            .domain(xScale.domain())
            .thresholds(xScale.ticks(20));

        histogram_svgBound = d3.select(".histogram-container")
            .selectAll("svg")
            .data(["histogram-svg"], function(d) {
                return d;
            });

        histogram_svg = histogram_svgBound
            .enter()
            .append("svg")
            .attr("height", height + 3 * margin)
            .attr("width", width + 3 * margin)
            .attr("class", "histogram-container")
            .merge(histogram_svgBound);

        histogram_g = histogram_svg.selectAll(".histogram-chart")
            .data(["histogram-chart"], function(d) {
                return d;
            })
            .enter()
            .append("g")
            .attr("class", "histogram-chart")
            .attr("transform", "translate(" + (2 * margin) + ", " + margin + ")");

        var bins = histogram(data_filtered);

        var total = data_filtered.length;

        var histogramBound = d3.select(".histogram-chart").selectAll("rect")
            .data(bins, function(d, i) { return i; });

        histogramBound.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("fill", "#aaa")
            .merge(histogramBound)
            .transition()
            .duration(700)
            .attr("x", function(d) { return xScale(d.x0) + 1; })
            .attr("y", function(d) { return yScale((d.length/total) * 100) })
            .attr("width", function(d) { return xScale(d.x1 - d.x0) - 1; })
            .attr("height", function(d) { return height - (yScale((d.length/total) * 100)) });

        histogramBound.exit()
        	.transition()
        	.duration(700)
        	.style("opacity", 0)
            .remove();

        histogram_svg.selectAll(".x-axis")
            .data(["x-axis"], function(d) {
                return d;
            })
            .enter()
            .append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(" + (2 * margin) + ", " + (height + margin) + ")")
            .transition()
            .duration(700)
            .call(d3.axisBottom(xScale).ticks(15).tickFormat(function(d) {
            if((d / 1000).toFixed(0) > 100)
                return (d / 100000).toFixed(1) + "L";
            else
                return (d / 1000).toFixed(0) + "k";
        }));

        histogram_svg.selectAll(".y-axis")
            .data(["y-axis"], function(d) {
                return d;
            })
            .enter()
            .append("g")
            .attr("class", "y-axis")
            .attr("transform", "translate(" + (2 * margin) + ", " + margin + ")")
            .transition()
            .duration(700)
            .call(d3.axisLeft(yScale));

        histogram_svg.selectAll(".y-axis-label")
            .data(["y-axis-label"], function(d) {
                return d;
            })
            .enter()
            .append("text")
            .attr("class", "y-axis-label axis-label")
            .attr("y", 0)
            .attr("x", 0 - height / 2)
            .text("Percentage of people")
            .attr("transform", "rotate(-90)");

        histogram_svg.selectAll(".x-axis-label")
            .data(["x-axis-label"], function(d) {
                return d;
            })
            .enter()
            .append("text")
            .attr("class", "x-axis-label axis-label")
            .attr("transform", "translate(" + (margin + (width) / 2) + ", " + (height + 2 * margin + 10) + ")" )
            .text("Yearly Earning");

    }

    return {createSankey: createSankey, createHistogram: createHistogram};

}
    

var makeChart = redraw();