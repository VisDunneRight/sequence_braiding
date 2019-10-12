// checks if a date is a valid date
var isValidDate = function (d){
    return d instanceof Date && !isNaN(d)
}


// checks if two dates are in the same day
var isSameDay = function (date1, date2){
    return date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth() && date1.getDate() == date2.getDate()
}


// takes params from url
var getParams = function (url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};


// divides data into days. returns arrays of events in a single day.
// warning: always assumes that events are temporally sorted
var days_iterator = function* (data){
    
    cur_date = null
    day_arr = []
    
    for (ev of data){
        date = new Date(ev.Date)
        if (!isValidDate(date)) continue;
        else if (cur_date == null) cur_date = date
        else if (data.indexOf(ev) == data.length -1) {day_arr.push(ev); yield day_arr;} // last day
        else if (isSameDay(cur_date, date)) day_arr.push(ev)
        else { // return the array when the date changes
            yield day_arr
            
            cur_date = date
            day_arr = []
        }     
    }
}


var deepClone = function (obj, hash = new WeakMap()) {
        if (Object(obj) !== obj) return obj; // primitives
        if (obj instanceof Set) return new Set(obj); // See note about this!
        if (hash.has(obj)) return hash.get(obj); // cyclic reference
        const result = obj instanceof Date ? new Date(obj)
                     : obj instanceof RegExp ? new RegExp(obj.source, obj.flags)
                     : obj.constructor ? new obj.constructor() 
                     : Object.create(null);
        hash.set(obj, result);
        if (obj instanceof Map)
            Array.from(obj, ([key, val]) => result.set(key, this.deepClone(val, hash)) );
        return Object.assign(result, ...Object.keys(obj).map (
            key => ({ [key]: this.deepClone(obj[key], hash) }) ));
    }


// returns a string containing the range in which the value val is
// application-specific
var get_glucose_level = function(val){
    if (val == "" || val == undefined || isNaN(val)) return 'unknown'
    else if (val < 54) return 'very_low';
    else if (val < 70) return 'low';
    else if (val < 180) return 'normal';
    else if (val < 250) return 'high';
    else return 'very_high';   
}


var calc_day_diff = function(date1, date2){
    var diff = Math.floor(Math.abs(new Date(date2).getTime() - new Date(date1).getTime()));
    var day = 1000 * 60 * 60 * 24;
    return (Math.floor(diff/day));
}


var invert_order_of_data = function(data){
    var tmp = []

    for (var i = data.length - 1; i>=0; i--){
        tmp.push(data[i])
    }

    return tmp
}


var select_days = function(data, numdays){
    result = []
    data = data.filter(d => d['Date'] != "" && d['Date'] != undefined)
    start_date = data[0]['Date'].split(' ')[0]

    for (i in data){
        cur_date = data[i]['Date'].split(' ')[0]
        if (calc_day_diff(start_date, cur_date) < startDayNum) continue
        if (calc_day_diff(start_date, cur_date) >= startDayNum + numDays) break
        result.push(data[i])
    }

    return result
}

// Expects input as 'nnnnnn' where each nn is a 
// 2 character hex number for an RGB color value
// e.g. #3f33c6
// Returns the average as a hex number without leading #
var averageRGB = (function () {

  // Keep helper stuff in closures
  var reSegment = /[\da-z]{2}/gi;

  // If speed matters, put these in for loop below
  function dec2hex(v) {return v.toString(16);}
  function hex2dec(v) {return parseInt(v,16);}

  return function (c1, c2) {

    // Split into parts
    var b1 = c1.match(reSegment);
    var b2 = c2.match(reSegment);
    var t, c = [];

    // Average each set of hex numbers going via dec
    // always rounds down
    for (var i=b1.length; i;) {
      t = dec2hex( (hex2dec(b1[--i]) + hex2dec(b2[i])) >> 1 );

      // Add leading zero if only one character
      c[i] = t.length == 2? '' + t : '0' + t; 
    }
    return  '#' + c.join('');
  }
}());

var get_color = function(level){
    switch (level){
        case "unknown"      : return colorscheme[0];
        case "very_high"    : return colorscheme[1];
        case "high"         : return colorscheme[2];
        case "normal"       : return colorscheme[3];
        case "low"          : return colorscheme[4];
        case "very_low"     : return colorscheme[5];
        default             : return colorscheme[6];
        //default             : return "#fff"
        

        // colorbrewe colors
        //case "unknown"      : return "#888888";
        //case "very_high"    : return "#d7191c";
        //case "high"         : return "#fdae61";
        //case "normal"       : return "#ffffbf";
        //case "low"          : return "#abd9e9";
        //case "very_low"     : return "#2c7bb6";
        //default             : return "#333333";
    }

    
}


var groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};


var find_unique_targets = function(link_collection){
    res = []
    for (link of link_collection) if (res.indexOf(link.target) == -1) res.push(link.target)
    return res
} 

var find_unique_sources = function(link_collection){
    res = []
    for (link of link_collection) if (res.indexOf(link.source) == -1) res.push(link.source)
    return res
} 

var create_gradient = function(d, i){

    defs = svg.select('defs')

    // make unique gradient ids  
    const gradientID = `gradient${i}`;
    const startColor = d.source.color;
    const stopColor = d.target.color;

    var startPercent = '10%'
    var endPercent = '90%'
    if (d.target == window.graph.sink) {startPercent = '0%'; endPercent = '100%'}
    else if (d.source == window.graph.source) {startPercent = '0%'; endPercent = '100%'}

    const linearGradient = defs.append('linearGradient')
        .attr('id', gradientID);

    linearGradient.selectAll('stop') 
      .data([                             
          {offset: startPercent, color: startColor },      
          {offset: endPercent, color: stopColor }    
        ])                  
      .enter().append('stop')
      .attr('offset', d => d.offset)   
      .attr('stop-color', d => d.color)

    return `url(#${gradientID})`;
}


var create_transparent_black_gradients = function(){
    defs = svg.select('defs')

    var t_to_b_gradient = defs.append('linearGradient')
        .attr('id', 'transparent_to_black_gradient')

    t_to_b_gradient.selectAll('stop') 
      .data([                             
          {offset: 0, color: '#ffffff00' },      
          {offset: 1, color: '#000' }    
        ])                  
      .enter().append('stop')
      .attr('offset', d => d.offset)   
      .attr('stop-color', d => d.color)

    var b_to_t_gradient = defs.append('linearGradient')
        .attr('id', 'black_to_transparent_gradient')

    b_to_t_gradient.selectAll('stop') 
      .data([                             
          {offset: 0, color: '#000' },      
          {offset: 1, color: '#ffffff00' }    
        ])                  
      .enter().append('stop')
      .attr('offset', d => d.offset)   
      .attr('stop-color', d => d.color)
}


var draw_grid = function(path){
    var lineGen = d3.line()
        .x(function(d) { return d.x })
        .y(function(d) { return d.y })

    var start_x_off = 200
    var space_in = (width - start_x_off)/((path.length + 1) * 4)
    var x_off = start_x_off - space_in/2

    for (var i=0; i<path.length*4; i++){
        svg.append('path')
            .attr('stroke', () => ((i%4 == 0) || ((i-1)%4==0)) ? '#777' : '#ccc')
            .attr('stroke-width', '1')
            .style("stroke-dasharray", ("3, 3"))
            .attr('d', lineGen([{x: x_off + i * space_in, y: 0}, {x: x_off + i * space_in, y: height}]))
    }

    var start_y_off = 200
    var space_in = (height - start_y_off)/((glucose_levels.length+1) * 2)
    var y_off = start_y_off - space_in/2

    for (var i=0; i<glucose_levels.length*2; i++){
        svg.append('path')
            .attr('stroke', '#ccc')
            .attr('stroke-width', '1')
            .style("stroke-dasharray", ("3, 3"))
            .attr('d', lineGen([{x: 0, y: space_in*i + y_off}, {x: width, y: space_in*i + y_off}]))
    }

}


var onSegment = function(p, q, r) { 
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) 
        && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)) return true; 
  
    return false; 
} 
  
// To find orientation of ordered triplet (p, q, r). 
// The function returns following values 
// 0 --> p, q and r are colinear 
// 1 --> Clockwise 
// 2 --> Counterclockwise 
var check_orientation = function(p, q, r) { 
    // See https://www.geeksforgeeks.org/orientation-3-ordered-points/ 
    // for details of below formula. 

    var val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  
    if (val == 0) return 0;  // colinear 
  
    return (val > 0) ? 1 : 2; // clock or counterclock wise 
} 

var check_intersection = function(p1, q1, p2, q2){

    // Find the four orientations needed for general and 
    // special cases 
    var o1 = check_orientation(p1, q1, p2); 
    var o2 = check_orientation(p1, q1, q2); 
    var o3 = check_orientation(p2, q2, p1); 
    var o4 = check_orientation(p2, q2, q1); 
  
    // General case 
    if (o1 != o2 && o3 != o4) 
        return true; 
  
    // Special Cases 
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1 
    if (o1 == 0 && onSegment(p1, p2, q1)) return true; 
  
    // p1, q1 and q2 are colinear and q2 lies on segment p1q1 
    if (o2 == 0 && onSegment(p1, q2, q1)) return true; 
  
    // p2, q2 and p1 are colinear and p1 lies on segment p2q2 
    if (o3 == 0 && onSegment(p2, p1, q2)) return true; 
  
     // p2, q2 and q1 are colinear and q1 lies on segment p2q2 
    if (o4 == 0 && onSegment(p2, q1, q2)) return true; 
  
    return false; // Doesn't fall in any of the above cases
}


var count_intersections = function (highlight = false, index){
    div = document.getElementById('intersection_div')
    num_intersections = 0

    // remove all links that are coming from the source of the graph or are going into the sink
    tmp_links = window.graph.links.filter(l => l.source != window.graph.source && l.target != window.graph.sink)

    for (var i = 0; i < tmp_links.length; i++){
        var link_i = tmp_links[i]
        
        for (var a = 0; a < link_i.anchors .length - 1; a++){
            var p1 = link_i.anchors[a]
            var q1 = link_i.anchors[a + 1]

            for (var j=i+1; j<tmp_links.length; j++){
                var link_j = tmp_links[j]
                
                for (var b = 0; b < link_j.anchors.length - 1; b++){
                    var p2 = link_j.anchors[b]
                    var q2 = link_j.anchors[b + 1]

                    if (check_intersection(p1, q1, p2, q2) == true) {
                        num_intersections++
                        if (highlight) hightlight_intersection(p1, q1, p2, q2)
                    }                    
                }
            }   
        }
    }

    div.innerHTML = num_intersections
    return num_intersections
}


var hightlight_intersection = function (p1, q1, p2, q2){
    var lineGen = d3.line()
        .x(function(d) { return d.x })
        .y(function(d) { return d.y })

    svg.append('path')
        .attr('stroke', 'red')
        .attr('stroke-width', '3')
        .attr('d', lineGen([{x: p1.x, y: p1.y}, {x: q1.x, y: q1.y}]))

    svg.append('path')
        .attr('stroke', 'red')
        .attr('stroke-width', '3')
        .attr('d', lineGen([{x: p2.x, y: p2.y}, {x: q2.x, y: q2.y}]))
}


var show_anchors = function(){

    if (showing_anchors == false){
        for (link of window.graph.links){
            for (anchor of link.anchors){
                svg.append('circle')
                    .attr('class', 'anchor-circle')
                    .attr('cx', anchor.x)
                    .attr('cy', anchor.y)
                    .attr('r', 3)
                    .attr('fill', 'black')
            }
        }
        showing_anchors = true
    } else {
        svg.selectAll('.anchor-circle').remove()
        showing_anchors = false
    }
}


var count_bundled_edges = function(){
    div = document.getElementById('bundles_div')
    num_bundles = 0

    div.innerHTML = num_bundles
}


var swapArrayElements = function(arr, indexA, indexB) {
  var temp = arr[indexA];
  arr[indexA] = arr[indexB];
  arr[indexB] = temp;
};