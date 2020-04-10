import os
import csv
from pprint import pprint
import json

f2015 = csv.DictReader(open("happiness/2015.csv", 'r'))
f2016 = csv.DictReader(open("happiness/2016.csv", 'r'))
f2017 = csv.DictReader(open("happiness/2017.csv", 'r'))
f2018 = csv.DictReader(open("happiness/2018.csv", 'r'))
f2019 = csv.DictReader(open("happiness/2019.csv", 'r'))

filecollection = [f2015, f2016, f2017, f2018, f2019]

countrydict = {}

for file in filecollection:
    for line in file:
        countrykey = "Country"
        if countrykey not in line: countrykey = "Country or region"

        country = line[countrykey]
        if country not in countrydict:
            countrydict[country] = []

        # scorekey = "Happiness Rank"
        # if scorekey not in line:
        #     scorekey = "Happiness.Rank"
        # if scorekey not in line:
        #     scorekey = "Rank"
        # if scorekey not in line:
        #     print(line)

        scorekey = "Happiness Rank"
        if scorekey not in line:
            scorekey = "Happiness.Rank"
        if scorekey not in line:
            scorekey = "Overall rank"
        if scorekey not in line:
            print(line)

        score = line[scorekey]
        score = round(float(score)*100)/100

        countrydict[country].append(score)

    #print(line["Country"], line["Happiness Score"])
def filterdict(d):
    newdict = {}
    for elem in d:
        if len(d[elem]) < 5: continue
        elif d[elem][len(d[elem]) - 1] < 30: newdict[elem] = d[elem]
    return newdict

countrydict = filterdict(countrydict)
years = [2015, 2016, 2017, 2018, 2019]

res = []
for elem in countrydict:
    seq = []
    for item in range(len(countrydict[elem])):
        lvl = countrydict[elem][item]
        txtlvl = ''

        if lvl <= 5: txtlvl = "0 to 5"
        elif lvl <= 10: txtlvl = "5 to 10"
        elif lvl <= 15: txtlvl = "10 to 15"
        elif lvl <= 20: txtlvl = "15 to 20"
        elif lvl <= 25: txtlvl = "20 to 25"
        elif lvl <= 30: txtlvl = "25 to 30"
        else: txtlvl = "more than 30"

        seq.append({'type':years[item], 'level':txtlvl, 'seq_name': elem})
    res.append(seq)

#pprint(res)
outfile = open("happiness.json", "w")
json.dump(res, outfile, indent=True)
