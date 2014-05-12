
GraphCanvas = function(normal, hyperbolic) {

	this.normal = normal;
	this.hyperbolic = hyperbolic;
	
	this.normal.width = $(this.normal).parent().innerWidth() * 0.95;
	this.normal.height = this.normal.width / 1.4;
	console.log(this.normal.width);
	this.normalPadleft = (this.normal.width - this.normal.height) / 2;
	this.normalRatio = this.normal.height / 100;
	
	this.normalSelected = null;
	
	this.hyperbolic.width = $(this.hyperbolic).parent().innerWidth() * 0.95;
	this.hyperbolic.height = this.hyperbolic.width / 1.4;
	this.hyperbolicPadleft = (this.hyperbolic.width - this.hyperbolic.height) / 2;
	this.hyperbolicRatio = this.hyperbolic.height / 100;

	this.graph = null;
	
	this.startNode = null;
	this.endNode = null;
}

GraphCanvas.prototype.setGraph = (function(graph) {
	this.graph = graph;
});

GraphCanvas.prototype.normalUnproject = (function(x,y) {
	return [ (x - this.normalPadleft) / this.normalRatio, y / this.normalRatio ];
});

GraphCanvas.prototype.findNormalVertex = (function(sx,sy) {
	
	if (this.graph == null) {
		return;
	}
	
	rp = this.normalUnproject(sx, sy);
	var min = null; var mind = 999999;
	for ( idx in this.graph.verticles ) {
		if ( this.graph.verticles[idx].distanceFromP(rp) < mind ) {
			mind = this.graph.verticles[idx].distanceFromP(rp);
			min = idx;
		}
	}
	if (mind < 3) {
		return this.graph.verticles[min];
	}
});

/* EVENT HANDLERS */

GraphCanvas.prototype.normalMousemove = (function(sx, sy) {
	this.normalSelected = this.findNormalVertex(sx,sy);
	this.draw();
});

GraphCanvas.prototype.dblclick = (function(sx, sy) {
	var f = this.findNormalVertex(sx,sy);
	
	if (f != null) {
		this.graph.calculateSpt(f);
		this.graph.calculateHyperbolicCoordinatesB();
	}
	this.draw();
});

GraphCanvas.prototype.lclick = (function(sx, sy) {
	var f = this.findNormalVertex(sx,sy);
	
	if (f != null) {
		this.startNode = f;
		if (this.endNode != null) {
			this.graph.calculateRoutes(this.startNode, this.endNode);
		}
	}
	this.draw();
});
GraphCanvas.prototype.rclick = (function(sx, sy) {
	var f = this.findNormalVertex(sx,sy);
	if (f != null) {
		this.endNode = f;
		if (this.startNode != null) {
			this.graph.calculateRoutes(this.startNode, this.endNode);
		}
	}
	this.draw();
});

/* DRAWING FUNCTIONS */

GraphCanvas.prototype.draw = (function() {
	this.drawNormal();
	this.drawHyperbolic();
});

GraphCanvas.prototype.drawHyperbolic = (function() {
	
	this.hyperbolic.width = this.hyperbolic.width;
	
	ctx = this.hyperbolic.getContext('2d');
	
	var centX = this.hyperbolic.width / 2;
	var centY = this.hyperbolic.height / 2;
	var radius = this.hyperbolic.height * 0.45;
	
	ctx.beginPath();
	ctx.arc(centX, centY, radius, 0, 2 * Math.PI, false);
	ctx.fillStyle = '#dddddd';
	ctx.fill();
	
	// draw SPT
	
	
	// draw edges
	for ( idx in this.graph.verticles ) {
	
		var vert = graph.verticles[idx];
		if (vert.parent == null) continue;
		
		ctx.beginPath();
		ctx.moveTo(centX + (vert.hypX * radius), centY + (vert.hypY * radius));
		ctx.lineTo(centX + (vert.parent.hypX * radius), centY + (vert.parent.hypY * radius));
		ctx.strokeStyle = 'rgba(200, 200, 200, 100)';
		ctx.stroke();	
	}
	
	// draw connections of the normal selected & highlight it
	if (this.normalSelected) {
		var ns = this.normalSelected;
		for (idx in this.graph.edges) {
			var edge = this.graph.edges[idx];
			if (edge.v != ns && edge.e != ns) continue;
			
			var vert1 = edge.v;
			var vert2 = edge.e;
			
			ctx.beginPath();
			ctx.lineTo(centX + (vert1.hypX * radius), centY + (vert1.hypY * radius));
			ctx.lineTo(centX + (vert2.hypX * radius), centY + (vert2.hypY * radius));
			ctx.strokeStyle = 'rgba(250, 0, 0, 20)';
			ctx.stroke();	
		}
		
		var vert = this.normalSelected;
		ctx.beginPath();
		ctx.arc(centX + (vert.hypX * radius), centY + (vert.hypY * radius), 3, 0, 2 * Math.PI, false);
		ctx.fillStyle = 'yellow';
		ctx.fill();
		ctx.arc(centX + (vert.hypX * radius), centY + (vert.hypY * radius), 5, 0, 2 * Math.PI, false);
		ctx.fillStyle = 'orange';
		ctx.fill();
	}
	
	// draw route
	if ( this.startNode != null && this.endNode != null) {
	
		// hyperbolic route
		var curr = this.startNode;
		while (curr.onNormalRouteTo != null) {
			ctx.beginPath();
			ctx.moveTo(centX + (curr.hypX * radius), centY + (curr.hypY * radius));
			ctx.lineTo(centX + (curr.onNormalRouteTo.hypX * radius), centY + (curr.onNormalRouteTo.hypY * radius));
			ctx.strokeStyle = 'orange';
			ctx.lineWidth = 5;
			ctx.stroke();
			curr = curr.onNormalRouteTo;
		}
	
		// normal route
		var curr = this.startNode;
		while (curr.onHyperbolicRouteTo != null) {
			ctx.beginPath();
			ctx.moveTo(centX + (curr.hypX * radius), centY + (curr.hypY * radius));
			ctx.lineTo(centX + (curr.onHyperbolicRouteTo.hypX * radius), centY + (curr.onHyperbolicRouteTo.hypY * radius));
			ctx.strokeStyle = 'yellow';
			ctx.lineWidth = 3;
			ctx.stroke();
			curr = curr.onHyperbolicRouteTo;
		}
	}
	
	// draw verticles
	for ( idx in this.graph.verticles ) {
	
		var vert = graph.verticles[idx];
		
		ctx.beginPath();
		ctx.arc(centX + (vert.hypX * radius), centY + (vert.hypY * radius), 3, 0, 2 * Math.PI, false);
		if (vert == this.graph.root) {
			ctx.fillStyle = 'red';
		} else if (vert == this.startNode) {
			ctx.arc(centX + (vert.hypX * radius), centY + (vert.hypY * radius), 5, 0, 2 * Math.PI, false);
			ctx.fillStyle = 'blue';
		} else if (vert == this.endNode) {
			ctx.arc(centX + (vert.hypX * radius), centY + (vert.hypY * radius), 5, 0, 2 * Math.PI, false);
			ctx.fillStyle = 'orange';
		} else if (vert.onNormalRoute || vert.onHyperbolicRoute) {
			if (vert.onNormalRoute) {
				ctx.arc(centX + (vert.hypX * radius), centY + (vert.hypY * radius), 10, 0, 2 * Math.PI, false);
				ctx.fillStyle = 'cyan';
			}
			if (vert.onHyperbolicRoute) {
				ctx.arc(centX + (vert.hypX * radius), centY + (vert.hypY * radius), 7, 0, 2 * Math.PI, false);
				ctx.fillStyle = 'orange';
			}
		} else {
			ctx.fillStyle = 'green';
		}
		ctx.fill();
	}
	
});

GraphCanvas.prototype.drawNormal = (function() {
	
	this.normal.width = this.normal.width;
	
	ctx = this.normal.getContext('2d');
	
	if (this.graph == null) {
		return;
	}
	
	if (this.normalSelected) {
		var vert = this.normalSelected;
		ctx.beginPath();
		ctx.arc(this.normalPadleft + vert.normalX * this.normalRatio, vert.normalY * this.normalRatio, vert.radius * this.normalRatio, 0, 2 * Math.PI, false);
		ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
		ctx.fill();
	}
	
	// draw SPT
	for ( idx in this.graph.verticles ) {
		var vert = graph.verticles[idx];
				
		if (vert.parent == null) continue;
		
		ctx.beginPath();
		ctx.moveTo(this.normalPadleft + vert.normalX * this.normalRatio, vert.normalY * this.normalRatio);
		ctx.lineTo(this.normalPadleft + vert.parent.normalX * this.normalRatio, vert.parent.normalY * this.normalRatio);
		ctx.strokeStyle = 'rgba(200, 200, 200, 100)';
		ctx.stroke();
	}
	
	// draw route
	if ( this.startNode != null && this.endNode != null) {
	
		// hyperbolic route
		var curr = this.startNode;
		while (curr.onNormalRouteTo != null) {
			ctx.beginPath();
			ctx.moveTo(this.normalPadleft + curr.normalX * this.normalRatio, curr.normalY * this.normalRatio);
			ctx.lineTo(this.normalPadleft + curr.onNormalRouteTo.normalX * this.normalRatio, curr.onNormalRouteTo.normalY * this.normalRatio);
			ctx.strokeStyle = 'orange';
			ctx.lineWidth = 5;
			ctx.stroke();
			curr = curr.onNormalRouteTo;
		}
	
		// normal route
		var curr = this.startNode;
		while (curr.onHyperbolicRouteTo != null) {
			ctx.beginPath();
			ctx.moveTo(this.normalPadleft + curr.normalX * this.normalRatio, curr.normalY * this.normalRatio);
			ctx.lineTo(this.normalPadleft + curr.onHyperbolicRouteTo.normalX * this.normalRatio, curr.onHyperbolicRouteTo.normalY * this.normalRatio);
			ctx.strokeStyle = 'yellow';
			ctx.lineWidth = 3;
			ctx.stroke();
			curr = curr.onHyperbolicRouteTo;
		}
	}
	
	// draw last layer (vertex dots)
	for ( idx in this.graph.verticles ) {
		var vert = graph.verticles[idx];
		ctx.beginPath();
		ctx.arc(this.normalPadleft + vert.normalX * this.normalRatio, vert.normalY * this.normalRatio, 3, 0, 2 * Math.PI, false);
		if (vert == this.graph.root) {
			ctx.arc(this.normalPadleft + vert.normalX * this.normalRatio, vert.normalY * this.normalRatio, 5, 0, 2 * Math.PI, false);
			ctx.fillStyle = 'red';
		} else if (vert == this.startNode) {
			ctx.arc(this.normalPadleft + vert.normalX * this.normalRatio, vert.normalY * this.normalRatio, 5, 0, 2 * Math.PI, false);
			ctx.fillStyle = 'blue';
		} else if (vert == this.endNode) {
			ctx.arc(this.normalPadleft + vert.normalX * this.normalRatio, vert.normalY * this.normalRatio, 5, 0, 2 * Math.PI, false);
			ctx.fillStyle = 'orange';
		} else {
			ctx.fillStyle = 'green';
		}
		if (vert.onNormalRoute || vert.onHyperbolicRoute) {
			if (vert.onNormalRoute) {
				ctx.beginPath();
				ctx.arc(this.normalPadleft + vert.normalX * this.normalRatio, vert.normalY * this.normalRatio, 15, 0, 2 * Math.PI, false);
				ctx.fillStyle = 'purple';
			}
			if (vert.onHyperbolicRoute) {
				ctx.beginPath();
				ctx.arc(this.normalPadleft + vert.normalX * this.normalRatio, vert.normalY * this.normalRatio, 7, 0, 2 * Math.PI, false);
				ctx.fillStyle = 'orange';
			}
		}
		ctx.fill();
	}
});