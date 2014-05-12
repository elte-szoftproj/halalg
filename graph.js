
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
	// euclideszi normakkal
	// top: 2 * |a-b|^2
	var top = "2 * ((("+xa+")-("+xb+"))^2+(("+ya+")-("+yb+"))^2)";
	// bottom: (1-|a|^2)*(1-|b|^2)
	var sqrt1 = "sqrt(1 - ("+ xa +")^2 - ("+ya + ")^2)";
	var sqrt2 = "sqrt(1 - ("+ xb +")^2 - ("+yb + ")^2)";
	// distance: acosh(1+d(a,b))
	var inside = parser.eval("1+("+top + " / ( " + sqrt1 + " * " + sqrt2 + " ))");
	
	// acosh ~ ln(x+sqrt(x^2-1))
	var acosh = parser.eval("log((" + inside + ") + sqrt((" + inside + ")^2-1), e)");
	console.log("inside:" + inside);
	console.log("acosh:" + acosh);
	
	return acosh;
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
		var fff = 0;
		for (var idx in this.edges) {
			var edge = this.edges[idx];
			inTheTree[current.id] = true;
			if (edge.v.id == current.id && !inTheTree[edge.e.id]) {
				inTheTree[edge.e.id] = true;
				queue.push(edge.e);
				edge.e.parent = current;
				current.children.push(edge.e);
				fff++;
			}
			if( edge.e.id == current.id && !inTheTree[edge.v.id]) {
				inTheTree[edge.v.id] = true;
				queue.push(edge.v);
				edge.v.parent = current;
				current.children.push(edge.v);
				fff++;
			}
			if (fff > 2) break;
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

	return this.calculateHyperbolicCoordinatesB();

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

Graph.prototype.calculateHyperbolicCoordinatesB = (function () {
	// works only for reg-3 graphs
	console.log("calculating hyperbolic coordinates");
	var math = mathjs();
	var parser = math.parser();
	
	var queue = [];
	
	// inverse functions from maple:
	// ainv: x -> -x
	// binv: x -> -(2ix - x + 1)/(2i-x+1)
	
	// reg-3 is good with fixed a, b, u, v
	var u = parser.eval("(2 - sqrt(3)) * i");
	console.log(u);
	var v = math.multiply(u, -1);
	
	var maxWidth = 3 ; // in fact, constant width
	
	if (this.root == null) return;
	
	this.root.hypA = 'a';
	this.root.hypC = math.multiply(-1, v); // ainv(v);
	this.root.hypX = math.re(this.root.hypC);
	this.root.hypY = math.im(this.root.hypC);
	
	console.log("--- root ");
	console.log(this.root.hypA);
	console.log(this.root.hypC);
	console.log(this.root.hypX + "  --  " + this.root.hypY);
	
	for (idx in this.root.children) {
		queue.push(this.root.children[idx]);
	}
	
	while (queue.length != 0) {
		var item = queue.shift();
		var idx = item.parent.children.indexOf(item) + 1;
		console.log("--- child: " + idx);
				
		// calculate
		item.hypA = item.parent.hypA + 'a';
		for (var i=0;i<idx;i++) {
			item.hypA += 'b';
		}
		console.log(item.hypA);

		var r1 = v;
		for (var i=item.hypA.length-1;i>=0;i--) {
			if (item.hypA[i] == 'b') {
				r1 = parser.eval("-(2*i*("+r1+")-("+r1+")+1)/(1+2*i-("+r1+"))");
				console.log("binv: " + r1);
			} else {
				r1 = parser.eval("-("+r1+")");
				console.log("ainv: " + r1);
			}
		}
				
		item.hypC = r1;	
		item.hypX = math.re(item.hypC);
		item.hypY = math.im(item.hypC);
		console.log(item.hypX + "  --  " + item.hypY);
		
		// add children tot he queue
		for (idx in item.children) {
			queue.push(item.children[idx]);
		}
		//break;
	}
});

function generateReg3Verticles() {
	var v = [];
	var radius = 25;
	
	var dVert = 20;
	var dDiag = 20 / Math.sqrt(2);
	
	var center = [50,50];
	var i = 1;
	
	v.push(new Vertex(i++, center[0], center[1], radius));
	
	// top 
	v.push(new Vertex(i++, center[0], center[1] - dVert, radius));
	v.push(new Vertex(i++, center[0] - dDiag, center[1] - dVert - dDiag, radius));
	v.push(new Vertex(i++, center[0] + dDiag * 1.3, center[1] - dVert - dDiag * 0.2, radius));
	
	// left
	v.push(new Vertex(i++, center[0] - dDiag, center[1] + dDiag, radius));
	v.push(new Vertex(i++, center[0] - dDiag, center[1] + dDiag + dVert, radius));
	v.push(new Vertex(i++, center[0] - 2 * dDiag, center[1], radius));
	
	// right
	v.push(new Vertex(i++, center[0] + dDiag, center[1] + dDiag, radius));
	v.push(new Vertex(i++, center[0] + dDiag, center[1] + dDiag + dVert, radius));
	v.push(new Vertex(i++, center[0] + 1.5 * dDiag - dDiag * 0.2, center[1], radius));
	
	return v;
}

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
