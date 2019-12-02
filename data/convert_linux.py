import xml.etree.ElementTree as ET 
import json
from github import Github
from pprint import pprint
from datetime import datetime

def convert_linux():
	f = open('linux_kernel_git_revlog.csv', 'r')

	authors = {}
	res = []

	count = 0
	for line in f:
		if count == 0: 
			count += 1
			continue

		author = line.strip().split(',')[7]
		if not author.isdigit(): continue

		if author not in authors:
			authors[author] = []

		textdate = datetime.fromtimestamp(int(line.split(',')[0])).strftime("%m/%d/%Y, %H:%M:%S")
		timestamp = str(round(int(line.split(',')[0])))

		if len(authors[author]) != 0 and timestamp == authors[author][len(authors[author])-1]['type']: continue

		authors[author].append({'type': timestamp, 'level':line.split(',')[3].split('/')[0]})

		count += 1

		#if count == 2000:
		#	break

	for author in authors:
		if len(authors[author]) < 5: continue
		authors[author] = sorted(authors[author], key=lambda x: x['type'])
		res.append(authors[author])

	json.dump(res, open('linuxcommits.json', 'w'), indent=4)

	print(count)

convert_linux()