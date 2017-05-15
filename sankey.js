/*
I am a AGE year old MALE in STATE EDUCATION RELIGION_CASTE_GROUP"
ro3 -> Sex
ro5 -> age
groups -> religion and caste
*/ 

function redraw(people){
	
    var people;

	q = d3.queue();
	q.defer(d3.csv, "final.csv")

	q.await(function(error, data) {
		people = data;
	});


	function getData(sankeyData, filter_choices, level) {
		if(sankeyData[0]["key"])
		{
			for (var i = sankeyData.length - 1; i >= 0; i--) {
			    if(sankeyData[i]["key"] === filter_choices[level])
			    {
			    	var final_data =  getData(sankeyData[i]["values"], filter_choices, ++level);
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
		    {"node": 0, "name":"People like you"},
		    {"node": 1, "name": "Government"},
            {"node": 2, "name": "Private"},
            {"node": 3, "name": "Others"},
		    {"node": 4, "name": "Agriculture"},
            {"node": 5, "name": "HFF"},
            {"node": 6, "name": "Mining"},
            {"node": 7, "name": "Manufacturing"},
            {"node": 8, "name": "Energy"},
            {"node": 9, "name": "Construction"},
            {"node": 10, "name": "Wholesale"},
            {"node": 11, "name": "Retail"},
            {"node": 12, "name": "Transport"},
            {"node": 13, "name": "Others"}
		];

		for (var i = data.length - 1; i >= 0; i--) {

			var link_hash = "0-" + (+sector_codes[data[i]["WS14"]] + 1);
			if(!temp_links[link_hash])
				temp_links[link_hash] = {"name": link_hash, "value": 1};

			temp_links[link_hash]["value"] += 1;

			link_hash = sector_codes[data[i]["WS14"]] + 1 + "-" + (+industry_codes[data[i]["WS5"]] + 4);
			if(!temp_links[link_hash])
				temp_links[link_hash] = {"name": link_hash, "value": 1};

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

		console.log(sankeyJson);

		return sankeyJson;
	}

	function createSankeyData() {
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

    	var sankeyData = createSankeyData();
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

    	//remove previous Sankey

    	d3.select(".sankey-container").select("svg").remove();

    	var svg = d3.select(".sankey-container").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        sankey
            .nodes(sankeyJson.nodes)
            .links(sankeyJson.links)
            .layout(10);

        var link = svg.append("g").selectAll(".link")
            .data(sankeyJson.links)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "link")
            .style("stroke-width", function(d) { return Math.max(1, d.dy); })
            .sort(function(a, b) { return b.dy - a.dy; });

        link.append("title")
            .text(function(d) {
            	return d.source.name + " → " + d.target.name + "\n" + d.value;
            });

        var node = svg.append("g").selectAll(".node")
            .data(sankeyJson.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
            	return "translate(" + d.x + "," + d.y + ")"; })
            .on("start", function() {
            	this.parentNode.appendChild(this);
            });

        node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .style("fill", function(d) { 
            	return d.color = color(d.name.replace(/ .*/, "")); })
            .style("stroke", "black")
            .append("title")
            .text(function(d) { 
	            return d.name + "\n" + d.value; });

	}

	return {createSankey: createSankey};
}
    

var makeChart = redraw();