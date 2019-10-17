
var data = null;
var numDays = getParams(window.location.href).numDays
if (numDays == undefined) {numDays = 25}
var startDayNum = parseInt(getParams(window.location.href).startDayNum)
if (startDayNum == undefined) {startDayNum = 0}

var edge_stroke_weight = 8;
var edge_spacing = 8;

var width = window.innerWidth * 0.8;
var height = 300;

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

    char_sequences = []
    for (var day of data_sequences){
        day = day.filter(d => d.type.length > 1)

        res_str = ""
        for (m of day) res_str += m_dict[m.type]
        char_sequences.push(res_str)
    }

    seq = pairwiseAlignDna(char_sequences)
    
    res = []
    for (i in seq){res.push(index_dict[seq[i]])}

    res.unshift('source')
    res.push('sink')
    return res
}

var init_sankey = function(daynum = numDays, svgname = 'braids-container-sandbox', opt=opt){
    d3.json('../data/jsonglucose.json', (error, data) => {
        newgraph = new SequenceBraiding(data, svgname, opt)
    })
}

opt = {}

//init_sankey()
