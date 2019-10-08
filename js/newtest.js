window.SequenceBraiding = class SequenceBraiding {
	constructor(data, path) {
		this.data = data
		this.path = path
		this.nodes = []
		this.links = []
		this.max_rank = this.path.length * 3
		
		var svgwidth = document.getElementById('braids-container').clientWidth

		this.horizontal_spacing = (svgwidth)/(this.path.length-1)
		this.vertical_spacing = 7
		this.left_padding = 0
		this.top_padding = 80
		this.circle_radius = 3
		this.node_width = 0.2*this.horizontal_spacing

		this.build()
		this.draw()
	}

	get_grid_order(grid){
		var ord = []
		var inverse_index_dict = {}
		var index_dict = []
		var day_index = 0
		for (var i in grid){
			for (var j in grid[i]){
				if (grid[i][j].day == undefined) continue
				if (inverse_index_dict[grid[i][j].seq_index] == undefined) {
					inverse_index_dict[grid[i][j].seq_index] = day_index
					index_dict[day_index] = grid[i][j].seq_index
					day_index++
				}
			}
		}
		for (var i in grid){
			var cur_ord = []
			for (var j in grid[i]){
				if (grid[i][j].day == undefined) continue
				cur_ord.push(inverse_index_dict[grid[i][j].seq_index])
			}
			ord.push(cur_ord)
		}

		return [ord, index_dict, inverse_index_dict]
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
					if ((!a_node.isanchor || !b_node.isanchor) && (a_node.level != 'unknown' && b_node.level != 'unknown') && a_node.level != b_node.level) 
						return levels.indexOf(a_node.level) > levels.indexOf(b_node.level)
					else return ord[r-1].indexOf(a) > ord[r-1].indexOf(b)
				})
			}
		} else {
			for (var r=ord.length-2; r>0; r--){
				ord[r].sort((a,b) => {
					var a_node = grid[r].find(n => n.day[0].Date == index_dict[a])
					var b_node = grid[r].find(n => n.day[0].Date == index_dict[b])
					if ((!a_node.isanchor || !b_node.isanchor) && (a_node.level != 'unknown' && b_node.level != 'unknown') && a_node.level != b_node.level) 
						return levels.indexOf(a_node.level) > levels.indexOf(b_node.level)
					else return ord[r+1].indexOf(a) > ord[r+1].indexOf(b)
				})
			}
		}
		return ord
	}


	apply_ord(ord, grid, index_dict, date_dict){
		for (var i in grid){
			if (ord[i] == undefined) continue
			grid[i] = grid[i].sort((a, b) => ord[i].indexOf(date_dict[a.seq_index]) > ord[i].indexOf(date_dict[b.seq_index]))
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

	wmedian_nodes_left2(ord, date_dict, index_dict, grid){
		var structured_ord = []
		for (var i=0; i<ord.length; i++){
			if (i%2 == 0) {
				structured_ord.push(structured_ord[structured_ord.length-1])
				continue
			}
			var cur_struct = []
			// for (var j=0; j<ord[i].length; j++){
			// 	var cur_node = grid[i].find(n => n.day[0].Date == index_dict[ord[i][j]])
			// 	if (cur_node.isanchor || cur_node.level == 'unknown') cur_struct.push(cur_node)
			// 	else if (cur_struct.find(n => n.g == cur_node.level) == undefined) cur_struct.push({g:cur_node.level, nodes:[cur_node]})
			// 	else cur_struct.find(n => n.g == cur_node.level).nodes.push(cur_node)
			// }
			// for (var j in cur_struct){
			// 	if (cur_struct[j].g == undefined) cur_struct[j].wmean = ord[i-1].indexOf(ord[i-1].find(n => index_dict[n] == cur_struct[j].day[0].Date))
			// 	else {
			// 		cur_struct[j].wmean = 0
			// 		for (var n of cur_struct[j].nodes){
			// 			if (n.day == undefined) continue
			// 			if (n.prev_node.fake_in) n.wmean = ord[i+2].indexOf(ord[i+2].find(nn => index_dict[nn] == n.day[0].Date))
			// 			else n.wmean = ord[i-1].indexOf(ord[i-1].find(nn => index_dict[nn] == n.day[0].Date))
			// 			cur_struct[j].wmean += n.wmean
			// 		}

			// 		cur_struct[j].nodes.sort((a, b) => a.wmean > b.wmean)
			// 		cur_struct[j].wmean = cur_struct[j].nodes[Math.round((cur_struct[j].nodes.length-1)/2)].wmean
			// 	}
			// }

			// cur_struct = cur_struct.sort((a, b) => {
			// 	if (a.g != undefined && b.g != undefined && a.g != b.g) return levels.indexOf(a.g) > levels.indexOf(b.g)
			// 	else return a.wmean > b.wmean
			// })

			structured_ord.push(cur_struct)
		}

		var res_ord = []
		// for (var i in structured_ord){
		// 	var cur_res_ord = []
		// 	for (var j in structured_ord[i]){
		// 		if (structured_ord[i][j].g == undefined) cur_res_ord.push(date_dict[structured_ord[i][j].day[0].Date])
		// 		else for (var k in structured_ord[i][j].nodes){
		// 			cur_res_ord.push(date_dict[structured_ord[i][j].nodes[k].day[0].Date])
		// 		}
		// 	}
		// 	res_ord.push(cur_res_ord)
		// }

		return res_ord
	}

		wmedian_nodes_left(ord, date_dict, index_dict, grid){
		var structured_ord = []
		for (var i=0; i<ord.length; i++){
			var cur_struct = []
			for (var j=0; j<ord[i].length; j++){
				if (grid[i] == undefined) continue
				var cur_node = grid[i].find(n => n.seq_index == index_dict[ord[i][j]])
				if (cur_node.isanchor || cur_node.level == 'unknown') cur_struct.push(cur_node)
				else if (cur_struct.find(n => n.g == cur_node.level) == undefined) cur_struct.push({g:cur_node.level, nodes:[cur_node]})
				else cur_struct.find(n => n.g == cur_node.level).nodes.push(cur_node)
			}

			for (var j in cur_struct){
				if (cur_struct[j].g == undefined) cur_struct[j].wmean = ord[i-1].indexOf(ord[i-1].find(n => index_dict[n] == cur_struct[j].seq_index))
				else {
					cur_struct[j].wmean = 0
					for (var n of cur_struct[j].nodes){
						//if (n.day == undefined) continue
						//if (n.prev_node.fake_in) n.wmean = ord[i+1].indexOf(ord[i+1].find(nn => index_dict[nn] == n.seq_index))
						//else n.wmean = ord[i-1].indexOf(ord[i-1].find(nn => index_dict[nn] == n.seq_index))
						n.wmean = ord[i-1].indexOf(ord[i-1].find(nn => index_dict[nn] == n.seq_index))
						cur_struct[j].wmean += n.wmean
					}

					cur_struct[j].nodes.sort((a, b) => a.wmean > b.wmean)
					cur_struct[j].wmean = cur_struct[j].nodes[Math.round((cur_struct[j].nodes.length-1)/2)].wmean
				}
			}

			cur_struct = cur_struct.sort((a, b) => {
				if (a.g != undefined && b.g != undefined && a.g != b.g) return levels.indexOf(a.g) > levels.indexOf(b.g)
				else return a.wmean > b.wmean
			})

			structured_ord.push(cur_struct)
		}

		var res_ord = []
		for (var i in structured_ord){
			var cur_res_ord = []
			for (var j in structured_ord[i]){
				if (structured_ord[i][j].g == undefined) cur_res_ord.push(date_dict[structured_ord[i][j].seq_index])
				else for (var k in structured_ord[i][j].nodes){
					cur_res_ord.push(date_dict[structured_ord[i][j].nodes[k].seq_index])
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
				var cur_node = grid[i].find(n => n.seq_index == index_dict[ord[i][j]])
				if (cur_node.isanchor || cur_node.level == 'unknown') cur_struct.push(cur_node)
				else if (cur_struct.find(n => n.g == cur_node.level) == undefined) cur_struct.push({g:cur_node.level, nodes:[cur_node]})
				else cur_struct.find(n => n.g == cur_node.level).nodes.push(cur_node)
			}
			for (var j in cur_struct){
				if (ord[i+1] == undefined) continue
				if (cur_struct[j].g == undefined) cur_struct[j].wmean = ord[i+1].indexOf(ord[i+1].find(n => index_dict[n] == cur_struct[j].seq_index))
				else {
					cur_struct[j].wmean = 0
					for (var n of cur_struct[j].nodes){
						if (n.day == undefined) continue
						//if (n.prev_node.fake_in) n.wmean = ord[i+1].indexOf(ord[i+1].find(nn => index_dict[nn] == n.seq_index))
						n.wmean = ord[i+1].indexOf(ord[i+1].find(nn => index_dict[nn] == n.seq_index))
						cur_struct[j].wmean += n.wmean
					}

					cur_struct[j].nodes.sort((a, b) => a.wmean > b.wmean)
					cur_struct[j].wmean = cur_struct[j].nodes[Math.round((cur_struct[j].nodes.length-1)/2)].wmean
				}
			}

			cur_struct = cur_struct.sort((a, b) => {
				if (a.g != undefined && b.g != undefined && a.g != b.g) return levels.indexOf(a.g) > levels.indexOf(b.g)
				else return a.wmean > b.wmean
			})

			//if (i%2 == 1) structured_ord.push(structured_ord[structured_ord.length-1])
			structured_ord.push(cur_struct)
		}
		structured_ord = structured_ord.reverse()

		var res_ord = []
		for (var i in structured_ord){
			var cur_res_ord = []
			for (var j in structured_ord[i]){
				if (structured_ord[i][j].g == undefined) cur_res_ord.push(date_dict[structured_ord[i][j].seq_index])
				else for (var k in structured_ord[i][j].nodes){
					cur_res_ord.push(date_dict[structured_ord[i][j].nodes[k].seq_index])
				}
			}
			res_ord.push(cur_res_ord)
		}

		return res_ord
	}

	sort_nodes_vertically(){
		var grid = []
		var max_iterations = 6
		var max_rank = this.max_rank

		for (var curdepth = 0; curdepth<max_rank; curdepth++){
			if (!this.nodes.some(n => n.depth == curdepth)) continue
			grid[curdepth] = []
			for (var node of this.nodes.filter(n => n.depth == curdepth)) grid[curdepth].push(node)
		}

		for (var c in grid){
			grid[c] = grid[c].sort((a, b) => {
				if (a.level != b.level) return levels.indexOf(a.level) > levels.indexOf(b.level) ? 1 : -1
				else {
					var na = a.incoming_links[0].source
					var nb = b.incoming_links[0].source
					if (grid[c-1] != undefined) return grid[c-1].indexOf(na) > grid[c-1].indexOf(nb) ? 1 : -1
				}
			})
		}

		var initial_order = this.get_grid_order(grid)[0]
		var index_dict = this.get_grid_order(grid)[1]
		var date_dict = this.get_grid_order(grid)[2]
		var initial_crossings = this.count_crossings_from_ord(initial_order)
		console.log(initial_crossings)

		var best_crossings = 100000
		var best_order = initial_order

		for (var i=0; i<max_iterations; i++){

			if (i%2 == 0) var tmpord = this.wmedian_nodes_left(deepClone(best_order), date_dict, index_dict, grid)
			//else var tmpord = this.wmedian_nodes_right(deepClone(best_order), date_dict, index_dict, grid)

			if (this.count_crossings_from_ord(tmpord) < best_crossings){
				best_order = tmpord
				best_crossings = this.count_crossings_from_ord(best_order)
			}
			console.log(best_crossings)
		}

		this.apply_ord(best_order, grid, index_dict, date_dict)

		return grid
	}

	sort_nodes_vertically2(){
		
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
				if (a.level != b.level) return levels.indexOf(a.level) > levels.indexOf(b.level)
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

	add_virtual_nodes(grid){
		var level_heights = {}
		var start_heights = {}

		// define maximum heights for each level
		for (var level of levels){
			var max_height = 0
			for (var r=0; r<=this.max_rank; r++){
				if (grid[r] == undefined) continue
				grid[r] = grid[r].filter(n => !n.fake_in && !n.fake_out)
				if (grid[r].filter(n => (n.level == level) && !n.fake_in && !n.fake_out).length > max_height) {
					max_height = grid[r].filter(n => n.level == level || n.level == 'unknown').length
				}
			}
			level_heights[level] = max_height + 1
		} 

		// define starting heights for each level
		var cur_height = 0
		for (var level of levels){
			start_heights[level] = cur_height
			cur_height += level_heights[level]
		}

		// add virtual blank nodes to make the nodes be at their correct position
		for (var r=0; r<=this.max_rank; r++){
			
			if (grid[r] == undefined) continue
			for (var level of levels){
				var lgroup = grid[r].filter(n => n.level == level)
				var diff = level_heights[level] - lgroup.length
		
				if (lgroup.length == 0) diff = level_heights[level]
				
				for (var i=0; i<diff; i++) {
					if (lgroup.length != 0) {
						grid[r].splice(grid[r].indexOf(lgroup[lgroup.length-1]) + 1, 0, {})
					}
					else {
						grid[r].splice(start_heights[level], 0, {})
					}
				}
			}
		}

		for (var r=0; r<=this.max_rank; r++){
			if (grid[r] == undefined) continue
			var cur_level = levels[0]
			for (var level of levels){
				var group = grid[r].filter(n => n.level == level)
				var firstNode = group[0]
				var lastNode = group[group.length - 1]
				if (firstNode == undefined || level == 'unknown' || firstNode.prev_node.level != firstNode.level) continue
				var diff = grid[r-1].indexOf(firstNode.prev_node) - grid[r].indexOf(firstNode)
				for (var i=0; i<diff; i++){
					grid[r].splice(grid[r].indexOf(firstNode) - 1, 0, {})
					if (grid[r][grid[r].indexOf(lastNode) + 1].level == undefined) grid[r].splice(grid[r].indexOf(lastNode) + 1, 1)
				}
			}
		}
	}

	set_nodes_y(grid){
		// assign node y
		for (var node of this.nodes){
			if (grid[node.depth] == undefined) continue
			else node.y = grid[node.depth].indexOf(node)
		}
	}


	add_node(prevnode, event, next_depth, isanchor, fake_out=false, fake_in=false){
		var new_node = {
			meal: event.type, 
			level: event.level,
			color: isanchor ? 'green' : get_color(event.level),
			incoming_links: [],
			outgoing_links: [], 
			next_node: null,
			prev_node: prevnode,
			day: event.day,
			isanchor: isanchor,
			depth: next_depth,
			fake_out: fake_out,
			fake_in: fake_in,
			seq_index: event.seq_index
		}

		var new_link = {
			source: prevnode,
			target: new_node,
			seq_index: event.seq_index,
			day: event.Date
		}

		prevnode.outgoing_links.push(new_link)
		prevnode.next_node = new_node
		new_node.incoming_links.push(new_link)
		

		this.nodes.push(new_node)
		this.links.push(new_link)

		return new_node
	}

	build(){
		this.source = {depth: 0, incoming_links:[], outgoing_links:[], color:'gray', fake_in:true}
		this.sink = {depth: path.length + 1, incoming_links:[], outgoing_links:[], color:'gray'}
		//this.nodes.push(this.source)

		var count = 0
		for (var sequence of this.data){
			var prevnode = this.source
			for (var event of sequence){
				var index = sequence.indexOf(event)
				var pdepth = prevnode.depth + this.path.slice(1).slice(prevnode.depth, this.path.length).indexOf(this.path.find(n => event.type == n))
				
				// add anchors
				if (pdepth - prevnode.depth >= 0) {
					var diff = pdepth - prevnode.depth;
					for (var ev = 0; ev<diff; ev+=1){
						if (index == 0) prevnode = this.add_node(prevnode, event, pdepth-diff+ev+1, true, false, true)
						else prevnode = this.add_node(prevnode, event, pdepth-diff+ev+1, true, false, false)
					}
				}
				prevnode = this.add_node(prevnode, event, pdepth+1, false)
			}

			// last anchors before sink
			if (prevnode.depth != (this.path.length-1)) {
				var pdepth = (this.path.length-1)
				var diff = pdepth - prevnode.depth;
				for (var ev = 0; ev<diff; ev+=1){
					prevnode = this.add_node(prevnode, event, prevnode.depth+1, true, true)
				}
			}
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
		return this.left_padding + node.depth * this.horizontal_spacing
	}

	draw(){
		this.grid = this.sort_nodes_vertically()
		//this.grid_to_singles()
		this.add_virtual_nodes(this.grid)
		this.set_nodes_y(this.grid)
		
		
		//var svg = d3.select('body').append('svg')
		//    .attr('width', width)
		//    .attr('height', height)

		var svg = d3.select('#braids-container')

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

		for (var r=-1; r<this.max_rank; r++){
			if (this.grid[r] == undefined) continue
			var cur_level = 'very_high'
			var cur_rect_size = 0
			var cur_rect_start_height = 0
			for (var node of this.grid[r]){
				if (node == {}) continue

				if (isNaN(this.get_node_x(node, this.horizontal_spacing))) continue
				svg.append('rect')
					.datum(node)
					.attr('x', this.get_node_x(node, this.horizontal_spacing))
					.attr('y', this.top_padding + node.y*this.vertical_spacing - this.vertical_spacing/2)
					.attr('width', this.node_width)
					.attr('height', this.vertical_spacing) 
					.attr('rx', '5px')
					.attr('fill', node.isanchor ? '#ffffff00' : node.color)
					.attr('opacity', 0.5)
					.on('click', d => console.log(d))
			}

		}

		var daycount = 0
		for (var day of this.data){
			if (day[0] == undefined) continue
			var link_collection = this.links.filter(l => l.day == day[0].Date)
			if (link_collection.length == 0) continue
			var drawpath = []

			var defs = svg.append("defs")
	           
	        var linearGradient = defs.append("linearGradient")
	            .attr("id", "linear-gradient"+daycount)
	            .attr("gradientUnits", "userSpaceOnUse")

	        linearGradient.append("stop")
	            .attr("offset", "0%")
	            .attr("stop-color", '#ffffff00');

			for (var link of link_collection) {
				if (link.source.fake_in && link.target.fake_in) continue
				else if (link.source.fake_out && link.target.fake_out) continue
				else if ((link.source == this.source || link.source.fake_in) && !link.target.fake_in){
					drawpath.push({x: this.get_node_x(link.source, this.horizontal_spacing) + this.horizontal_spacing/2, y: 80 + link.target.y*this.vertical_spacing + Math.random()*0.001})
				} else {
					drawpath.push({x: this.get_node_x(link.source, this.horizontal_spacing), y: 80 + link.source.y*this.vertical_spacing + Math.random()*0.001})
					drawpath.push({x: this.node_width/2 + this.get_node_x(link.source, this.horizontal_spacing), y: 80 + link.source.y*this.vertical_spacing + Math.random()*0.001})
					drawpath.push({x: this.node_width + this.get_node_x(link.source, this.horizontal_spacing), y: 80 + link.source.y*this.vertical_spacing + Math.random()*0.001})
				}

				if (false && link.source.fake_in){
					linearGradient.append("stop")
						.attr('offset', this.get_node_x(link.source, this.horizontal_spacing)*100/(width) + '%')
						.attr('stop-color', '#ffffff00')
				} else if (false && link.target.fake_out){
					linearGradient.append("stop")
						.attr('offset', this.get_node_x(link.target, this.horizontal_spacing)*100/(width) + '%')
						.attr('stop-color', '#ffffff00')
				} else {
					linearGradient.append("stop")
						.attr('offset', 100 * this.get_node_x(link.source, this.horizontal_spacing)/width + '%')
						.attr('stop-color', get_color(link.source.level))

					//linearGradient.append("stop")
					//	.attr('offset', this.get_node_x(link.target, this.horizontal_spacing)*100/(width) + '%')
					//	.attr('stop-color', get_color(link.target.level))
				}

			}

			drawpath.push({x: drawpath[drawpath.length - 1].x + this.horizontal_spacing/2, y: drawpath[drawpath.length - 1].y  + Math.random()*0.001})
			
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
				.attr('x', (d, i) => this.left_padding + e*this.horizontal_spacing + this.node_width/2)
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