import json
from datetime import datetime
from pprint import pprint

f = open('full.csv', 'r')
out = open('full_refined.csv', 'w')

for line in f:
	count = 0
	st = ''
	
	if len(line.split(',')[0].split('/')) == 3:
		curdate = datetime(int(line.split(',')[0].split('/')[2]), int(line.split(',')[0].split('/')[0]), int(line.split(',')[0].split('/')[1]))
		if curdate < datetime(2019, 2, 1): continue

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
seq_info_list = []
for line in f:
	spl = line.split(',')
	count += 1
	if count == 1: continue
	elif count == 2: cur_date = spl[0].strip() 
	elif spl[0] != cur_date: 
		cur_date = spl[0]
		if '"' in cur_date or "Remy" in cur_date: continue
		res.append(cur_seq) # eliminating dates with single events here!! may not be right
		cur_seq = []

		# here starts new section on sequence info
		seq_info_item = {
			'date' : cur_date,
			'seq_index' : len(res)
		}
		
		remyinfo = open('remy.csv', 'r')
		
		# carbs
		carbs_seq = []
		for l2 in remyinfo:
			if l2.split(',')[0] == cur_date:
				if l2.split(',')[12] != '':
					carbs_seq.append(l2.split(',')[12])

		seq_info_item['carbs'] = carbs_seq

		# time ratio
		tmpcgm = []
		cgminfo = open("csgmdatarefined2019.csv", 'r')
		for l2 in cgminfo:
			y = l2.split(",")[2].split(" ")[0].split("-")
			if y[0] == cur_date.split('/')[2] and int(y[1]) == int(cur_date.split('/')[0]) and int(y[2]) == int(cur_date.split('/')[1]):
				tmpcgm.append(l2.split(",")[3].strip())
		#print(cur_date, len(tmpcgm))
		
		very_high_percent = len(list(filter(lambda x: float(x) >= 250, tmpcgm)))/float(len(tmpcgm))
		high_percent = len(list(filter(lambda x: float(x) >= 180 and float(x) < 250, tmpcgm)))/float(len(tmpcgm))
		normal_percent = len(list(filter(lambda x: float(x) >= 70 and float(x) < 180, tmpcgm)))/float(len(tmpcgm))
		low_percent = len(list(filter(lambda x: float(x) >= 54 and float(x) < 70, tmpcgm)))/float(len(tmpcgm))
		very_low_percent = len(list(filter(lambda x: float(x) < 54, tmpcgm)))/float(len(tmpcgm))
		seq_info_item['time_ratio'] = {
			'very_high': very_high_percent,
			'high': high_percent,
			'normal': normal_percent,
			'low': low_percent,
			'very_low': very_low_percent
		}

		seq_info_list.append(seq_info_item)
		# end of seq info section

	if spl[2].strip() == 'Sugar to treat' or spl[2].strip() == 'Nothing': continue # eliminating sugar to treat. may not be right

	event = {
		'type': spl[2].strip(),
		'level': spl[1].strip(),
		'seq_index': len(res)
	}
	cur_seq.append(event)
	
json.dump(seq_info_list, open('seq_info.json', 'w'), indent=4)

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

		if j['type'] == 'Exercise snack' or j['type'] == 'Afternoon snack' or j['type'] == 'Bedtime snack': j['type'] = 'Snack'
		if j['type'] == 'Other (Describe what he is eating below)' or j['type'] == 'Nothing': j['type'] = 'Other'
		if j['type'] == 'Sugar to treat': j['type'] = 'Sugar'
    # else if (val < 70) return 'low';
    # else if (val < 180) return 'normal';
    # else if (val < 250) return 'high';
    # else return 'very_high';   

json.dump(res, out, indent=4)

