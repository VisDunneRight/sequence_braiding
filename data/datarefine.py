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

json.dump(res, out, indent=4)