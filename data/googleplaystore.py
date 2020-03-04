import json

def playstoredata():
    f = open("Google-Playstore-Full.csv")
    firstword = "rpg"

    count = 0
    for line in f:
        if count!=0:
            line = line.strip().lower()
            name = line.split(',')[0]
            ffirst = name.split(' ')[0]
            #print(ffirst)
            if ffirst != firstword:
                continue
            print(name)
        count+=1
        #if count==10: break

def wordlist():
    f = open("wordlist.txt")

    res = []
    for line in f:
        line = line.strip()
        if len(line) < 4: continue
        s = []
        for i, letter in enumerate(line):
            lettertype = 'unclassified'
            if letter in ['m', 'p', 'b']: lettertype = 'bilabial'
            if letter in ['f', 'v']: lettertype = 'labiodental'
            if letter in ['d', 'n', 's', 'z']: lettertype = 'alveolar'
            if letter in ['t']: lettertype = 'linguolabial-dental'
            if letter in ['j']: lettertype = 'palatal'
            if letter in ['k', 'g']: lettertype = 'velar'
            if letter in ['h']: lettertype = 'gloattal'
            if letter in ['a', 'e', 'i', 'o', 'u']: lettertype = 'vowel'
            if letter in ['w', 'y']: lettertype = 'semivowel'
            #if letter not in ['a', 'b', 'c']: continue
            s.append({'type':i, 'level':lettertype, 'seq_name':line})
        res.append(s)
    json.dump(res, open('wordlist.json', 'w'), indent=4)

#wordlist()

def athletes():
    from pprint import pprint
    f = open("athlete_events.csv", 'r')
    res = []
    tmpdict = {}
    sportname = "Fencing"

    for line in f:
        line = line.strip().split(',')
        year = line[9].replace('"', '')
        name = line[1].replace('"', '')
        team = line[6].replace('"', '')
        medal = line[14].replace('"', '')
        if len(line) == 16: medal = line[15].replace('"', '')
        sport = line[12].replace('"', '')
        #print(sport)
        #if team == 'Italy':
        #    print(name, year, team, medal)
        if sport == sportname:
            if team not in tmpdict:
                tmpdict[team] = {}
            if year not in tmpdict[team]:
                tmpdict[team][year] = 0
            if medal == "Gold" or medal == "Bronze" or medal == "Silver":
                tmpdict[team][year] += 1
            #if medal != "NA":
            #    print(medal)
    #pprint(tmpdict)

    for team in tmpdict:
        seq = []
        cutyear = 1980

        filterout = True
        for elem in tmpdict[team]:
            if int(elem) < cutyear: continue
            if tmpdict[team][elem] > 0:
                filterout = False
        if filterout: continue

        for elem in tmpdict[team]:
            if int(elem) < cutyear:
                continue
            #d = {}
            #print(tmpdict[team][elem])
            d = {'type': elem, 'seq_name': team}
            val = int(tmpdict[team][elem])
            #print(val)
            if val == 0: continue
            if val>0 and val<=3:
                val = val
            elif val>3 and val<=9:
                val = '4 to 9'
            elif val>9 and val<=20:
                val = '10 to 20'
            elif val>20 and val<=40:
                val = '20 to 40'
            elif val>40:
                val = 'more than 40'
            d['level'] = val
            seq.append(d)
        seq = sorted(seq, key = lambda x: x['type'])
        res.append(seq)
    #print(len(tmpdict))
    s = ['source']
    for i in range(cutyear, 2020, 4):
        s.append(str(i))
    s.append('sink')
    print(s)
    #pprint(res)
    print(len(res))
    json.dump(res, open('olympics.json', 'w'), indent=4)
athletes()
