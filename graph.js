
/* GRAPH & PRIM ALGORITHM */

var math = mathjs();
var parser = math.parser();

function Vertex(id, normalX, normalY, radius) {
    this.id = id;
	this.normalX = normalX;
	this.normalY = normalY;
	this.radius = radius;
	
	// spt properties
	this.parent = null;
	this.children = [];
	
	// hyperbolic stuff
		// for computation
	this.alpha = 0;
	this.beta = 0;
	this.hypA = 0;
	this.hypB = 0;
	this.hypC = 0;
		// coordinates
	this.hypX = 0;
	this.hypY = 0;
	
	this.onNormalRoute = false;
	this.onNormalRouteFrom = null;
	this.onNormalRouteTo = null;
	this.onHyperbolicRoute = false;
	this.onHyperbolicRouteFrom = null;
	this.onHyperbolicRouteTo = null;
}

Vertex.prototype.distanceFrom = (function(o) {
	return Math.sqrt(Math.pow(this.normalX - o.normalX, 2) + Math.pow(this.normalY - o.normalY, 2));
});

Vertex.prototype.hypDistanceFrom = (function(o) {
	// note: log(2*x - 1/sqrt(x^2-1)) ~= acosh 2**28 > x > 2, from go source
	var xa = this.hypX;
	var ya = this.hypY;
	var xb = o.hypX;
	var yb = o.hypY;
	var top = "(1 - (" + xa + ")*(" + xb + ") - (" + ya + ")*(" + yb + "))";
	var sqrt1 = "sqrt(1- ("+ xa +")^2 - ("+ya + ")^2)";
	var sqrt2 = "sqrt(1- ("+ xb +")^2 - ("+yb + ")^2)";
	var inside = parser.eval(top + " / ( " + sqrt1 + " * " + sqrt2 + " )");
	
	var cosh = parser.eval("log(2*(" + inside + ") - 1 / sqrt((" + inside + ")^2-1))");
	console.log(top + " / ( " + sqrt1 + " * " + sqrt2 + " )");
	
	return Math.sqrt(Math.pow((this.hypX - o.hypX), 2) + Math.pow((this.hypX - o.hypX), 2));
	
	//return cosh;
});

Vertex.prototype.distanceFromP = (function(o) {
	return Math.sqrt(Math.pow(this.normalX - o[0], 2) + Math.pow(this.normalY - o[1], 2));
});

function Edge(e, v) {
    this.e = e;
    this.v = v;
}

Edge.prototype.normalLength = (function() {
	return Math.sqrt(Math.pow(this.e.normalX - this.v.normalX, 2) + Math.pow(this.e.normalY - this.v.normalY, 2));
});


function Graph(verticles, edges) {
    //console.log(edges);
	this.verticles = verticles || [];
    this.edges = edges || [];
	this.root = null;
	this.maxWidth = 0;	
}

Graph.prototype.calculateNormalRoute = (function (start, end) {
	start.onNormalRoute = true;
	var curr = start;
	var found = start;
	console.log(found);
	while(found != null && found != end) {
		var prevfound = found;
		found = null;
		mind = 999999999999;
		for(var idx in this.edges) {
			var oth = null;
			if ( this.edges[idx].e == curr) {
				oth = this.edges[idx].v;
			}
			if ( this.edges[idx].v == curr) {
				oth = this.edges[idx].e;
			}
			if (oth == null) continue;
			var dist = end.distanceFrom(oth);
			if (dist < mind) {
				found = oth;
				mind = dist;
			}
		}
		if (found && found.onNormalRoute) {
			// circle
			console.log("circle");
			found = null;
		}
		if (found) {
			console.log(found);
			found.onNormalRoute = true;
			found.onNormalRouteFrom = prevfound;
			prevfound.onNormalRouteTo = found;
		}
		curr = found;
	}
});

Graph.prototype.calculateHyperbolicRoute = (function (start, end) {
	start.onHyperbolicRoute = true;
	var curr = start;
	var found = start;
	console.log(found);
	while(found != null && found != end) {
		var prevfound = found;
		found = null;
		mind = 999999999999;
		for(var idx in this.edges) {
			var oth = null;
			if ( this.edges[idx].e == curr) {
				oth = this.edges[idx].v;
			}
			if ( this.edges[idx].v == curr) {
				oth = this.edges[idx].e;
			}
			if (oth == null) continue;
			var dist = end.hypDistanceFrom(oth);
			console.log(dist);
			if (dist < mind) {
				found = oth;
				mind = dist;
			}
		}
		if (found && found.onHyperbolicRoute) {
			// circle
			console.log("circle");
			found = null;
		}
		if (found) {
			console.log(found);
			found.onHyperbolicRoute = true;
			found.onHyperbolicRouteFrom = prevfound;
			prevfound.onHyperbolicRouteTo = found;
		}
		curr = found;
	}
});

Graph.prototype.calculateRoutes = (function (start, end) {
	for(var idx in this.verticles) {
		this.verticles[idx].onNormalRoute = false;
		this.verticles[idx].onNormalRouteFrom = null;
		this.verticles[idx].onNormalRouteTo = null;
		this.verticles[idx].onHyperbolicRoute = false;
		this.verticles[idx].onHyperbolicRouteFrom = null;
		this.verticles[idx].onHyperbolicRouteTo = null;
	}
	this.calculateNormalRoute(start, end);
	console.log("hyperbolic routing");
	this.calculateHyperbolicRoute(start, end);
});

Graph.prototype.calculateSpt = (function (root) {
	var inTheTree = {};
	var current = null;
	var queue = [];
	this.root = root;
	
	for(var idx in this.verticles) {
		this.verticles[idx].parent = null;
		this.verticles[idx].children = []                                         ;
	}
	
	queue.push(root);
	
    while (queue.length != 0) {
        current = queue.shift();
		//console.log("Curr vertex: " + current);
		// search children
		for (var idx in this.edges) {
			var edge = this.edges[idx];
			inTheTree[current.id] = true;
			if (edge.v.id == current.id && !inTheTree[edge.e.id]) {
				inTheTree[edge.e.id] = true;
				queue.push(edge.e);
				edge.e.parent = current;
				current.children.push(edge.e);
			}
			if( edge.e.id == current.id && !inTheTree[edge.v.id]) {
				inTheTree[edge.v.id] = true;
				queue.push(edge.v);
				edge.v.parent = current;
				current.children.push(edge.v);
			}
		}
    };
	
	this.maxWidth = 0;
	for(var idx in this.verticles) {
		if (this.verticles[idx].children.length > this.maxWidth) {
			this.maxWidth = this.verticles[idx].children.length;
		}
	}
});

Graph.prototype.calculateHyperbolicCoordinates = (function () {

	var math = mathjs();
	var parser = math.parser();

	if (this.root == null) return;

	this.root.alpha = Math.PI;
	this.root.beta = 2 * Math.PI;
	this.root.hypA = parser.eval('e^(i*('+this.root.alpha+'))');
	this.root.hypB = parser.eval('e^(i*('+this.root.beta+'))');
	
	// kicsit a nulla mellett, altalaban jonak kell lennie
	this.root.hypX = -0.1;
	this.root.hypY = 0.05;
	this.root.hypC = parser.eval(this.root.hypX + ' + ' + this.root.hypY + 'i');
	
	var queue = [];
	
	for (idx in this.root.children) {
		queue.push(this.root.children[idx]);
	}
	
	while (queue.length != 0) {
		var item = queue.shift();
		
		// get data from parent
		var cpn = item.parent.hypC;
		item.alpha = item.parent.alpha;
		item.beta = parser.eval("((" + item.parent.alpha + ") + (" + item.parent.beta + ")) / 2");
		// update parent
		item.parent.alpha = item.beta
		
		// calculate c and R based on the formula
		item.hypA = parser.eval('e^(i*('+item.alpha+'))');
		item.hypB = parser.eval('e^(i*('+item.beta+'))');
		var m = parser.eval("((" + item.hypA + ')+(' + item.hypB + "))/2");
		var c = parser.eval("1/conj(" + m + ")");
		var r2 = parser.eval("1/abs(" + m + ")^2 - 1.0");
		
		// calculate end coordinates
		item.hypC = parser.eval("("+r2 + "/(conj("+cpn+")-conj("+c+")))+"+c);
		item.hypX = math.re(item.hypC);
		item.hypY = math.im(item.hypC);
		console.log("Hyp: " + item.hypX + " " + item.hypY);
		
		// update alpha
		item.hypA = parser.eval("((" + item.hypA + ") + (" + item.hypB + "))/2");
		
		// add children tot he queue
		for (idx in item.children) {
			queue.push(item.children[idx]);
		}
	}
	
});


function generateVerticles(n, radius) {
	var v = [];
	for(var i=0;i<n;i++) {
		v.push(new Vertex(i, (Math.random()*100), (Math.random()*100), radius));
	}
	return v;
}

function generateConnections(verticles) {
	var e = [];
	for(var i=0;i<verticles.length-1;i++) {
		for(var j=i+1;j<verticles.length;j++) {

			if (
				(verticles[i].distanceFrom(verticles[j]) < verticles[i].radius) &&
				(verticles[j].distanceFrom(verticles[i]) < verticles[j].radius)) {
				e.push(new Edge(verticles[i], verticles[j]));
			}
		}
	}
	return e;
}
