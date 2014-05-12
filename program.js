var graph;
var graphcanv;

$(document).ready(function() {
	//var verticles = generateVerticles(40, 70);
	var verticles = generateReg3Verticles();
    var edges = generateConnections(verticles);
   
    graph = new Graph(verticles, edges);
	graph.calculateSpt(verticles[0]);
	graph.calculateHyperbolicCoordinates();
	
	graphcanv = new GraphCanvas($('#normalCanvas')[0], $('#hyperbolicCanvas')[0]);
	graphcanv.setGraph(graph);
	
	$('#normalCanvas').mousemove(function(e) {
		var x = (e.pageX - $('#normalCanvas').position().left);
		var y = (e.pageY - $('#normalCanvas').position().top);
		graphcanv.normalMousemove(x, y);
	});
	
	$('#normalCanvas').dblclick(function(e) {
		var x = (e.pageX - $('#normalCanvas').position().left);
		var y = (e.pageY - $('#normalCanvas').position().top);
		graphcanv.dblclick(x, y);
	});
	
	$('#normalCanvas').click(function(e) {
		var x = (e.pageX - $('#normalCanvas').position().left);
		var y = (e.pageY - $('#normalCanvas').position().top);
		console.log(event.which);
		if (event.which == 1){ graphcanv.lclick(x, y); }
	});
	
	$('#normalCanvas').bind('contextmenu', function(e) {
		var x = (e.pageX - $('#normalCanvas').position().left);
		var y = (e.pageY - $('#normalCanvas').position().top);
		graphcanv.rclick(x, y);
		e.preventDefault();
	});

	graphcanv.draw();
});