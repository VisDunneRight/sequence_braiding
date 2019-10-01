//Written by Paul Stothard, University of Alberta, Canada

function pairwiseAlignDna (sequences) {	

	//var MATCH_SCORE = 2;
	//var MISMATCH_SCORE = -1;
	//var GAP_PENALTY = 2;

	//var BEGIN_GAP_PENALTY = 0;
	//var END_GAP_PENALTY = 0;
	

	//sequences = ['blad', 'bsldsd', 'blad', 'bsd', 'lsd', 'slad', 'blad', 'lad', 'ladds', 'lad', 'nblsdf', 'sslllds', 'ladfs', 'lsd', 'nnlasdf']
	
	/*
	while (sequences.length > 1){
		seq_al = seq_align(sequences)
		sequences.splice(sequences.indexOf(seq_al.to_remove_i), 1)
		sequences.splice(sequences.indexOf(seq_al.to_remove_j), 1)
		sequences.push(merge_align(seq_al.best_align))
	}

	console.log(sequences)
	console.log(sequences[0].length)
	return sequences[0]*/

	//sequences = ['blad', 'bsldsd', 'blad', 'bsd', 'lsd', 'slad', 'blad', 'lad', 'ladds', 'lad', 'nblsdf', 'sslllds', 'ladfs', 'lsd', 'nnlasdf']
	
	/*
	aligns = []
	
	console.log(sequences)

	while (sequences.length > 1){
		seq_al = seq_align(sequences)
		console.log(seq_al)
		console.log('i: ' + seq_al.to_remove_i + '\tj: ' + seq_al.to_remove_j + '\t= ' + merge_align(seq_al.best_align))
		sequences.splice(sequences.indexOf(seq_al.to_remove_i), 1)
		sequences.splice(sequences.indexOf(seq_al.to_remove_j), 1)
		sequences.push(merge_align(seq_al.best_align))
		console.log(sequences)
	}

	console.log(sequences)
	*/
	var MATCH_SCORE = opt.MATCH_SCORE;
	var MISMATCH_SCORE = opt.MISMATCH_SCORE;
	var BEGIN_GAP_PENALTY = opt.BEGIN_GAP_PENALTY;
	var GAP_PENALTY = opt.GAP_PENALTY;
	var END_GAP_PENALTY = opt.END_GAP_PENALTY;

	final_seq = ''
	while (sequences.length > 1){
		newDnaOne = sequences[0];
		newDnaTwo = sequences[1];

		//change to arrays for pass by reference, so that large sequence isn't copied
		if (newDnaOne.search(/./) != -1) newDnaOne = newDnaOne.match(/./g);	
		if (newDnaTwo.search(/./) != -1) newDnaTwo = newDnaTwo.match(/./g);
		
		alignment = pairwiseDna(newDnaOne, newDnaTwo, MATCH_SCORE, MISMATCH_SCORE, GAP_PENALTY, BEGIN_GAP_PENALTY, END_GAP_PENALTY);
		sequences.shift()
		sequences.shift()
		sequences.push(merge_align(alignment))
	}

	return sequences[0]


	/*
	aligns = []

	window.original_sequences = Object.assign([], sequences)
	
	//for (s of sequences) console.log(s)

	while (sequences.length > 1){
		seq_al = seq_align(sequences)
		//console.log('i: ' + seq_al.to_remove_i + '\tj: ' + seq_al.to_remove_j + '\t= ' + merge_align(seq_al.best_align))
		sequences.splice(sequences.indexOf(seq_al.to_remove_i), 1)
		sequences.splice(sequences.indexOf(seq_al.to_remove_j), 1)
		aligns.push(merge_align(seq_al.best_align))
	}

	if (sequences.length == 1) {aligns.push(sequences[0])}

	while (aligns.length > 2) {
		sequences = Object.assign([], aligns)
		aligns = []

		while (sequences.length > 2){
			seq_al = seq_align(sequences)
			sequences.splice(sequences.indexOf(seq_al.to_remove_i), 1)
			sequences.splice(sequences.indexOf(seq_al.to_remove_j), 1)
			aligns.push(merge_align(seq_al.best_align))
		}
		
		if (sequences.length == 1) {aligns.push(sequences[0])}
		if (sequences.length == 2){
			aligns.push(sequences[0])
			aligns.push(sequences[1])
		}

	}*/

	//console.log(aligns)
	//console.log(seq_align(aligns))

	//final_seq = merge_align(seq_align(aligns).best_align)

	//console.log(final_seq)

	//return final_seq;
}	


function merge_align (align) {
	res = ''
	for (var i = 0; i<align.getAlignedM().length; i++){
		if (align.getAlignedM()[i] != '-') res += align.getAlignedM()[i]
		else res += align.getAlignedN()[i]
	}
	return res
}


function is_valid_sequence (seq0, sequences) {
	for (k in sequences){
		l1_i = 0
		seq1 = sequences[k]
		
		for (i=l1_i; i<seq0.length; i++){

		}	
	}
	return true
}


function seq_align (sequences) {

	var MATCH_SCORE = opt.MATCH_SCORE;
	var MISMATCH_SCORE = opt.MISMATCH_SCORE;
	var BEGIN_GAP_PENALTY = opt.BEGIN_GAP_PENALTY;
	var GAP_PENALTY = opt.GAP_PENALTY;
	var END_GAP_PENALTY = opt.END_GAP_PENALTY;

	var best_score = -10000

	to_remove_i = null
	to_remove_j = null
	best_align = null
	
	for (i=0; i<sequences.length; i++){
		for (j=i+1; j<sequences.length; j++){

			newDnaOne = sequences[i];
			newDnaTwo = sequences[j];

			//change to arrays for pass by reference, so that large sequence isn't copied
			if (newDnaOne.search(/./) != -1) newDnaOne = newDnaOne.match(/./g);	
			if (newDnaTwo.search(/./) != -1) newDnaTwo = newDnaTwo.match(/./g);
			
			alignment = pairwiseDna(newDnaOne, newDnaTwo, MATCH_SCORE, MISMATCH_SCORE, GAP_PENALTY, BEGIN_GAP_PENALTY, END_GAP_PENALTY);
			if (alignment.score >= best_score) {
				best_score = alignment.score
				to_remove_i = sequences[i]
				to_remove_j = sequences[j]
				best_align = alignment
			}
		}
	}

	return {to_remove_i: to_remove_i, to_remove_j: to_remove_j, best_align: best_align}
}


function addReturns (sequence) {
	sequence = sequence.replace(/(.{60})/g, 
                    function (str, p1, offset, s) {
                      	return p1 + "\n";
                   }
        );
	return sequence;
}


function pairwiseDna (newDnaOne, newDnaTwo, matchScore, mismatchScore, gapPenalty, beginGapPenalty, endGapPenalty)	{

	//can use one or both.
	//can compare scores (should be identical)
	var useLinearSpace = true;
	var useQuadraticSpace = false;
	
	var matrix = new Identity();
	matrix.setMatch(matchScore);
	matrix.setMismatch(mismatchScore);

	var scoreSet = new ScoreSet();
	scoreSet.setScoreSetParam(matrix, gapPenalty, beginGapPenalty, endGapPenalty);
	
	var alignment;
	
	if (useLinearSpace) {
		alignment = new AlignPairLinear();
		alignment.setAlignParam(newDnaOne, newDnaTwo, scoreSet);
		alignment.align();

		return alignment
	}
}



//------------------------------------ ScoreSet class

//ScoreSet getScore
function getScore (r1, r2) {
	return this.scoringMatrix.scoringMatrix_getScore(r1, r2);	
}

//ScoreSet setScoreSetParam
function setScoreSetParam (scoringMatrix, gapPenalty, beginGapPenalty, endGapPenalty) {
	this.scoringMatrix = scoringMatrix;
	this.gap = gapPenalty;
	this.beginGap = beginGapPenalty;
	this.endGap = endGapPenalty;
}

//ScoreSet class
function ScoreSet () {
	this.scoringMatrix;
	this.gap;
	this.beginGap;
	this.endGap;
	this.useBeginGapTop = true;
	this.useBeginGapLeft = true;
	this.useEndGapBottom = true;
	this.useEndGapRight = true;
}

//create and throw away a prototype object
new ScoreSet();

//define object methods
ScoreSet.prototype.getScore = getScore;
ScoreSet.prototype.setScoreSetParam = setScoreSetParam;

//------------------------------------


//------------------------------------ ScoringMatrix abstract class
//ScoringMatrix getScore method
function scoringMatrix_getScore(r1, r2) {
	r1 = r1.toLowerCase();
	r2 = r2.toLowerCase();
	if (r1 == r2) {
		return this.match;
	}
	else {
		return this.mismatch;
	}
}

//ScoringMatrix class
function ScoringMatrix() {
	this.mismatch;
	this.match;
}

//create and throw away a prototype object
new ScoringMatrix();

//define object methods
ScoringMatrix.prototype.scoringMatrix_getScore = scoringMatrix_getScore;

//------------------------------------ Identity class extends ScoringMatrix Class
//Identity class setMismatch method
function setMismatch(mismatchScore) {
	this.mismatch = mismatchScore;
}

//Identity class setMatch method
function setMatch(matchScore) {
	this.match = matchScore;
}

//Identity class
function Identity () {
}

Identity.prototype = new ScoringMatrix();
Identity.prototype.setMismatch = setMismatch;
Identity.prototype.setMatch = setMatch;

//Written by Paul Stothard, University of Alberta, Canada

//This class performs alignments in linear space, by recursively dividing
//the alignment. Once subalignments of acceptable size are obtained, they
//are solved using the quadratic space implementation in align_pair_quad.js.

//To use this class: (see pairwise_dna.js for example)
//var alignment = new AlignPairLinear();
//alignment.initializeMatrix(sequenceArrayM, sequenceArrayN, scoreSet);
//alignment.fillMatrix();
//alignment.align();
//var alignedSequenceStringM = alignment.getAlignedM();
//var alignedSequenceStringN = alignment.getAlignedN();

//------------------------------------ AlignPairLinear class
//AlignPairLinear class align() method
function align () {
	if (this.M.length == 0) {

		for (var j = 1; j <= this.N.length; j++) {
			this.alignedM.push("-");
			this.alignedN.push(this.N[j - 1]);
			this.score = this.score + this.scoreSet.gap;			
		}
	}
	else if (this.N.length == 0) {
		for (var j = 1; j <= this.M.length; j++) {
			this.alignedN.push("-");
			this.alignedM.push(this.M[j - 1]);
			this.score = this.score + this.scoreSet.gap;			
		}

	}
	else if ((this.M.length == 0) && (this.N.length == 0)) {
		//do nothing
	}
	else {
		this.path(0, 0, this.M.length, this.N.length);
	}
}

//AlignPairLinear class recursive method path()
function path (i1, j1, i2, j2) {

	//alert ("i1, j1, : i2, j2 " + i1 +", " + j1 + ", " + i2 + ", " + j2);

	if ((i1 + 1 == i2) || (j1 == j2)) {
		//align using quadratic space alignment
		var subM = new Array();
		var subN = new Array();

		for (var i = i1 + 1; i <= i2; i++) {
			subM.push(this.M[i-1]);	
		}

		for (var j = j1 + 1; j <= j2; j++) {
			subN.push(this.N[j-1]);	
		}

		var alignment = new AlignPairQuad();

		subScoreSet = new ScoreSet();
		if (j1 == j2) {

			if (j1 == 0) {
				subScoreSet.setScoreSetParam(this.scoreSet.scoringMatrix, this.scoreSet.beginGap, this.scoreSet.beginGap, this.scoreSet.beginGap);
			}
			else if (j1 == this.N.length) {
				subScoreSet.setScoreSetParam(this.scoreSet.scoringMatrix, this.scoreSet.endGap, this.scoreSet.endGap, this.scoreSet.endGap);
			}
			else {
				subScoreSet.setScoreSetParam(this.scoreSet.scoringMatrix, this.scoreSet.gap, this.scoreSet.gap, this.scoreSet.gap);
			}
		}
		else {
			
			subScoreSet.setScoreSetParam(this.scoreSet.scoringMatrix, this.scoreSet.gap, this.scoreSet.beginGap, this.scoreSet.endGap);
			subScoreSet.useBeginGapTop = false;
			subScoreSet.useBeginGapLeft = false;
			subScoreSet.useEndGapBottom = false;
			subScoreSet.useEndGapRight = false;

			if (i1 == 0) {
				subScoreSet.useBeginGapTop = true;
			}
	
			if (j1 == 0) {
				subScoreSet.useBeginGapLeft = true;
			}
			
			if (j2 == this.N.length) {
				subScoreSet.useEndGapRight = true;
			}

			if (i2 == this.M.length) {
				subScoreSet.useEndGapBottom = true;
			}
		}

		alignment.initializeMatrix(subM, subN, subScoreSet);
		alignment.fillMatrix();
		alignment.align();
		//alignment.dumpMatrix();
		this.alignedM.push(alignment.getAlignedM());
		this.alignedN.push(alignment.getAlignedN());

		this.score = this.score + alignment.score;		
	}
	else {
		var middle = Math.floor((i1 + i2)/2);

		//linear-space computation of alignment score to middle row
		//forward pass

		//gaps along top

		this.Sn[j1] = 0;
		
		if (i1 == 0) {
			for (var j = j1 + 1; j <= j2; j++) {
				this.Sn[j] = this.Sn[j - 1] - this.scoreSet.beginGap;
			}
		}
		else {
			for (var j = j1 + 1; j <= j2; j++) {
				this.Sn[j] = this.Sn[j - 1] - this.scoreSet.gap;
			}
		}

		//now continue down rows to middle row
		var diag;
		var left;
		//for (var i = i1 + 1; i <= i2; i++) {
		for (var i = i1 + 1; i <= middle; i++) {
			diag = this.Sn[j1];
			left;
			if (j1 == 0) {
				left = this.Sn[j1] - this.scoreSet.beginGap;
			}
			else {
				left = this.Sn[j1] - this.scoreSet.gap;
			}

			this.Sn[j1] = left;		
			
			//we need three values to set the score: diag, left, and above to fill in the row
			for (var j = j1 + 1; j <= j2; j++) {
				//above will be in the this.Sn array, which is holding a mixture of the previous row and the new row
				//var above = this.Sn[j];
			
				//pick max of three and store in next left
				if ((j == this.N.length) && (i == this.M.length)) {
					left = Math.max(this.Sn[j] - this.scoreSet.endGap, Math.max((left - this.scoreSet.endGap), diag + this.scoreSet.getScore(this.M[i-1], this.N[j-1])));
				}
				else if (i == this.M.length) {
					left = Math.max(this.Sn[j] - this.scoreSet.gap, Math.max((left - this.scoreSet.endGap), diag + this.scoreSet.getScore(this.M[i-1], this.N[j-1])));
				}
				else if (j == this.N.length) {
					left = Math.max(this.Sn[j] - this.scoreSet.endGap, Math.max((left - this.scoreSet.gap), diag + this.scoreSet.getScore(this.M[i-1], this.N[j-1])));
				}
				else {
					left = Math.max(this.Sn[j] - this.scoreSet.gap, Math.max((left - this.scoreSet.gap), diag + this.scoreSet.getScore(this.M[i-1], this.N[j-1])));
				}
				diag = this.Sn[j];
				
				//prepares this.Sn for use in next iteration of i loop
				this.Sn[j] = left;

			}	
		}
	
		//linear-space computation of alignment score to middle row
		//reverse pass

		//gaps along bottom

		this.Sp[j2] = 0;
		
		if (i2 == this.M.length) {
			for (var j = j2 - 1; j >= j1; j--) {
				this.Sp[j] = this.Sp[j + 1] - this.scoreSet.endGap;
			}
		}
		else {
			for (var j = j2 - 1; j >= j1; j--) {
				this.Sp[j] = this.Sp[j + 1] - this.scoreSet.gap;
			}
		}

		//now continue up rows to middle row
		var right;
		//for (var i = i2 - 1; i >= i1; i--) {
		for (var i = i2 - 1; i >= middle; i--) {
			diag = this.Sp[j2];
			if (j2 == this.N.length) {
				right = this.Sp[j2] - this.scoreSet.endGap;	
			}
			else {
				right = this.Sp[j2] - this.scoreSet.gap;	
			}

			this.Sp[j2] = right;

			//we need three values to set the score: diag, right, and below to fill in the row			
			for (var j = j2 - 1; j >= j1; j--) {
				//below will be in the this.Sp array, which is holding a mixture of the previous row and the new row
				//var below = this.Sp[j];
				
				//pick max of three and store in next right
				if ((j == 0) && (i == 0)) {
					right = Math.max(this.Sp[j] - this.scoreSet.beginGap, Math.max((right - this.scoreSet.beginGap), diag + this.scoreSet.getScore(this.M[i + 1 - 1], this.N[j + 1 - 1])));		
				}
				else if (j == 0) {
					right = Math.max(this.Sp[j] - this.scoreSet.beginGap, Math.max((right - this.scoreSet.gap), diag + this.scoreSet.getScore(this.M[i + 1 - 1], this.N[j + 1 - 1])));	
				}
				else if (i == 0) {
					right = Math.max(this.Sp[j] - this.scoreSet.gap, Math.max((right - this.scoreSet.beginGap), diag + this.scoreSet.getScore(this.M[i + 1 - 1], this.N[j + 1 - 1])));	
				}
				else {
					right = Math.max(this.Sp[j] - this.scoreSet.gap, Math.max((right - this.scoreSet.gap), diag + this.scoreSet.getScore(this.M[i + 1 - 1], this.N[j + 1 - 1])));		
				}		
				diag = this.Sp[j];
				this.Sp[j] = right;
			}

		}
	
		//now find the value of j that maximizes this.Sn[j] + this.Sp[j]
		//this point will be in the maximum scoring path in the final alignment.
		//once we have this point we can divide the problem into two new problems,
		

		var maxValue = this.Sn[j1] + this.Sp[j1];
		var maxJ = j1;

		for (var j = j1 + 1; j <= j2; j++) {
			if (this.Sn[j] + this.Sp[j] >= maxValue) {
				maxValue = this.Sn[j] + this.Sp[j];
				maxJ = j;
			}
		}

		this.path(i1, j1, middle, maxJ);
		this.path(middle, maxJ, i2, j2);

	}
}

//AlignPairLinear class getAlignedM() method
function getAlignedM() {
	return this.alignedM.join("");
}

//AlignPairLinear class getAlignedN() method
function getAlignedN() {
	return this.alignedN.join("");
}

//AlignPairLinear class setAlignParam method
function setAlignParam (M, N, scoreSet) {
	this.M = M;
	this.N = N;
	this.alignedM = new Array();
	this.alignedN = new Array();
	this.scoreSet = scoreSet;
	this.Sn = new Array(this.N.length);
	this.Sp = new Array(this.N.length);
	this.score = 0;
}

//AlignPairLinear class
function AlignPairLinear () {
	this.M;
	this.N;
	this.alignedM;
	this.alignedN;
	this.scoreSet;
	this.Sn;
	this.Sp;
	this.score;
}

//create and throw away a prototype object
new AlignPairLinear();

//define object methods
AlignPairLinear.prototype.align = align;
AlignPairLinear.prototype.path = path;
AlignPairLinear.prototype.setAlignParam = setAlignParam;
AlignPairLinear.prototype.getAlignedM = getAlignedM;
AlignPairLinear.prototype.getAlignedN = getAlignedN;


//Written by Paul Stothard, University of Alberta, Canada

//This class should be used for small alignments,
//since it uses O(nm) memory, where n and m are the sequence lengths.
//For larger alignments use the linear space algorithm implemented
//in align_pair_linear.js

//To use this class: (see pairwise_dna.js for example)
//var alignment = new AlignPairQuad();
//alignment.initializeMatrix(sequenceArrayM, sequenceArrayN, scoreSet);
//alignment.fillMatrix();
//alignment.align();
//var alignedSequenceStringM = alignment.getAlignedM();
//var alignedSequenceStringN = alignment.getAlignedN();

