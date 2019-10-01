
var data = null;
var nodes, links;
var source, sink;
var numDays = getParams(window.location.href).numDays
if (numDays == undefined) {console.warn('undefined number of days'); numDays = 3}
var startDayNum = parseInt(getParams(window.location.href).startDayNum)
if (startDayNum == undefined) {startDayNum = 0}
if (startDayNum >= 769) startDayNum = 768

var edge_stroke_weight = 8;
var edge_spacing = 8;

var padding_left = 200
var padding_right = 5000
var width = window.innerWidth + padding_right;
var height = window.innerHeight *0.60;

var svg = d3.select("#svgcontainer").append("svg")                                  
    .attr("width", width)
    .attr("height", height);

var color = d3.scaleOrdinal(d3.schemeCategory20)
var glucose_levels = ['very_high', 'high', 'normal', 'low', 'very_low', 'unknown']

var showing_anchors = false
var showing_intersections = false


var sort_on_glucose_levels = function(position){
    return function(a, b){
        if (a.glucose_level == undefined || b.glucose_level == undefined) return 0
        if (glucose_levels.indexOf(a.glucose_level) == glucose_levels.indexOf(b.glucose_level)) {
            if (position == 'source') {if (a.depth < b.depth) return -1; else return 1}
            else if (position == 'target'){if (a.depth < b.depth) return -1; else return 1}
            else return 0
        }
        else if (glucose_levels.indexOf(a.glucose_level) > glucose_levels.indexOf(b.glucose_level)) return 1
        else return -1
    }
}



var sort_on_node_y = function(position){
    return function(a, b){
        if (a.y == b.y) {
            if (position == 'source') {if (a.depth < b.depth) return -1; else return 1}
            else if (position == 'target'){if (a.depth < b.depth) return -1; else return 1}
            else return 0
        }
        else if (a.y > b.y) return 1
        else return -1
    }
}


var find_source_offset_of_edge = function(d){

    if (d.source.outgoing_links_order != undefined) return d.source.outgoing_links_order.indexOf(d) * (edge_stroke_weight + edge_spacing)

    this_target_collection = d.source.links.filter(l => l.target == d.target)
    targets = find_unique_targets(d.source.links)
    targets.sort(sort_on_glucose_levels('source'))
    sum = 0
    for (var i=0; i<targets.indexOf(d.target); i++){
        sum += d.source.links.filter(l => l.target == targets[i]).length
    }

    return (sum + this_target_collection.indexOf(d)) * (edge_stroke_weight + edge_spacing)
}


var find_target_offset_of_edge = function(d){

    if (d.target.incoming_links_order != undefined) return d.target.incoming_links_order.indexOf(d) * (edge_stroke_weight + edge_spacing)

    all_the_links_that_should_be_parallel_to_this = window.graph.links.filter(l => l.source == d.source && l.target == d.target)
    all_the_possible_sources_that_links_that_have_this_as_target_come_from = find_unique_sources(window.graph.links.filter(l => l.target == d.target))
    all_the_possible_sources_that_links_that_have_this_as_target_come_from.sort(sort_on_node_y('target'))
    sum = 0
    for (var i=0; i<all_the_possible_sources_that_links_that_have_this_as_target_come_from.indexOf(d.source); i++){
        sum += window.graph.links.filter(l => l.target == d.target && l.source == all_the_possible_sources_that_links_that_have_this_as_target_come_from[i]).length
    }

    return (sum + all_the_links_that_should_be_parallel_to_this.indexOf(d)) * (edge_stroke_weight + edge_spacing)    
}


var find_path = function(data){
    var m_dict = {}
    var index_dict = {}


    /* TEMPORARY FIX */
    for (i in data){
        if (data[i].Meal == 'Exercise snack') data[i].Meal = 'Snack'
        if (data[i].Meal == 'Other (Describe what he is eating below)') data[i].Meal = 'Other'
    }
    /* TEMPORARY FIX */


    count = 0
    for (i in data){
        if (data[i].Meal.length <= 1) continue
        if (m_dict[data[i].Meal] == undefined) {m_dict[data[i].Meal] = String.fromCharCode(parseInt(count) + 65); count++}
    }

    for (j in m_dict) index_dict[m_dict[j]] = j

    var count = 0
    sequences = []
    for (var day of days_iterator(data)){
        day = day.filter(d => d.Meal.length > 1)

        res_str = ""
        for (m of day) res_str += m_dict[m.Meal]
        sequences.push(res_str)
        count++
        if (count > numDays) break
    }

    seq = pairwiseAlignDna(sequences)
    
    res = []
    for (i in seq){res.push(index_dict[seq[i]])}

    res.unshift('source')
    res.push('sink')
    return res
}


var count_at_depth = function(depth){
    var nodes = window.graph.nodes.filter(n => n.depth == depth)
    sum = 0
    for (n of nodes){
        for (l of n.links) sum += l.value
    }
    return sum
}


var highlight_day = function(day){
    d3.selectAll('.edge')
        .attr('stroke', function(d, i){
            if (d == undefined) return
            else if (d.day == day) {
                if (d.source == window.graph.source) return `url(#transparent_to_black_gradient)`
                else if (d.target == window.graph.sink) return 'url(#black_to_transparent_gradient)'
                else return 'black'   
            }
            else {
                gradientID = `gradient${i}`;
                return `url(#${gradientID})`
            }
        })
}


var reset_edge_colors = function(){
    d3.selectAll('.edge')
        .attr('stroke', function(d, i){
            if (d == undefined) return
            else {
                gradientID = `gradient${i}`;
                return `url(#${gradientID})`
            }
        })
}


var draw_edges2 = function(){
    var defs = svg.append("defs")

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("edge")
        .data(graph.links)
        .enter()

    var curve = link.append("path")
        .attr("class", "edge")
        .attr("d", d => d.gen_curve_array())
        .attr("stroke-width", d => d.value * edge_stroke_weight)
        .attr("stroke-opacity", 0.7)
        .attr("fill", "none")
        .on('click', d => console.log(d))
        .on('mouseout', reset_edge_colors)
        .on('mouseover', d => highlight_day(d.day))

    // MAKE GRADIENTS
    curve.attr('stroke', (d, i) => create_gradient(d, i))

    create_transparent_black_gradients()
}


function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}


var draw_edges3 = function(){
	days_in_graph = [...new Set(window.data.map(d => d['Date']))]
	huge_links = []

	for (day of days_in_graph){
		links_of_day = window.graph.links.filter(l => l.day.length > 0 && l.day[0]['Date'] == day)
		h_link = new Link({target:window.graph.sink, source:window.graph.source})
		for (l of links_of_day){
			for (anchor of l.anchors){
				h_link.anchors.push(anchor)
			}
		}
		if (h_link.anchors.length > 0) huge_links.push(h_link)
	}

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("u_edge")
        .data(huge_links)
        .enter()

    var curve = link.append("path")
        .attr("class", "u_edge")
        .attr("d", d => d.gen_curve_array())
        .attr("stroke-width", 4)
        .attr("stroke-opacity", 0.7)
        .attr("stroke", "white")
        .attr("fill", "none")

    draw_edges2()
}


var draw_edges = function(){
	for (node of window.graph.nodes) fix_node_incoming_outgoing_links(node)
	small_links = []
	for (node of window.graph.nodes){
		for (i_l of node.incoming_links_order){
			o_l = node.outgoing_links_order.find(l => l.day[0] != undefined && l.day[0] == i_l.day[0])
			if (o_l != undefined){
				h_link = new Link({target:window.graph.sink, source:window.graph.source})
				h_link.anchors.push(i_l.anchors[i_l.anchors.length - 2])
				h_link.anchors.push(i_l.anchors[i_l.anchors.length - 1])
				h_link.anchors.push(o_l.anchors[0])
				h_link.anchors.push(o_l.anchors[1])
				small_links.push(h_link)				
			}
		}
	}
	
	var link = svg.append("g")
        .attr("class", "links")
        .selectAll("u_edge")
        .data(small_links)
        .enter()

    var curve = link.append("path")
        .attr("class", "u_edge")
        .attr("d", d => d.gen_curve_array())
        .attr("stroke-width", 4)
        .attr("stroke-opacity", 1)
        .attr("stroke", "white")
        .attr("fill", "none")

	draw_edges2()
}



var link_orientation = function(link){
    // return 1 if link is going up
    // return 0 if link is flat
    // return -1 if link is going down
    if (glucose_levels.indexOf(link.source.glucose_level) > glucose_levels.indexOf(link.target.glucose_level)) return 1
    if (glucose_levels.indexOf(link.source.glucose_level) == glucose_levels.indexOf(link.target.glucose_level)) return 0
    if (glucose_levels.indexOf(link.source.glucose_level) < glucose_levels.indexOf(link.target.glucose_level)) return -1

}

var sort_incoming_by_coord = function(a, b){
    if (a.length == 1) a_y = a.source.y
    else a_y = a.anchors[a.anchors.length-3].y
    if (b.length == 1) b_y = b.source.y
    else b_y = b.anchors[b.anchors.length-3].y
    return a_y > b_y 
}

var sort_outgoing_by_coord = function(a, b){
    if (a.length == 1) a_y = a.target.y
    else a_y = a.anchors[2].y
    if (b.length == 1) b_y = b.target.y
    else b_y = b.anchors[2].y
    return a_y > b_y  
}

var sort_links = function(a, b, inorout){
    if (a.source == window.graph.source) {
    	//if (a.target.outgoing_links_order != undefined) console.log(a.target.outgoing_links_order.indexOf(a.target.outgoing_links_order.find(l => l.day == a.day)), b.target.outgoing_links_order.indexOf(b.target.outgoing_links_order.find(l => l.day == b.day)))
    		//if (a.target.outgoing_links_order.indexOf(a) < a.target.outgoing_links_order.indexOf(b)) console.log('AAA')
        if (b.source == window.graph.source) return 0

        // if a is from source and b is going down, a should be on top
        if (link_orientation(b) < 0) return 1
        else if (link_orientation(b) == 0) return 0
        // else if (link_orientation(b) == 0) return 0
        else return -1
    }

	
    if (b.source == window.graph.source) {
        if (a.source == window.graph.source) return 0

        // if b is from source and a is going down, b should be on top
        if (link_orientation(a) < 0) return -1
        // else if (link_orientation(a) == 0) return 0
        else return 1
    }

    if (a.target == window.graph.sink) {
        //if (b.target == window.graph.sink && a.source.incoming_links_order != undefined) return a.source.incoming_links_order.indexOf(a.source.incoming_links_order.find(l => l.day == a.day)) > b.source.incoming_links_order.indexOf(b.source.incoming_links_order.find(l => l.day == b.day)) 
        if (b.target == window.graph.sink) return 0

        // if a goes to sink and b is going down, a should be on top
        if (link_orientation(b) < 0) return -1
        // else if (link_orientation(b) == 0) return 0
        else return 1
    }
     
    
    if (b.target == window.graph.sink) {
        if (a.target == window.graph.sink) return 1

        // if b goes to sink and a is going down, b should be on top
        if (link_orientation(a) < 0) return 1
        //else if (link_orientation(a) == 0) return 0
        else return -1
    }

    if (inorout == 'in'){
        if (window.graph.grid != undefined){
            if (a.length == 1) {
                col_index = a.source.depth; 
                a_row = window.graph.grid[col_index - 1].indexOf(window.graph.grid[col_index - 1].find(r => r.indexOf(a.source) != -1))
            } else {
                col_index = a.anchors[a.anchors.length-3].depth; 
                a_row = window.graph.grid[col_index - 1].indexOf(window.graph.grid[col_index - 1].find(r => r.indexOf(a.anchors[a.anchors.length-3]) != -1))
            }

            if (b.length == 1) {
                col_index = b.source.depth; 
                b_row = window.graph.grid[col_index - 1].indexOf(window.graph.grid[col_index - 1].find(r => r.indexOf(b.source) != -1))
            } else {
                col_index = b.anchors[b.anchors.length-3].depth; 
                b_row = window.graph.grid[col_index - 1].indexOf(window.graph.grid[col_index - 1].find(r => r.indexOf(b.anchors[b.anchors.length-3]) != -1))
            }
            
            if (a_row > b_row) return 1
            else if (a.row == b.row){ 
            	return sort_incoming_by_coord(a, b)
            }
            else return -1
        }
        else return sort_incoming_by_coord(a, b)
           
    } else if (inorout == 'out'){

    	if (a.target == b.target && a.source.outgoing_links_order != undefined) {
    		return a.source.outgoing_links_order.indexOf(a) > b.source.outgoing_links_order.indexOf(b)
    	}

        if (window.graph.grid != undefined){
            if (a.length == 1) {
                col_index = a.target.depth; 
                a_row = window.graph.grid[col_index - 1].indexOf(window.graph.grid[col_index - 1].find(r => r.indexOf(a.target) != -1))
            } else {
                col_index = a.anchors[2].depth; 
                a_row = window.graph.grid[col_index - 1].indexOf(window.graph.grid[col_index - 1].find(r => r.indexOf(a.anchors[2]) != -1))
            }

            if (b.length == 1) {
                col_index = b.target.depth; 
                b_row = window.graph.grid[col_index - 1].indexOf(window.graph.grid[col_index - 1].find(r => r.indexOf(b.target) != -1))
            } else {
                col_index = b.anchors[2].depth; 
                b_row = window.graph.grid[col_index - 1].indexOf(window.graph.grid[col_index - 1].find(r => r.indexOf(b.anchors[2]) != -1))
            }
            
            //console.log(a_row, b_row, a.target.meal, a.target.glucose_level, a.target.depth, b.target.meal, b.target.glucose_level, b.target.depth, a_row < b_row)

            if (a_row < b_row) return -1
            else if (a.row == b.row) {
            	//if (a.source.incoming_links_order != undefined) return a.source.incoming_links_order.indexOf(a.source.incoming_links_order.find(l => l.day == a.day)) > b.source.incoming_links_order.indexOf(b.source.incoming_links_order.find(l => l.day == b.day)) 
            	return sort_outgoing_by_coord(a, b)
            }
            else return 1
        }
        else return sort_outgoing_by_coord(a, b)
    } 
}


var get_all_elems_in_column = function(col_n){
    nodes_in_this_column = window.graph.nodes.filter(n => n.depth == col_n)
    anchors_in_this_column = window.graph.anchors.filter(a => a.depth == col_n && a.link.target != window.graph.sink && a.link.source != window.graph.source)
    elems_in_this_column = nodes_in_this_column.concat(anchors_in_this_column).sort((a,b) => a.y > b.y? 1 : - 1)

    return elems_in_this_column
}

var init_sankey = function(){
    
    d3.csv('../data/full.csv', (error, data) => {
        if (error) throw error;

        data = invert_order_of_data(data)

        window.data = select_days(data, numDays);
        console.log(window.data.length)
        var path = find_path(window.data)
        newgraph = new SequenceBraiding(window.data, path)
    })
}

opt = {
    node_width: 30,
    guidelines: false,
    MATCH_SCORE: 10,
    MISMATCH_SCORE: -50,
    BEGIN_GAP_PENALTY: 2,
    GAP_PENALTY: 1,
    END_GAP_PENALTY: 2
}

init_sankey()
