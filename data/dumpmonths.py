import csv
from pprint import pprint
import datetime
import json
import statistics
#import cpi

def getlvl(lvl):
    if lvl < 1: lvl = 'less than 1'
    elif lvl < 5: lvl = '1 to 5'
    elif lvl < 10: lvl = '5 to 10'
    elif lvl < 50: lvl = '10 to 50'
    elif lvl < 100: lvl = '50 to 100'
    elif lvl < 250: lvl = '100 to 250'
    elif lvl < 500: lvl = '250 to 500'
    elif lvl < 1000: lvl = '500 to 1000'
    else: lvl = 'more than 1000'
    return lvl

moviereader = csv.DictReader(open('IMDb movies.csv', 'r'))

yeardict = {}
yeardicttitles = {}

count = 0
fullcount = 0
for line in moviereader:
    fullcount += 1
    if line["country"] != "USA": continue
    if '-' in line["date_published"]:
        date = datetime.datetime.strptime(line["date_published"], '%Y-%m-%d')
        year = date.year
        month = date.month
    else:
        continue
    domestic_income = line["usa_gross_income"]
    if '$' in domestic_income:
        domestic_income = domestic_income.replace('$', '').strip()
    if 'EUR' in domestic_income:
        domestic_income = domestic_income.replace('EUR', '').strip()
    if 'GBP' in domestic_income:
        domestic_income = domestic_income.replace('GBP', '').strip()
    if 'HKD' in domestic_income:
        continue
    world_income = line["worlwide_gross_income"]
    if domestic_income == '': continue
    if year not in yeardict:
        yeardict[year] = {}
        yeardicttitles[year] = {}
    if month not in yeardict[year]:
        yeardict[year][month] = 0
        yeardicttitles[year][month] = []

    #income = cpi.inflate(float(domestic_income)/1000000, year)
    income = float(domestic_income)/1000000

    #yeardict[year][month] += income
    if income > yeardict[year][month]:
       yeardict[year][month] = income
    yeardicttitles[year][month].append({'title': line['title'], 'domestic_income': income})

pprint(yeardicttitles[2019])

getmedian = True

res = []
for year in yeardict:
    if year < 2000: continue
    seq = []

    if getmedian:
        medianlist = []
        for i in range(1, 13):
            if i not in yeardict[year]: continue
            medianlist.append(yeardict[year][i])
        median = statistics.median(medianlist)

        for i in range(1, 13):
            if i not in yeardict[year]: continue
            lvl = yeardict[year][i]

            if lvl < median*0.3: lvl = 'much less than median'
            elif lvl <= median*0.95: lvl = 'less than median'
            elif lvl < median*1.05: lvl = 'close to median'
            elif lvl < median*2: lvl = 'more than median'
            else: lvl = 'much more than median'

            seq.append({'type': i, 'level': lvl, 'seq_name': year})
        res.append(seq)
    else:
        for i in range(1, 13):
            if i not in yeardict[year]: continue
            lvl = getlvl(yeardict[year][i])
            if lvl == '500 to 1000': pprint(yeardicttitles[year])
            seq.append({'type': i, 'level': lvl, 'seq_name': year})
        res.append(seq)

json.dump(res, open('dumpmonths.json', 'w'), indent=4)
