/*
I am a AGE year old MALE in STATE EDUCATION RELIGION_CASTE_GROUP"
ro3 -> Sex
ro5 -> age
groups -> religion and caste
*/ 

function redraw(people) {
    
    var people;

    q = d3.queue();
    q.defer(d3.csv, "final.csv")

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
            {"node": 3, "name": "Agriculture"},
            {"node": 4, "name": "HFF"},
            {"node": 5, "name": "Mining"},
            {"node": 6, "name": "Manufacturing"},
            {"node": 7, "name": "Energy"},
            {"node": 8, "name": "Construction"},
            {"node": 9, "name": "Wholesale"},
            {"node": 10, "name": "Retail"},
            {"node": 11, "name": "Transport"},
            {"node": 12, "name": "Others"}
        ];

        for (var i = data.length - 1; i >= 0; i--) {

            link_hash = sector_codes[data[i]["WS14"]] + "-" + (+industry_codes[data[i]["WS5"]] + 3);
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

    function createData() {
        var age = document.getElementById("age_choice").value;
        var sex = document.getElementById("sex_choice").value;
        var education = document.getElementById("education_choice").value;
        var rnc = document.getElementById("rnc_choice").value;

        var chosen = [age, sex, education, rnc];
        var choice_labels = ["RO5", "RO3", "EDUC7", "GROUPS"];

        var entered_choice_labels = chosen.reduce(function(acc, choice, i) {
            if (choice != "All")
                acc.push(choice_labels[i]);
            return acc;
        }, []);
        
        var sankeyData = entered_choice_labels.reduce(function(acc, choice_label){
            return acc.key(function(d) {
                return d[choice_label];
            });
        }, d3.nest());

        sankeyData = sankeyData.entries(people);

        var filter_choices = chosen.filter(function(choice){
            return choice !== "All";
        });

        var final_data = getData(sankeyData, filter_choices, 0);

        return final_data;
    }

    function createSankey() {

        var sankeyData = createData();

        if(sankeyData === "No Match")
    	    return "No People"

        var sankeyJson = createSankeyJson(sankeyData);

        var margin = {top: 10, right: 10, bottom: 10, left: 10},
            width = 700 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom,
            color = d3.scaleOrdinal(d3.schemeCategory20);

        var sankey = d3.sankey()
            .nodeWidth(36)
            .nodePadding(5)
            .size([width, height]);

        var path = sankey.link();

        var svg, links, nodes;

        if(d3.select(".sankey-container").select("svg").empty())
        {
            svg = d3.select(".sankey-container").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        }

        else{
            svg = d3.select(".sankey-container").select("svg").select("g");
        }

        sankey
            .nodes(sankeyJson.nodes)
            .links(sankeyJson.links)
            .layout(10);

        if(d3.select(".links_g").empty()) {
            links = svg.append("g").attr("class", "links_g").selectAll(".link")
                .data(sankeyJson.links, function(d) { var key = d.source.node + "-" + d.target.node; return key; });
        }

        else
        {
            links = d3.select(".links_g").selectAll(".link").data(sankeyJson.links, function(d) { var key = d.source.node + "-" + d.target.node; return key; });
        }

		links.exit()
			.transition()
			.style("opacity", 1e-6)
			.remove();

		links
		    .select("title")
		    .text(function(d) {
		    	return d.source.name + " → " + d.target.name + "\n" + d.value;
		    });

		links
			.transition()
			.attr("d", path)
			.style("stroke-width", function(d){ return Math.max(1, d.dy); });


		links.enter().append("path")
			.attr("class", "link")
			.attr("d", path)
			.style("stroke-width", function(d){ return Math.max(1, d.dy); })
			.append("title")
            .text(function(d) {
                return d.source.name + " → " + d.target.name + "\n" + d.value;
            });

        if(d3.select(".nodes_g").empty()) {
            nodes = svg.append("g").attr("class", "nodes_g").selectAll(".node")
                .data(sankeyJson.nodes, function(d) { var key = d.node; return key;});
        }

        else
        {
            nodes = d3.select(".nodes_g").selectAll(".node").data(sankeyJson.nodes, function(d) { var key = d.node; return key; });
        }

        nodes.exit()
            .transition()
            .style("opacity", 1e-6)
            .remove();

        nodes
            .select("title")
            .text(function(d) { 
                return d.name + "\n" + d.value; 
            });


        nodes
        	.transition()
        	.attr("y", function(d){ return d.y; })
        	.attr("height", function(d){ return d.dy;})

        nodes.enter().append("rect")
        	.attr("class", "node")
        	.attr("x", function(d){ return d.x; })
        	.attr("y", function(d){ return d.y; })
        	.attr("height", function(d){ return d.dy;})
        	.attr("width", sankey.nodeWidth())
        	.style("fill", function(d) { 
                return d.color = color(d.name.replace(/ .*/, "")); })
            .style("stroke", "black")
            .style("stroke-width", 0.4)
            .append("title")
            .text(function(d) { 
                return d.name + "\n" + d.value; });
        }



    function createHistogram() {

        var data = createData(people);
        var max_earnings = d3.max(people, function(person){ return person["WSEARN"]; });
        var min_earnings = 0;

        var width = 600;
        var height = 400;

        var histogram_svg, histogram_g;

        var yScale = d3.scaleLinear().range([height, 0]).domain([0, 80]),
            xScale = d3.scaleLinear().range([0, width - 40]).domain([0, max_earnings]);

        var histogram = d3.histogram()
            .value(function(d) { return +d["WSEARN"]; })
            .domain(xScale.domain())
            .thresholds(xScale.ticks(10));

        if(d3.select(".histogram-container").select("svg").empty())
        {

            histogram_svg = d3.select(".histogram-container").append("svg").attr("height", height + 60).attr("width", width + 60);
            histogram_g = histogram_svg.append("g").attr("transform", "translate(30, 30)");
        }

        else{
            histogram_svg = d3.select(".histogram-container").select("svg");
            histogram_g = histogram_svg.select("g");
        }

        var bins = histogram(data);

        var total = data.length;

        var bound = histogram_g.selectAll("rect")
            .data(bins, function(d, i) { return i; });

        bound.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { debugger; return xScale(d.x0); })
            .attr("y", function(d) { return yScale((d.length/total) * 100) })
            .attr("width", function(d) { return xScale(d.x1 - d.x0) - 1; })
            .attr("height", function(d) { return height - (yScale((d.length/total) * 100)) })
            .attr("fill", "#aaa");

        bound
            .transition()
            .attr("x", function(d) { debugger; return xScale(d.x0); })
            .attr("y", function(d) { return yScale((d.length/total) * 100) })
            .attr("width", function(d) { return xScale(d.x1 - d.x0) - 1; })
            .attr("height", function(d) { return height - (yScale((d.length/total) * 100)) })
            .attr("fill", "#aaa");

        if (histogram_g.select(".x-axis").empty())
        {
            histogram_g.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0, " + height + ")")
                .transition()
                .call(d3.axisBottom(xScale));

            histogram_g.append("g")
                .attr("class", "y-axis")
                .transition()
                .call(d3.axisLeft(yScale));
        }

    }

    return {createSankey: createSankey, createHistogram: createHistogram};

}
    

var makeChart = redraw();