
var data = null;
var numDays = getParams(window.location.href).numDays
if (numDays == undefined) {console.warn('undefined number of days'); numDays = 10}
var startDayNum = parseInt(getParams(window.location.href).startDayNum)
if (startDayNum == undefined) {startDayNum = 0}

var edge_stroke_weight = 8;
var edge_spacing = 8;

var width = window.innerWidth * 0.8;
var height = 300;

var levels = ['very_high', 'high', 'normal', 'low', 'very_low', 'unknown']

var find_path = function(data_sequences){
    var m_dict = {}
    var index_dict = {}

    count = 0
    for (i in data_sequences){
        for (j of data_sequences[i]){
            if (m_dict[j.type] == undefined) {m_dict[j.type] = String.fromCharCode(parseInt(count) + 65); count++}
        }
    }

    for (j in m_dict) index_dict[m_dict[j]] = j

    var count = 0
    char_sequences = []
    for (var day of data_sequences){
        day = day.filter(d => d.type.length > 1)

        res_str = ""
        for (m of day) res_str += m_dict[m.type]
        char_sequences.push(res_str)
        count++
        if (count > numDays) break
    }

    seq = pairwiseAlignDna(char_sequences)
    
    res = []
    for (i in seq){res.push(index_dict[seq[i]])}

    res.unshift('source')
    res.push('sink')
    return res
}

var gen_sequences_from_data = function(data){
    sequences = []

    count = 0
    for (var tmpseq of days_iterator(data)){
        tmpseq = tmpseq.filter(d => d.Meal.length >= 1 && d.Glucose != '')
        if (tmpseq.length == 0) continue
        seq = []

        for (event of tmpseq){
            if (event.Meal == 'Exercise snack') event.Meal = 'Snack'
            if (event.Meal == 'Other (Describe what he is eating below)') event.Meal = 'Other'
            seq.push({
                Date : event.Date,
                type : event.Meal,
                level : get_glucose_level(parseFloat(event.Glucose)),
                glucose_level: get_glucose_level(parseFloat(event.Glucose)),
                day : tmpseq,
                seq_index : count,
            })
        }

        sequences.push(seq)

        if (count>=numDays-1) break
        else count++
    }

    return sequences
}

var init_sankey = function(){
    d3.csv('../data/full.csv', (error, data) => {
        data = invert_order_of_data(data)

        d3.select('#braids-container')
            .attr('width', '100%')
            .attr('height', 300)

        window.data = select_days(data, numDays);
        data_sequences = gen_sequences_from_data(window.data)
        var path = find_path(data_sequences)

        newgraph = new SequenceBraiding(data_sequences, path)
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
