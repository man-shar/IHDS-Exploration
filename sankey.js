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

		debugger;
		if(sankeyData[0]["key"])
		{
			for (var i = sankeyData.length - 1; i >= 0; i--) {
				if(sankeyData[i]["key"]) {
					if(sankeyData[i]["key"] === filter_choices[level])
					{
						debugger;
						var final_data =  getData(sankeyData[i]["values"], filter_choices, ++level)
						return final_data;
					}
				}
			}
		}
		return sankeyData;
	}

	function createSankey() {
		var age = document.getElementById("age_choice").value;
		var sex = document.getElementById("sex_choice").value;
		var state = document.getElementById("state_choice").value;
		var education = document.getElementById("education_choice").value;
		var rnc = document.getElementById("rnc_choice").value;

		var chosen = [age, sex, state, education, rnc];
		var choice_labels = ["RO5", "RO3", "STATEID", "EDUC7", "GROUPS"];

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
		console.log(final_data);
    }

	return {createSankey: createSankey};
}

var makeChart = redraw();