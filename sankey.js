/*
I am a AGE year old MALE in STATE EDUCATION RELIGION_CASTE_GROUP"
ro3 -> Sex
ro5 -> age
groups -> religion and caste
*/ 

q = d3.queue();
q.defer(d3.csv, "final.csv")

function createSankeyJson(nest) {

}

q.await(function(error, final) {
	console.log(final);
})

