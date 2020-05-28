window.SequenceBraiding = class SequenceBraiding {
	constructor(data, svgname, opt={}) {

		this.opt = this.fill_opt(opt)

		// add seq number to data
		this.data = data.slice(0, opt.numSequences)
		this.data.forEach(a => a.forEach(b => b.seq_index == undefined ? b.seq_index = this.data.indexOf(a) : b.seq_index = b.seq_index))

		// figure out path and levels
		this.path = opt.path ? opt.path : this.find_path(this.data, opt)
		if (!opt.pairwise_align_levels) this.levels = opt.levels ? opt.levels : this.find_levels(this.data)
		else this.levels = opt.levels ? opt.levels : this.dna_levels(this.data)

		this.nodes = []
		this.links = []
		this.max_rank = this.path.length * 3
		this.svgname = svgname

		this.svg_index = Array.prototype.slice.call(document.getElementsByTagName('svg')).indexOf(document.getElementById(svgname))
		this.svg = d3.select('#' + this.svgname)

		this.svg.attr('width', this.opt.svg_width).attr('height', this.opt.height)

		var svgwidth = document.getElementById(this.svgname).clientWidth
		var svgheight = document.getElementById(this.svgname).clientHeight

		this.build()
		this.cleanup(this.opt.minEventPerColThreshold)

		// drawing variables
		if (this.opt.horizontal_spacing == undefined) this.horizontal_spacing = (this.opt.width == '100%' ? svgwidth*0.90/(this.path.length-2) : (this.opt.width*0.90)/(this.path.length-2))
		else this.horizontal_spacing = this.opt.horizontal_spacing
		if (this.opt.vertical_spacing == undefined) this.vertical_spacing = Math.min(Math.max(svgheight/(this.data.length*2), 1), 12);
		else this.vertical_spacing = opt.vertical_spacing
		this.node_width = this.opt.node_width_factor*this.horizontal_spacing

		this.grid = this.sort_nodes_vertically(this.opt.animate)
		this.last_cleanup()
		this.add_virtual_nodes(this.grid)
		this.set_nodes_y(this.grid)

		if (this.opt.guidelines) this.draw_guidelines()

		if (this.opt.animate){
			this.position_links(this.opt.max_iterations*250)
			this.position_nodes(this.opt.max_iterations*250)
		} else this.draw()

		this.add_path_text()
		if (this.opt.show_seq_names) this.show_seq_names()
	}

	fill_opt(opt){
		const original_opt = {
				// special features
		    guidelines: true,
		    animate: false,
				colorbysequence: false,
				forceLevelName: false,
				verbose_stats: false,
				verbose_ord: true,
				formulate_ilp: false,
				retrieve_ilp: false,

				// graph building variables
		    minEventPerColThreshold: 1,
		    numSequences: 100,
				max_iterations: 20,

				// graphical representation
				height: 400,
		    width: '100%',
				svg_width: '100%',

				link_opacity: 1,
				node_width_factor: 0.2,
				link_stroke_width: 4,
				padding: {top: 40, left: 40},
				colorscheme: ["#E32551", "#F07C19", "#029DAF", "#FFC219", "#cd5b43"],
				fontSize: '0.9em',
				catmullromvalue: 1,
				path_text_y: 10,

				// force path and/or levels
				path: undefined,
		    levels: undefined,
				pairwise_align_levels: false, // use pairwise alignment to get sequence of levels

				pairwise_alignment_vars: {
					MATCH_SCORE: 100,
			    MISMATCH_SCORE: -10,
			    BEGIN_GAP_PENALTY: 2,
			    GAP_PENALTY: 1,
			    END_GAP_PENALTY: 2,
				}
		}

		for (var field in original_opt){
			if (opt[field] == undefined) opt[field] = original_opt[field]
		}

		return opt
	}

	show_seq_names(){
		let named = []
		for (var j in this.grid){
			if (this.grid[j] == undefined) continue
			for (var i of this.grid[j]){
				if (i.seq_index != undefined) {
					let seq_name = this.data[i.seq_index][0]['seq_name']
					if (named.indexOf(seq_name) == -1){
						named.push(seq_name)
						this.svg.append('text')
							.text(seq_name)
							.attr('y', i.y*this.vertical_spacing + this.opt.padding.top + this.opt.link_stroke_width)
							.attr('x', j*this.horizontal_spacing - this.node_width)
							.attr('font-size', 'x-small')
							.attr('text-anchor', 'end')
							.attr('stroke', 'white')
							.attr('stroke-width', 5)
						this.svg.append('text')
							.text(seq_name)
							.attr('y', i.y*this.vertical_spacing + this.opt.padding.top + this.opt.link_stroke_width)
							.attr('x', j*this.horizontal_spacing - this.node_width)
							.attr('font-size', 'x-small')
							.attr('text-anchor', 'end')
					}
				}
			}
		}
	}


	last_cleanup(){
		var lastcol = this.grid[this.grid.length - 2]
		var prevlastcol = this.grid[this.grid.length - 3]

		//if (lastcol == undefined) return
		lastcol.sort((a, b) => {
			if (!a.isanchor && !b.isanchor && a.level == b.level){
				return prevlastcol.indexOf(a.prev_node) < prevlastcol.indexOf(b.prev_node) ? -1 : 1
			}
		})

		var firstcol = this.grid[1]
		var nextfirstcol = this.grid[2]
		firstcol.sort((a, b) => {
			if (!a.isanchor && !b.isanchor && a.level == b.level){
				return nextfirstcol.indexOf(a.next_node) < nextfirstcol.indexOf(b.next_node) ? -1 : 1
			}
		})
	}


	dna_levels(data_sequences){
		var m_dict = {}
	    var index_dict = {}

	    var count = 0
	    for (var i in data_sequences){
	        for (var j of data_sequences[i]){
	            if (m_dict[j.level] == undefined) {m_dict[j.level] = String.fromCharCode(parseInt(count) + 65); count++}
	        }
	    }

	    for (var j in m_dict) index_dict[m_dict[j]] = j

	    var char_sequences = []
	    for (var day of data_sequences){
	        day = day.filter(d => d.level.length > 1)

	        var res_str = ""
	        for (var m of day) res_str += m_dict[m.level]
	        char_sequences.push(res_str)
	    }

	    var seq = pairwiseAlignDna(char_sequences, this.opt.pairwise_alignment_vars)

	    var res = []
	    for (var i in seq){res.push(index_dict[seq[i]])}
	    res = [... new Set(res)]

	    return res
	}


	find_path(data_sequences, opt){
	    var m_dict = {}
	    var index_dict = {}

	    var count = 0
	    for (var i in data_sequences){
	        for (var j of data_sequences[i]){
	            if (m_dict[j.type] == undefined) {m_dict[j.type] = String.fromCharCode(parseInt(count) + 65); count++}
	        }
	    }

	    for (var j in m_dict) index_dict[m_dict[j]] = j

	    var char_sequences = []
	    for (var day of data_sequences){
	        day = day.filter(d => d.type.length > 1)

	        var res_str = ""
	        for (var m of day) res_str += m_dict[m.type]
	        char_sequences.push(res_str)
	    }

	    var seq = pairwiseAlignDna(char_sequences, opt)

	    var res = []
	    for (var i in seq){res.push(index_dict[seq[i]])}

	    res.unshift('source')
	    res.push('sink')

	    return res
	}

	find_levels(data){
		let lvl = []
		data.forEach(s => s.forEach(e => lvl.includes(e.level) ? '' : lvl.push(e.level)))
		return lvl
	}

	get_color(event){
		if (this.opt.colorbysequence) {
			return this.opt.colorscheme[event.seq_index % this.opt.colorscheme.length]
		} else return this.opt.colorscheme[this.levels.indexOf(event.level)  % this.opt.colorscheme.length]
	}

	draw_guidelines(){
		var line = d3.line()
			.x(d => d['x'])
			.y(d => d['y']);

		for (var level of this.levels){
			this.svg.append('path')
				.attr('class', 'level-guideline')
				.attr('stroke', '#33333322')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', 5,5)
				.attr('d', line([
					{x: 0, y: this.start_heights[level]*this.vertical_spacing + this.opt.padding.top},
					{x: document.getElementById(this.svgname).clientWidth, y: this.start_heights[level]*this.vertical_spacing + this.opt.padding.top}]))

			// level names displayed on the column on the left
			if (this.nodes.filter(n => n.level == level).length > 0 && (this.data.length < 30 || this.opt.forceLevelName)){
				let translatey = (this.start_heights[level] + this.level_heights[level]*.5)*this.vertical_spacing + this.opt.padding.top + this.vertical_spacing*.5
				let glvlname = this.svg.append('g')
					.attr('transform', 'translate(5, '+ translatey +')')
					.attr('class', 'lvlname')

				glvlname.append('circle')
				.attr('cx', 0)
				.attr('cy', - 5)
				.attr('r', 4)
				.attr('fill', this.opt.colorscheme[this.levels.indexOf(level)%this.opt.colorscheme.length])

				glvlname.append('text')
				.attr('x', 7)
				.attr('font-size', this.opt.fontSize)
				.attr('fill', '#555')
				.attr('font-family', 'Arial')
				//.attr('y', this.start_heights[level]*this.vertical_spacing + this.opt.padding.top + this.vertical_spacing*1.5)
				.text(level)
			}
		}
	}

	cleanup(threshold){
		do {
			var found = false
			for (var i in this.path){
				if (this.path[i] == 'source' || this.path[i] == 'sink') continue
				var ngroup = this.nodes.filter(n => n.depth == i && !n.isanchor)
				if (ngroup.length < threshold) {
					this.path.splice(i, 1)
					this.nodes = []
					this.links = []
					found = true
					break
				}
			}
			if (found) this.build()
		} while (found)
	}

	get_grid_order(grid){
		var ord = []
		var inverse_index_dict = {}
		var index_dict = []
		let lvl_dict = []

		var day_index = 0

		// for each rank
		for (var i in grid){
			lvl_dict[i] = []
			// for each node in that rank
			for (var j in grid[i]){
				lvl_dict[i].push(grid[i][j].level)
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
				cur_ord.push(inverse_index_dict[grid[i][j].seq_index])
			}
			ord.push(cur_ord)
		}

		return [ord, index_dict, inverse_index_dict, lvl_dict]
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

	apply_ord(ord, grid, index_dict, date_dict){
		for (var i in grid){
			if (ord[i] == undefined) continue
			grid[i] = grid[i].sort((a, b) => ord[i].indexOf(date_dict[a.seq_index]) > ord[i].indexOf(date_dict[b.seq_index]) ? 1 : -1)
		}
	}

	apply_ord_for_ilp(ord, grid, index_dict, date_dict){
		for (var i in grid){
			if (ord[i-1] == undefined) continue
			grid[i] = grid[i].sort((a, b) => ord[i-1].indexOf(date_dict[a.seq_index]) > ord[i-1].indexOf(date_dict[b.seq_index]) ? 1 : -1)
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

	gen_cluster(ord, i, index_dict, grid){
		if (grid[i] == undefined) return []
		var cluster = []
			for (var j=0; j<ord[i].length; j++){
				var cur_node = grid[i].find(n => n.seq_index == index_dict[ord[i][j]] && !(n.fake_in || n.fake_out))
				if (cur_node == undefined) continue
				if (cur_node.isanchor || cur_node.level == 'unknown') cluster.push(cur_node)
				else if (cluster.find(n => n.g == cur_node.level) == undefined) cluster.push({g:cur_node.level, nodes:[cur_node]})
				else cluster.find(n => n.g == cur_node.level).nodes.push(cur_node)
			}
		return cluster
	}

	structured_to_normal_ord(structured_ord, date_dict){
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

	wmedian_nodes_left(ord, date_dict, index_dict, grid){
		var structured_ord = []
		for (var i=0; i<ord.length; i++){
			var cluster = this.gen_cluster(ord, i, index_dict, grid)

			for (var j in cluster){
				if (cluster[j].g == undefined) cluster[j].wmean = ord[i-1].indexOf(ord[i-1].find(n => index_dict[n] == cluster[j].seq_index))
				else {
					cluster[j].wmean = 0
					for (var n of cluster[j].nodes){
						n.wvalue = ord[i-1].indexOf(ord[i-1].find(nn => index_dict[nn] == n.seq_index))
						cluster[j].wmean += n.wvalue
					}

					cluster[j].nodes.sort((a, b) => this.within_cluster_sort(a, b, 'left', ord, date_dict, i))
					cluster[j].wmean = cluster[j].wmean / cluster[j].nodes.length
				}
			}

			cluster = cluster.sort((a, b) => this.general_cluster_sort(a, b))

			structured_ord.push(cluster)
		}

		return this.structured_to_normal_ord(structured_ord, date_dict)
	}

	wmedian_nodes_right(ord, date_dict, index_dict, grid){
		var structured_ord = []

		// go through all the ranks
		for (var i=ord.length-1; i>-1; i--){

			var cluster = this.gen_cluster(ord, i, index_dict, grid)
			for (var j in cluster){
				if (ord[i+1] == undefined) continue
				if (cluster[j].g == undefined) cluster[j].wmean = ord[i+1].indexOf(ord[i+1].find(n => index_dict[n] == cluster[j].seq_index))
				else {
					cluster[j].wmean = 0
					for (var n of cluster[j].nodes){
						n.wvalue = ord[i+1].indexOf(ord[i+1].find(nn => index_dict[nn] == n.seq_index))
						cluster[j].wmean += n.wvalue
					}

					cluster[j].nodes.sort((a, b) => this.within_cluster_sort(a, b, 'right', ord, date_dict, i))
					cluster[j].wmean = cluster[j].wmean / cluster[j].nodes.length
				}
			}

			cluster = cluster.sort((a, b) => this.general_cluster_sort(a, b))

			structured_ord.push(cluster)
		}

		structured_ord = structured_ord.reverse()

		return this.structured_to_normal_ord(structured_ord, date_dict)
	}

	wmedian_n(ord, date_dict, index_dict, grid, direction = 'right'){
		var structured_ord = []

		let startindex = 0
		let condition_end = undefined
		let mov = 0
		if (direction == 'right'){ // right
			startindex = ord.length - 1
			condition_end = i => i>-1
			mov = +1
		} else { // left
			startindex = 0
			condition_end = i => i < ord.length
			mov = -1
		}

		// go through all the ranks
		for (var i=startindex; condition_end(i); direction == 'right'? i-- : i++){

			// generate the clusters of nodes per bin
			var cluster = this.gen_cluster(ord, i, index_dict, grid)

			// for each node in the cluster
			for (var j in cluster){
				if (ord[i+mov] == undefined) continue
				if (cluster[j].g == undefined) cluster[j].wmean = ord[i+mov].indexOf(ord[i+mov].find(n => index_dict[n] == cluster[j].seq_index))
				else {
					cluster[j].wmean = 0
					for (var n of cluster[j].nodes){
						n.wvalue = ord[i+mov].indexOf(ord[i+mov].find(nn => index_dict[nn] == n.seq_index))
						cluster[j].wmean += n.wvalue
					}

					cluster[j].nodes.sort((a, b) => this.within_cluster_sort(a, b, direction, ord, date_dict, i))
					cluster[j].wmean = cluster[j].wmean / cluster[j].nodes.length
				}
			}

			cluster = cluster.sort((a, b) => this.general_cluster_sort(a, b))

			structured_ord.push(cluster)
		}

		structured_ord = structured_ord.reverse()

		return this.structured_to_normal_ord(structured_ord, date_dict)
	}

	within_cluster_sort(a, b, direction, ord, index_dict, i){
		if (a.next_node.fake_out || b.next_node.fake_out) {
			return ord[i-1].indexOf(index_dict[a.prev_node.seq_index]) > ord[i-1].indexOf(index_dict[b.prev_node.seq_index]) ? 1 : -1
		} else if (a.prev_node.fake_in || b.prev_node.fake_in)
			return ord[i+1].indexOf(index_dict[a.next_node.seq_index]) > ord[i+1].indexOf(index_dict[b.next_node.seq_index]) ? 1 : -1
		else return a.wvalue > b.wvalue ? 1 : -1
	}

	general_cluster_sort(a, b){
		// an anchor that has source and target at the same level has to stick to the same level
		// regardless of wmean
		if (b.isanchor && a.g != undefined && this.levels.indexOf(b.incoming_links[0].source.level) == this.levels.indexOf(b.outgoing_links[0].target.level))
			return this.levels.indexOf(b.outgoing_links[0].target.level) > this.levels.indexOf(a.g) ? -1 : 1
		if (a.isanchor && b.g != undefined && this.levels.indexOf(a.incoming_links[0].source.level) == this.levels.indexOf(a.outgoing_links[0].target.level))
			return this.levels.indexOf(a.outgoing_links[0].target.level) > this.levels.indexOf(b.g) ? 1 : -1

		// manage anchors
		// if (a.isanchor) return 1
		// if (b.isanchor) return -1

		if (a.g != undefined && b.g != undefined && a.g != b.g) return this.levels.indexOf(a.g) > this.levels.indexOf(b.g) ? 1 : -1
		else return a.wmean > b.wmean ? 1 : -1
	}

	transpose(tmpord, date_dict, index_dict, grid){
		console.log(date_dict)
		console.log(index_dict)
		let improved = true
		while(improved){
			improved = false
			for (let r=0; r<tmpord.length; r++){
				//console.log('rank: ', r)
				for (let i=0; i<tmpord[r].length - 1; i++){
					let u = tmpord[r][i]
					let v = tmpord[r][i+1]
					let prevcross = this.count_crossings_from_ord(tmpord.slice(r-1, r+1))
					tmpord[r][i] = v
					tmpord[r][i+1] = u
					let nextcross = this.count_crossings_from_ord(tmpord.slice(r-1, r+1))
					if (nextcross < prevcross){
						//console.log(prevcross, nextcross)
						improved = true
					} else {
						tmpord[r][i] = u
						tmpord[r][i+1] = v
					}
				}
			}
		}
		return tmpord
	}

	sort_nodes_vertically(animate = false){
		var startDate = new Date();

		var grid = []
		var max_rank = this.max_rank

		for (var curdepth = 0; curdepth<max_rank; curdepth++){
			if (!this.nodes.some(n => n.depth == curdepth)) continue
			grid[curdepth] = []
			for (var node of this.nodes.filter(n => n.depth == curdepth)) grid[curdepth].push(node)
		}

		// for (var c in grid){
		// 	grid[c] = grid[c].sort((a, b) => {
		// 		if (a.level != b.level) return this.levels.indexOf(a.level) > this.levels.indexOf(b.level) ? 1 : -1
		// 		else {
		// 			var na = a.incoming_links[0].source
		// 			var nb = b.incoming_links[0].source
		// 			if (grid[c-1] != undefined) return grid[c-1].indexOf(na) > grid[c-1].indexOf(nb) ? 1 : -1
		// 		}
		// 	})
		// }

		var initial_order = this.get_grid_order(grid)[0]
		var index_dict = this.get_grid_order(grid)[1]
		var date_dict = this.get_grid_order(grid)[2]
		var lvl_dict = this.get_grid_order(grid)[3]
		var initial_crossings = this.count_crossings_from_ord(initial_order)

		var best_crossings = Infinity
		var best_order = initial_order

		this.apply_ord(best_order, grid, index_dict, date_dict)
		this.grid = grid

		if (this.opt.animate){
			this.set_nodes_y(grid)
			this.init_paths()
			this.init_nodes()
			this.position_links(0)
			this.position_nodes(0)
		}

		if (this.opt.formulate_ilp) this.formulate_ilp(initial_order, lvl_dict)

		let seenResults = {}

		for (var i=0; i<this.opt.max_iterations; i++){

			if (i%2 == 0) var tmpord = this.wmedian_nodes_left(deepClone(best_order), date_dict, index_dict, grid, 'left')
			else var tmpord = this.wmedian_nodes_right(deepClone(best_order), date_dict, index_dict, grid, 'right')

			//tmpord = this.transpose(tmpord, date_dict, index_dict, grid)

			let cur_crossings = this.count_crossings_from_ord(tmpord)

			// max iteration stop
			if (seenResults[cur_crossings] == undefined) seenResults[cur_crossings] = 0
			seenResults[cur_crossings] += 1
			if (seenResults[cur_crossings] == 3){
				if (this.opt.verbose_stats) console.log('num iterations: ', i, '\t final crossings: ', best_crossings, '\t time: ', ((new Date()).getTime() - startDate.getTime()) / 1000 + ' s')
				break
			}

			// compare current result
			if (cur_crossings < best_crossings){
				best_order = tmpord
				best_crossings = this.count_crossings_from_ord(best_order)

				if (animate) {
				 	this.apply_ord(best_order, grid, index_dict, date_dict)
				 	this.set_nodes_y(grid)
				 	this.position_links((i+1)*1000)
				 	this.position_nodes((i+1)*1000)
				}
			}

			if (this.opt.verbose_stats) console.log('i: ', i,'\t best crossings: ', best_crossings, '\t cur crossings: ', cur_crossings, '\t time: ', ((new Date()).getTime() - startDate.getTime()) / 1000 + ' s')
		}


		if (this.opt.retrieve_ilp) {
			best_order = getoordfromilp(this.opt.ilpdata, initial_order)
			console.log('ilp order: ', best_order, this.count_crossings_from_ord(best_order))
			this.apply_ord_for_ilp(best_order, grid, index_dict, date_dict)
		} else if (this.opt.initial_layout) {
			this.apply_ord(initial_order, grid, index_dict, date_dict)
		} else {
			// original solution
			this.apply_ord(best_order, grid, index_dict, date_dict)
		}

		if (this.opt.verbose_ord) {
			console.log("final ord:", best_order)
			console.log("final grid:", grid)
		}

		return grid
	}


	formulate_ilp = (ord, lvl_dict) => {

		lvl_dict = lvl_dict.slice(1)

		let mkx = (k, u1, u2) => {
			return 'x_' + "k" + k + "_" + + u1 + "_" + u2
		}

		let mkc = (k, u1, v1, u2, v2) => {
			return "c_" + "k" + k + "_" + u1 + "_" + v1 + "_" + u2 + "_" + v2
		}
		let res_str = ""

		let tord = ord

		let minimize = "Minimize\n"
		for (let k=0; k<tord.length-1; k++){
			for (let u1 of tord[k]){
				let v1 = tord[k+1].find(n => n == u1)
				for (let u2 of tord[k]){
					if (u1 == u2) continue
					let v2 = tord[k+1].find(n => n == u2)
					minimize += " + " + mkc(k, u1, v1, u2, v2) + " "
				}
			}
		}
		minimize += "\n"

		res_str += minimize
		let ccount = 0

		let subject_to = "Subject To\n"
		for (let k in tord){
			for (let i1 of tord[k]){
				for (let i2 of tord[k]){
					let u1 = tord[k][i1]
					let u2 = tord[k][i2]
					if (u1 == u2) continue
					subject_to += 'C' + ccount + ": " + mkx(k, u1, u2) + " + " + mkx(k, u2, u1) + " = 1\n"
					ccount += 1
				}
			}
		}

		//count intersections
		for (let k in tord){
			for (let i1 in tord[k]){
				let u1 = tord[k][i1]
				for (let i2 in tord[k]){
					let u2 = tord[k][i2]
					if (u1 == u2) continue
					for (let i3 in tord[k]){
						let u3 = tord[k][i3]
						if (u1 == u3) continue
						if (u2 == u3) continue
						subject_to += 'C' + ccount + ": " + mkx(k, u3, u2) + " + " + mkx(k, u2, u1) + " - " + mkx(k, u3, u1) + " <= " + "1\n"
						ccount += 1
					}
				}
			}
		}

		//count intersections
		for (let k=0; k < tord.length - 1; k++){
			for (let i1 in tord[k]){
				let u1 = tord[k][i1]
				let v1 = tord[k+1].find(n => n == u1)
				for (let i2 in tord[k]){
					let u2 = tord[k][i2]
					let v2 = tord[k+1].find(n => n == u2)
					if (u1 == u2) continue
					subject_to += "C" + ccount + ": " + mkc(k, u1, v1, u2, v2) + " + " + mkx(k, u2, u1) + " + " + mkx(k + 1, v1, v2) + " >= 1\n"
					ccount += 1
					subject_to += "C" + ccount + ": " + mkc(k, u1, v1, u2, v2) + " + " + mkx(k, u1, u2) + " + " + mkx(k + 1, v2, v1) + " >= 1\n"
					ccount += 1
				}
			}
		}

		res_str += subject_to

		let bounds = "Bounds\n"

		//console.log('tord', tord)

		// level bounds
		for (let k=0; k<tord.length; k++){
				for (let i1 in tord[k]){
						let u1 = tord[k][i1]
						let lvlu1 = this.levels.indexOf(lvl_dict[k][i1])
						for (let i2 in tord[k]){
							let u2 = tord[k][i2]
							if (u1 == u2) continue
							let lvlu2 = this.levels.indexOf(lvl_dict[k][i2])
							if (k==1 && i1 == 0) console.log('k:',k,'u1', u1,'lvlu1', lvlu1,'u2', u2,'lvlu2', lvlu2)
							if (lvlu1 < lvlu2){
								bounds += mkx(k, u1, u2) + ' = 1\n'
								//console.log('k:',k,'u1', u1,'lvlu1', lvlu1,'u2', u2,'lvlu2', lvlu2)
							}
						}
				}
		}

		res_str += bounds

		let binaries = "Binaries\n"
		for (let k in tord){
			for (let i1 of tord[k]){
				for (let i2 of tord[k]){
					let u1 = tord[k][i1]
					let u2 = tord[k][i2]
					if (u1 == u2) continue
					binaries += 'x_' + "k" + k + "_" + + u1 + "_" + u2 + " "
				}
			}
		}
		for (let k=0; k<tord.length-1; k++){
			for (let u1 of tord[k]){
				let v1 = tord[k+1].find(n => n == u1)
				for (let u2 of tord[k]){
					if (u1 == u2) continue
					let v2 = tord[k+1].find(n => n == u2)
					binaries += "c_" + "k" + k + "_" + + u1 + "_" + v1 + "_" + u2 + "_" + v2 + " "
				}
			}
		}

		res_str += binaries
		res_str += '\nEnd'

		function saveTextAsFile(t){
    //var textToWrite = document.getElementById("inputTextToSave").value;
    var textFileAsBlob = new Blob([t], {type:'text/plain'});
    var fileNameToSaveAs = 'sb.lp';
      var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null)
    {
        // Chrome allows the link to be clicked
        // without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else
    {
        // Firefox requires the link to be added to the DOM
        // before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }

    downloadLink.click();
	}

		saveTextAsFile(res_str)
		//console.log(res_str)
	}


	init_paths(){
		var svg = d3.select('#' + this.svgname)
		var lineGen = d3.line()
        	.x(function(d) { return d.x })
        	.y(function(d) { return d.y })
        	.curve(d3.curveCatmullRom.alpha(this.opt.catmullromvalue))

		for (var sequence of this.data){
			var link_collection = this.links.filter(l => l.seq_index == sequence[0].seq_index)
			if (link_collection.length == 0) continue

			var real_link_collection = link_collection.filter(l => !l.source.fake_in && !l.target.fake_out && !(l.source ==this.source || l.target == this.target))
	        var len = real_link_collection.length

			// define drawpath for the link paths
			var drawpath = []

			for (var link of link_collection) {
				if (link.source.fake_in && link.target.fake_in) continue
				else if (link.source.fake_out && link.target.fake_out) continue
				else if ((link.source == this.source || link.source.fake_in) && !link.target.fake_in){
					drawpath.push({x: link_collection.indexOf(link)*this.horizontal_spacing, y: this.data.indexOf(sequence)*this.vertical_spacing + Math.random()*0.001})
				} else {
					drawpath.push({x: link_collection.indexOf(link)*this.horizontal_spacing - this.node_width, y: this.data.indexOf(sequence)*this.vertical_spacing + Math.random()*0.001})
					drawpath.push({x: link_collection.indexOf(link)*this.horizontal_spacing, y: this.data.indexOf(sequence)*this.vertical_spacing + Math.random()*0.001})
					drawpath.push({x: link_collection.indexOf(link)*this.horizontal_spacing + this.node_width, y: this.data.indexOf(sequence)*this.vertical_spacing + Math.random()*0.001})
				}
			}

			drawpath.push({x: link_collection.indexOf(link)*this.horizontal_spacing, y: this.data.indexOf(sequence)*this.vertical_spacing + Math.random()*0.001})

			this.gen_gradient(svg, link, len, real_link_collection)
			const svg_index = this.svg_index

			var p = svg.append('path')
				.datum({'seq_index' : sequence[0].seq_index})
				.attr('id', 'day_' + sequence[0].seq_index)
				.attr('class', 'seqpath')
				.attr('d', lineGen(drawpath))
				.style('stroke', "url(#linear-gradient"+svg_index+'_'+link.seq_index+")")
				.style('stroke-width', this.opt.link_stroke_width)
				.style('opacity', this.opt.link_opacity)
				.attr('fill', '#ffffff00')
				.on('mouseover', function (d){ d3.select(this).style('stroke', 'black')})
				.on('mouseout', function(d){
					d3.select(this).style('stroke', "url(#linear-gradient"+svg_index+'_'+this.id.split("_")[1]+")")
				})
		}
	}


	position_links(delay = 0, duration=1000){
		var svg = d3.select('#' + this.svgname)
		var lineGen = d3.line()
        	.x(function(d) { return d.x })
        	.y(function(d) { return d.y })
        	.curve(d3.curveCatmullRom.alpha(this.opt.catmullromvalue))

		for (var sequence of this.data){
			var link_collection = this.links.filter(l => l.seq_index == sequence[0].seq_index)
			if (link_collection.length == 0) continue

			var real_link_collection = link_collection.filter(l => !l.source.fake_in && !l.target.fake_out && !(l.source ==this.source || l.target == this.target))
	        var len = real_link_collection.length

			// define drawpath for the link paths
			var drawpath = []

			for (var link of link_collection) {
				if (link.source.fake_in && link.target.fake_in) continue
				else if (link.source.fake_out && link.target.fake_out) continue
				else if ((link.source == this.source || link.source.fake_in) && !link.target.fake_in){
					drawpath.push({x: this.get_node_x(link.source, this.horizontal_spacing) + (this.horizontal_spacing - this.opt.padding.left), y: this.opt.padding.top + link.target.y*this.vertical_spacing + Math.random()*1})
				} else {
					drawpath.push({x: this.get_node_x(link.source, this.horizontal_spacing), y: this.opt.padding.top + link.source.y*this.vertical_spacing + Math.random()*0.001})
					drawpath.push({x: this.node_width/2 + this.get_node_x(link.source, this.horizontal_spacing), y: this.opt.padding.top + link.source.y*this.vertical_spacing + Math.random()*0.001})
					drawpath.push({x: this.node_width + this.get_node_x(link.source, this.horizontal_spacing), y: this.opt.padding.top + link.source.y*this.vertical_spacing + Math.random()*0.001})
				}
			}

			drawpath.push({x: drawpath[drawpath.length - 1].x + this.opt.padding.left, y: drawpath[drawpath.length - 1].y  + Math.random()*0.001})

			svg.select('#day_' + sequence[0].seq_index)
				.transition()
				.attr('d', () => lineGen(drawpath))
				.duration(duration)
				.delay(delay)
		}
	}


	init_nodes(){
		var svg = d3.select('#' + this.svgname)

		for (var node of this.nodes){
			svg.append('rect')
				.datum(node)
				.attr('id', 'node_' + node.seq_index + '_' + node.depth)
				.attr('class', 'seqnode')
				.attr('x', this.get_node_x(node, this.horizontal_spacing))
				.attr('y', this.vertical_spacing)
				.attr('width', this.node_width)
				.attr('height', this.vertical_spacing)
				.attr('rx', '5px')
				.attr('fill', node.isanchor ? '#ffffff00' : node.color)
				.attr('opacity', 0)
				.on('click', d => console.log(d))
		}
	}


	position_nodes(delay=0, duration=1000){
		var svg = d3.select('#' + this.svgname)
		for (var node of this.nodes){
			svg.select('#' + 'node_' + node.seq_index + '_' + node.depth)
				.transition()
				.attr('x', this.get_node_x(node, this.horizontal_spacing))
				.attr('y', this.opt.padding.top + node.y*this.vertical_spacing - this.vertical_spacing/2)
				.attr('opacity', 0.5)
				.duration(duration)
				.delay(delay)
		}
	}


	add_virtual_nodes(grid){
		var level_heights = {}
		var start_heights = {}

		// define maximum heights for each level
		for (var level of this.levels){
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
		for (var level of this.levels){
			start_heights[level] = cur_height
			cur_height += level_heights[level]
		}

		this.start_heights = start_heights
		this.level_heights = level_heights

		// add virtual blank nodes to make the nodes be at their correct position
		for (var r=0; r<=this.max_rank; r++){

			if (grid[r] == undefined) continue
			for (var level of this.levels){
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

		// for (var r=0; r<=this.max_rank; r++){
		// 	if (grid[r] == undefined) continue
		// 	var cur_level = this.levels[0]
		// 	for (var level of this.levels){
		// 		var group = grid[r].filter(n => n.level == level)
		// 		var firstNode = group[0]
		// 		var lastNode = group[group.length - 1]
		// 		if (firstNode == undefined || level == 'unknown' || firstNode.prev_node.level != firstNode.level) continue
		// 		var diff = grid[r-1].indexOf(firstNode.prev_node) - grid[r].indexOf(firstNode)
		// 		for (var i=0; i<diff; i++){
		// 			grid[r].splice(grid[r].indexOf(firstNode) - 1, 0, {})
		// 			if (grid[r][grid[r].indexOf(lastNode) + 1].level == undefined) grid[r].splice(grid[r].indexOf(lastNode) + 1, 1)
		// 		}
		// 	}
		// }
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
			level: event.level,
			type: event.type,
			color: isanchor ? averageRGB(this.get_color(event), prevnode.color) : this.get_color(event),
			incoming_links: [],
			outgoing_links: [],
			next_node: null,
			prev_node: prevnode,
			isanchor: isanchor,
			depth: next_depth,
			fake_out: fake_out,
			fake_in: fake_in,
			seq_index: event.seq_index,
			label: event.label
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
		this.source = {depth: 0, incoming_links:[], outgoing_links:[], color:'#fff', fake_in:true}
		this.sink = {depth: path.length + 1, incoming_links:[], outgoing_links:[], color:'gray', fake_out:true}
		//this.nodes.push(this.source)

		var count = 0
		for (var sequence of this.data){
			var prevnode = this.source
			for (var event of sequence){
				var index = sequence.indexOf(event)
				if (this.path.slice(1).slice(prevnode.depth, this.path.length).indexOf(this.path.find(n => event.type == n)) == -1) continue
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
		for (var d=0; d<this.path.length; d++){
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
		return node.depth * this.horizontal_spacing
	}


	gen_gradient(svg, link, len, real_link_collection){
		// Define linear gradient for this specific link
		var defs = svg.append("defs")

        var linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient"+this.svg_index+'_'+link.seq_index)
            //.attr("gradientUnits", "userSpaceOnUse")

		linearGradient.append("stop")
            .attr("offset", 0)
            .attr("stop-color", '#ffffff00');

        if (real_link_collection.length == 0) {
        	linearGradient.append("stop")
            .attr("offset", 0.5)
            .attr("stop-color", link.target.color);
        }

		for (link of real_link_collection){
			if (link.source != this.source){

				var colorsource = link.source.color
				var colortarget = link.target.color

				linearGradient.append("stop")
					.attr('offset', 0.05*(5/len) + real_link_collection.indexOf(link) * 1/(len))
					.attr('stop-color', colorsource)

				// linearGradient.append("stop")
				// 	.attr('offset', 0.05*(5/len) + (real_link_collection.indexOf(link) + 0.3) * 1/(len))
				// 	.attr('stop-color', colorsource)

				linearGradient.append("stop")
					.attr('offset', 0.05*(5/len) + (real_link_collection.indexOf(link) + 0.5) * 1/(len))
					.attr('stop-color', colortarget)
			}
		}

		linearGradient.append("stop")
		 	.attr('offset', 1)
		 	.attr('stop-color', '#ffffff00')

	}

	add_path_text(){
		var svg = d3.select('#' + this.svgname)
		for (var e in this.path){
			if (this.path[e] == 'source' || this.path[e] == 'sink') continue
			var t = svg.append('text')
				.attr('y', this.opt.path_text_y)
				.attr('x', (d, i) => e*this.horizontal_spacing + this.node_width/2)
				.attr('text-anchor', 'middle')
				.attr('font-family', 'Arial')
				.attr('class', 'path_top_text')
				.attr('font-size', '0.8em')
				.attr('fill', 'black')
				.text(this.path[e])
		}
	}

	draw(){
		var svg = d3.select('#' + this.svgname)

		this.init_nodes()
		this.position_nodes(0, 0)

		this.init_paths(svg)
		this.position_links(0, 0)
	}
}
