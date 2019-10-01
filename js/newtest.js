window.SequenceBraiding = class SequenceBraiding {
	constructor(data, path) {
		this.data = data
		this.path = path
		this.nodes = []
		this.links = []
		this.max_rank = this.path.length * 3
		
		this.horizontal_spacing = .9*window.innerWidth/(1.2*this.path.length)
		this.vertical_spacing = 8
		this.left_padding = 10
		this.top_padding = 80
		this.circle_radius = 3
		this.node_width = 0.3*this.horizontal_spacing

		this.build()
		this.draw()
	}

	get_grid_order(grid){
		var ord = []
		var date_dict = {}
		var index_dict = []
		var day_index = 0
		for (var i in grid){
			for (var j in grid[i]){
				if (grid[i][j].day == undefined) continue
				if (date_dict[grid[i][j].day[0].Date] == undefined) {
					date_dict[grid[i][j].day[0].Date] = day_index
					index_dict[day_index] = grid[i][j].day[0].Date
					day_index++
				}
			}
		}
		for (var i in grid){
			var cur_ord = []
			for (var j in grid[i]){
				if (grid[i][j].day == undefined) continue
				cur_ord.push(date_dict[grid[i][j].day[0].Date])
			}
			ord.push(cur_ord)
		}

		return [ord, index_dict, date_dict]
	}

	count_crossings_from_ord(ord){
		var crossings = 0
		for (var i=0; i<ord.length-1; i++){
			for (var j=0; j<ord[i].length; j++){
				for (var k=j+1; k<ord[i].length; k++){
					if (ord[i+1].indexOf(ord[i][j]) > ord[i+1].indexOf(ord[i][k])) crossings += 1
				}
			}
		}
		return crossings
	}


	wmedian(ord, i, max_rank, index_dict, grid){
		if (i%2 == 0){
			for (var r=2; r<ord.length; r++){
				ord[r] = ord[r].sort((a,b) => {
					var a_node = grid[r].find(n => n.day[0].Date == index_dict[a])
					var b_node = grid[r].find(n => n.day[0].Date == index_dict[b])
					if ((!a_node.isanchor || !b_node.isanchor) && (a_node.glucose_level != 'unknown' && b_node.glucose_level != 'unknown') && a_node.glucose_level != b_node.glucose_level) 
						return glucose_levels.indexOf(a_node.glucose_level) > glucose_levels.indexOf(b_node.glucose_level)
					else return ord[r-1].indexOf(a) > ord[r-1].indexOf(b)
				})
			}
		} else {
			for (var r=ord.length-2; r>0; r--){
				ord[r].sort((a,b) => {
					var a_node = grid[r].find(n => n.day[0].Date == index_dict[a])
					var b_node = grid[r].find(n => n.day[0].Date == index_dict[b])
					if ((!a_node.isanchor || !b_node.isanchor) && (a_node.glucose_level != 'unknown' && b_node.glucose_level != 'unknown') && a_node.glucose_level != b_node.glucose_level) 
						return glucose_levels.indexOf(a_node.glucose_level) > glucose_levels.indexOf(b_node.glucose_level)
					else return ord[r+1].indexOf(a) > ord[r+1].indexOf(b)
				})
			}
		}
		return ord
	}


	wmedian_nodes(ord, i, max_rank, index_dict, date_dict, grid){
		node_ord = []
		for (var r=1; r<ord.length; r++){

		}
	}


	apply_ord(ord, grid, index_dict, date_dict){
		for (var i in grid){
			grid[i] = grid[i].sort((a, b) => ord[i].indexOf(date_dict[a.day[0].Date]) > ord[i].indexOf(date_dict[b.day[0].Date]))
		}
	}



	move(arr, old_index, new_index) {
	    while (old_index < 0) {
	        old_index += arr.length;
	    }
	    while (new_index < 0) {
	        new_index += arr.length;
	    }
	    if (new_index >= arr.length) {
	        var k = new_index - arr.length;
	        while ((k--) + 1) {
	            arr.push(undefined);
	        }
	    }
	     arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);  
	   return arr;
	}

	wmedian_nodes_left(ord, date_dict, index_dict, grid){
		var structured_ord = []
		for (var i=0; i<ord.length; i++){
			if (i%2 == 0) {
				structured_ord.push(structured_ord[structured_ord.length-1])
				continue
			}
			var cur_struct = []
			for (var j=0; j<ord[i].length; j++){
				var cur_node = grid[i].find(n => n.day[0].Date == index_dict[ord[i][j]])
				if (cur_node.isanchor || cur_node.glucose_level == 'unknown') cur_struct.push(cur_node)
				else if (cur_struct.find(n => n.g == cur_node.glucose_level) == undefined) cur_struct.push({g:cur_node.glucose_level, nodes:[cur_node]})
				else cur_struct.find(n => n.g == cur_node.glucose_level).nodes.push(cur_node)
			}
			for (var j in cur_struct){
				if (cur_struct[j].g == undefined) cur_struct[j].wmean = ord[i-1].indexOf(ord[i-1].find(n => index_dict[n] == cur_struct[j].day[0].Date))
				else {
					cur_struct[j].wmean = 0
					for (var n of cur_struct[j].nodes){
						if (n.day == undefined) continue
						if (n.prev_node.fake_in) n.wmean = ord[i+2].indexOf(ord[i+2].find(nn => index_dict[nn] == n.day[0].Date))
						else n.wmean = ord[i-1].indexOf(ord[i-1].find(nn => index_dict[nn] == n.day[0].Date))
						cur_struct[j].wmean += n.wmean
					}

					cur_struct[j].nodes.sort((a, b) => a.wmean > b.wmean)
					cur_struct[j].wmean = cur_struct[j].nodes[Math.round((cur_struct[j].nodes.length-1)/2)].wmean
				}
			}

			cur_struct = cur_struct.sort((a, b) => {
				if (a.g != undefined && b.g != undefined && a.g != b.g) return glucose_levels.indexOf(a.g) > glucose_levels.indexOf(b.g)
				else return a.wmean > b.wmean
			})

			structured_ord.push(cur_struct)
		}

		var res_ord = []
		for (var i in structured_ord){
			var cur_res_ord = []
			for (var j in structured_ord[i]){
				if (structured_ord[i][j].g == undefined) cur_res_ord.push(date_dict[structured_ord[i][j].day[0].Date])
				else for (var k in structured_ord[i][j].nodes){
					cur_res_ord.push(date_dict[structured_ord[i][j].nodes[k].day[0].Date])
				}
			}
			res_ord.push(cur_res_ord)
		}

		return res_ord
	}

	wmedian_nodes_right(ord, date_dict, index_dict, grid){
		var structured_ord = []
		for (var i=ord.length-1; i>-1; i--){
			var cur_struct = []
			for (var j=0; j<ord[i].length; j++){
				var cur_node = grid[i].find(n => n.day[0].Date == index_dict[ord[i][j]])
				if (cur_node.isanchor || cur_node.glucose_level == 'unknown') cur_struct.push(cur_node)
				else if (cur_struct.find(n => n.g == cur_node.glucose_level) == undefined) cur_struct.push({g:cur_node.glucose_level, nodes:[cur_node]})
				else cur_struct.find(n => n.g == cur_node.glucose_level).nodes.push(cur_node)
			}
			for (var j in cur_struct){
				if (ord[i+1] == undefined) continue
				if (cur_struct[j].g == undefined) cur_struct[j].wmean = ord[i+1].indexOf(ord[i+1].find(n => index_dict[n] == cur_struct[j].day[0].Date))
				else {
					cur_struct[j].wmean = 0
					for (var n of cur_struct[j].nodes){
						if (n.day == undefined) continue
						//if (n.prev_node.fake_in) n.wmean = ord[i+1].indexOf(ord[i+1].find(nn => index_dict[nn] == n.day[0].Date))
						n.wmean = ord[i+1].indexOf(ord[i+1].find(nn => index_dict[nn] == n.day[0].Date))
						cur_struct[j].wmean += n.wmean
					}

					cur_struct[j].nodes.sort((a, b) => a.wmean > b.wmean)
					cur_struct[j].wmean = cur_struct[j].nodes[Math.round((cur_struct[j].nodes.length-1)/2)].wmean
				}
			}

			cur_struct = cur_struct.sort((a, b) => {
				if (a.g != undefined && b.g != undefined && a.g != b.g) return glucose_levels.indexOf(a.g) > glucose_levels.indexOf(b.g)
				else return a.wmean > b.wmean
			})

			if (i%2 == 1) structured_ord.push(structured_ord[structured_ord.length-1])
			else structured_ord.push(cur_struct)
		}
		structured_ord = structured_ord.reverse()

		var res_ord = []
		for (var i in structured_ord){
			var cur_res_ord = []
			for (var j in structured_ord[i]){
				if (structured_ord[i][j].g == undefined) cur_res_ord.push(date_dict[structured_ord[i][j].day[0].Date])
				else for (var k in structured_ord[i][j].nodes){
					cur_res_ord.push(date_dict[structured_ord[i][j].nodes[k].day[0].Date])
				}
			}
			res_ord.push(cur_res_ord)
		}

		return res_ord
	}

	sort_nodes_vertically(){
		
		var grid = {}
		var max_iterations = 6
		var max_rank = this.max_rank

		for (var d = -1; d<=max_rank; d++){
			var curdepth = d
			if (!this.nodes.some(n => n.depth == curdepth)) continue
			grid[curdepth] = []
			for (var node of this.nodes.filter(n => n.depth == curdepth)) grid[curdepth].push(node)
		}

		for (var c in grid){
			grid[c] = grid[c].sort((a, b) => {
				if (a.glucose_level != b.glucose_level) return glucose_levels.indexOf(a.glucose_level) > glucose_levels.indexOf(b.glucose_level)
				else {
					var na = a.incoming_links[0].source
					var nb = b.incoming_links[0].source
					return grid[c-1].indexOf(na) > grid[c-1].indexOf(nb)
				}
			})
		}

		var initial_order = this.get_grid_order(grid)[0]
		var index_dict = this.get_grid_order(grid)[1]
		var date_dict = this.get_grid_order(grid)[2]
		var initial_crossings = this.count_crossings_from_ord(initial_order)
		var best_crossings = 100000
		var best_order = initial_order

		for (var i=0; i<max_iterations; i++){

			if (i%2 == 0) var tmpord = this.wmedian_nodes_left(deepClone(best_order), date_dict, index_dict, grid)
			else var tmpord = this.wmedian_nodes_right(deepClone(best_order), date_dict, index_dict, grid)

			if (this.count_crossings_from_ord(tmpord) < best_crossings){
				best_order = tmpord
				best_crossings = this.count_crossings_from_ord(best_order)
			}
		}

		this.apply_ord(best_order, grid, index_dict, date_dict)

		return grid
	}


	set_nodes_y(grid){

		var level_heights = {}
		var start_heights = {}

		for (var level of glucose_levels){
			var max_height = 0
			for (var r=0; r<this.max_rank; r++){
				if (grid[r] == undefined) continue
				if (grid[r].filter(n => (n.glucose_level == level || n.glucose_level == 'unknown') && !n.fake_in).length > max_height) max_height = grid[r].filter(n => n.glucose_level == level || n.glucose_level == 'unknown').length
			}
			level_heights[level] = max_height + 1
		} 

		var cur_height = 0
		for (var level of glucose_levels){
			start_heights[level] = cur_height
			cur_height += level_heights[level]
		}

		for (var r=0; r<this.max_rank; r++){
			if (grid[r] == undefined) continue
			for (var level of glucose_levels){
				var diff = level_heights[level] - grid[r].filter(n => n.glucose_level == level).length
				for (var i=0; i<diff; i++){
					grid[r].splice(grid[r].filter(n => n.glucose_level == level).length + start_heights[level], 0, {})
				}
			}
		}

		for (var r=2; r<this.max_rank; r++){
			if (grid[r] == undefined) continue
			var cur_level = 'very_high'	
			for (var level of glucose_levels){
				var firstNode = grid[r].find(n => n.glucose_level == level)
				if (firstNode == undefined || level == 'unknown' || firstNode.prev_node.glucose_level != firstNode.glucose_level) continue
				var diff = grid[r-1].indexOf(firstNode.prev_node) - grid[r].indexOf(firstNode)
				for (var i=0; i<diff; i++){
					grid[r].splice(grid[r].indexOf(firstNode) - 1, 0, {})
				}
			}
		}

		for (var node of this.nodes){
			if (grid[node.depth] == undefined) continue
			node.y = grid[node.depth].filter(n => !n.fake_in && !n.fake_out).indexOf(node)
		}
	}


	add_node(prevnode, day, index, next_depth, isanchor, fake_out=false, fake_in=false){
		var new_node = {
			meal: day[index].Meal, 
			glucose: parseFloat(day[index].Glucose), 
			glucose_level: get_glucose_level(parseFloat(day[index].Glucose)),
			color: isanchor ? 'green' :  get_color(get_glucose_level(parseFloat(day[index].Glucose))),
			opacity: 1,
			incoming_links: [],
			outgoing_links: [], 
			next_node: null,
			prev_node: prevnode,
			day: day,
			isanchor: isanchor,
			depth: next_depth,
			fake_out: fake_out,
			fake_in: fake_in
		}

		var new_node2 = {
			meal: day[index].Meal, 
			glucose: parseFloat(day[index].Glucose), 
			glucose_level: get_glucose_level(parseFloat(day[index].Glucose)),
			color: isanchor ? 'green' :  get_color(get_glucose_level(parseFloat(day[index].Glucose))),
			opacity: 0.5,
			incoming_links: [],
			outgoing_links: [], 
			prev_node: new_node,
			next_node: null,
			day: day,
			isanchor: isanchor,
			depth: next_depth + 1,
			fake_out: fake_out,
			fake_in: fake_in
		}

		var new_link = {
			source: prevnode,
			target: new_node,
			day: day[0].Date
		}

		var new_link2 = {
			source: new_node,
			target: new_node2,
			day: day[0].Date
		}

		prevnode.outgoing_links.push(new_link)
		prevnode.next_node = new_node

		new_node.incoming_links.push(new_link)
		new_node.outgoing_links.push(new_link2)
		new_node.next_node = new_node2
		new_node2.incoming_links.push(new_link2)
		

		this.nodes.push(new_node)
		this.nodes.push(new_node2)
		this.links.push(new_link)
		this.links.push(new_link2)

		return new_node2
	}

	build(){
		this.source = {depth: 0, incoming_links:[], outgoing_links:[], glucose:-1, color:'gray', fake_in:true}
		this.sink = {depth: path.length + 1, incoming_links:[], outgoing_links:[], glucose:-1, color:'gray'}
		this.nodes.push(this.source)

		var count = 0
		for (var day of days_iterator(data)){
			day = day.filter(d => d.Meal.length >= 1 && d.Glucose != '')
			if (day.length == 0) continue
			var prevnode = this.source
			for (var index in day){
				var pdepth = prevnode.depth + this.path.slice((prevnode.depth/2) + 1, this.path.length).indexOf(this.path.find(n => day[index].Meal == n))*2
				if (pdepth - prevnode.depth >= 2) {
					var diff = pdepth - prevnode.depth;
					for (var ev = 0; ev<diff; ev+=2){
						if (index == 0) prevnode = this.add_node(prevnode, day, index, pdepth-diff+ev+1, true, false, true)
						else prevnode = this.add_node(prevnode, day, index, pdepth-diff+ev+1, true, false, false)
					}
				}
				prevnode = this.add_node(prevnode, day, index, pdepth+1, false)
			}

			if (prevnode.depth != (this.path.length-1)*2) {
				var pdepth = (this.path.length-1) * 2
				var diff = pdepth - prevnode.depth;
				for (var ev = 0; ev<diff; ev+=2){
					prevnode = this.add_node(prevnode, day, index, prevnode.depth+1, true, true)
				}
			}
			
			if (count>=numDays-1) break
			else count++
		}
	}

	count_crossings(grid){
		var crossings = 0
		for (var d=0; d<this.path.length * 10; d++){
			var pcol = grid[d]
			var ncol = grid[d+1]
			if (ncol == undefined) break

			for (var n in pcol){
				var next_node_index = ncol.indexOf(pcol[n].next_node)
				for (var n2 in pcol){
					if (n == n2) continue
					var next_node2_index = ncol.indexOf(pcol[n2].next_node)
					if (n > n2) {
						if (next_node_index < next_node2_index) crossings++
					} else if (n < n2) {
						if (next_node_index > next_node2_index) crossings++
					}
				}
			}
		}
		return crossings/2
	}

	get_node_x(node){
		return this.left_padding + (node.depth % 2 == 1 ? this.horizontal_spacing*0.4 + node.depth * this.horizontal_spacing : node.depth * (this.horizontal_spacing) - this.horizontal_spacing*0.4)
	}

	draw(){

		this.grid = this.sort_nodes_vertically()
		this.set_nodes_y(this.grid)

		var svg = d3.select('body').append('svg')
		    .attr('width', window.innerWidth)
		    .attr('height', height*3)

		var lineGen = d3.line()
        	.x(function(d) { return d.x })
        	.y(function(d) { return d.y })
        	.curve(d3.curveCatmullRom.alpha(1))

		// for (var node of this.nodes){
		// 	if (node.isanchor) continue
		// 	var c = svg.append('circle')
		// 		.datum(node)
		// 		.attr('cx', this.get_node_x(node))
		// 		.attr('cy', (d, i) => this.top_padding + node.y * this.vertical_spacing)
		// 		.attr('r', this.circle_radius)
		// 		.attr('fill', (d, i) => node.color)
		// 		.attr('opacity', node.opacity)
		// 		.on('click', (d, i) => console.log(d))
		// }

		for (var r=-1; r<this.max_rank; r+=2){
			if (this.grid[r] == undefined) continue
			var cur_glucose_level = 'very_high'
			var cur_rect_size = 0
			var cur_rect_start_height = 0
			for (var node of this.grid[r]){
				if (node == {} || node.isanchor) continue

				if (isNaN(this.get_node_x(node, this.horizontal_spacing))) continue
				svg.append('rect')
					.attr('x', this.get_node_x(node, this.horizontal_spacing))
					.attr('y', this.top_padding + node.y*this.vertical_spacing - this.vertical_spacing/2)
					.attr('width', this.node_width)
					.attr('height', this.vertical_spacing) 
					.attr('rx', '10px')
					.attr('fill', node.color)
					.attr('opacity', 0.5)
			}

		}

		var daycount = 0
		for (var day of days_iterator(data)){
			if (day[0] == undefined) continue
			var link_collection = this.links.filter(l => l.day == day[0].Date)
			if (link_collection.length == 0) continue
			var drawpath = []

			var linearGradient = svg.append("defs")
	            .append("linearGradient")
	            .attr("id", "linear-gradient"+daycount)

	        linearGradient.append("stop")
	            .attr("offset", "0%")
	            .attr("stop-color", '#ffffff00');

	        var linkcount = 0
			for (var link of link_collection) {
				if (link.source != this.source)
					drawpath.push({x: this.get_node_x(link.source, this.horizontal_spacing), y: 80 + link.source.y*this.vertical_spacing + Math.random()*0.001})
				else {
					drawpath.push({x: this.get_node_x(link.source, this.horizontal_spacing), y: 80 + link.target.y*this.vertical_spacing + Math.random()*0.001})
				}
				
				if (link.source.fake_in){

					linearGradient.append("stop")
						.attr('offset', (linkcount + 1.7)*(100/(2*this.path.length - 2)) + '%')
						.attr('stop-color', '#ffffff00')
				} else if (link.target.fake_out){

					linearGradient.append("stop")
						.attr('offset', (linkcount+0.4)*(100/(2*this.path.length - 2)) + '%')
						.attr('stop-color', '#ffffff00')
				} else {
					linearGradient.append("stop")
						.attr('offset', (linkcount + 0.8)*(100/(2*this.path.length - 2)) + '%')
						.attr('stop-color', get_color(link.target.glucose_level))
				}

				linkcount++
			}
			
			var p = svg.append('path')
				.attr('id', 'day_' + daycount)
				.attr('d', lineGen(drawpath))
				.style('stroke', "url(#linear-gradient"+daycount+")")
				.style('stroke-width', this.vertical_spacing*0.3)
				.attr('fill', '#ffffff00')
				.on('mouseover', function (d){
					d3.select(this).style('stroke', 'black')
				})
				.on('mouseout', function(d){
					d3.select(this).style('stroke', "url(#linear-gradient"+this.id.split("_")[1]+")")
				})

			daycount++
		}

		for (var e in this.path){
			var t = svg.append('text')
				.attr('y', 40)
				.attr('x', (d, i) => this.left_padding + e*this.horizontal_spacing*1.9)
				.attr('text-anchor', 'middle')
				.attr('font-family', 'Arial')
				.attr('font-size', '0.8em')
				.attr('fill', 'black')
				.text(this.path[e])
		}
	}
}

var line = d3.line()
    .x(function(d) { return d.x })
    .y(function(d) { return d.y });