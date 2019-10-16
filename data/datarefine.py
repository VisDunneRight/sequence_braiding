import json

f = open('full.csv', 'r')
out = open('full_refined.csv', 'w')

for line in f:
	count = 0
	st = ''
	for elem in line.split(','):
		if count == 0 and len(elem) > 1: st += elem + ','
		if count == 10 and len(elem) > 1: st += elem + ','
		if count == 11 and len(elem) > 1: st += elem + ','
		count += 1
	if len(st.split(',')) == 4: out.write(st[:-1] + '\n')


f = open('full_refined.csv', 'r')
out = open('jsonglucose.json', 'w')

res = []
cur_seq = []
cur_date = ''
count = 0
for line in f:
	spl = line.split(',')
	count += 1
	if count == 1: continue
	elif count == 2: cur_date = spl[0].strip() 
	elif spl[0] != cur_date: 
		cur_date = spl[0]
		res.append(cur_seq)
		cur_seq = []
	
	event = {
		'type': spl[2].strip(),
		'level': spl[1].strip() 
	}
	cur_seq.append(event)
	
res.append(cur_seq)

res = res[::-1]
for i in range(len(res)):
	res[i] = res[i][::-1]

for i in res:
	for j in i:
		val = int(j['level']) 
		if val < 54: j['level'] = 'very_low';
		elif val < 70: j['level'] = 'low';
		elif val < 180: j['level'] = 'normal';
		elif val < 250: j['level'] = 'high';
		else: j['level'] = 'very_high'

		if j['type'] == 'Exercise snack' or j['type'] == 'Afternoon snack': j['type'] = 'Snack'
		if j['type'] == 'Other (Describe what he is eating below)' or j['type'] == 'Nothing': j['type'] = 'Other'
		if j['type'] == 'Sugar to treat': j['type'] = 'Sugar'
    # else if (val < 70) return 'low';
    # else if (val < 180) return 'normal';
    # else if (val < 250) return 'high';
    # else return 'very_high';   


json.dump(res, out, indent=4)