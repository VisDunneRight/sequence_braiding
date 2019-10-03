
var data = null;
var numDays = getParams(window.location.href).numDays
if (numDays == undefined) {console.warn('undefined number of days'); numDays = 10}
var startDayNum = parseInt(getParams(window.location.href).startDayNum)
if (startDayNum == undefined) {startDayNum = 0}

var edge_stroke_weight = 8;
var edge_spacing = 8;

var width = window.innerWidth * 0.8;
var height = 300;

var glucose_levels = ['very_high', 'high', 'normal', 'low', 'very_low', 'unknown']

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

var init_sankey = function(){
    d3.csv('../data/full.csv', (error, data) => {
        data = invert_order_of_data(data)

        d3.select('#braids-container')
            .attr('width', '100%')
            .attr('height', 300)

        window.data = select_days(data, numDays);
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
