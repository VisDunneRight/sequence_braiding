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
    sports = ["Fencing", "Swimming", "Gymnastics", "Sailing", "Rowing"]
    for sporti in sports:
        f = open("athlete_events.csv", 'r')
        res = []
        tmpdict = {}
        sportname = sporti

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
        json.dump(res, open('olympics/' + sporti + '.json', 'w'), indent=4)

def covid():
    # Province/State,Country/Region,Lat,Long,Date,Confirmed,Deaths,Recovered
    import csv
    from pprint import pprint
    import datetime
    import math
    import json

    def iso_year_start(iso_year):
        "The gregorian calendar date of the first day of the given ISO year"
        fourth_jan = datetime.date(iso_year, 1, 4)
        delta = datetime.timedelta(fourth_jan.isoweekday()-1)
        return fourth_jan - delta

    def iso_to_gregorian(iso_year, iso_week, iso_day):
        "Gregorian calendar date for the given ISO year, week and day"
        year_start = iso_year_start(iso_year)
        return year_start + datetime.timedelta(days=iso_day-1, weeks=iso_week-1)

    f = csv.DictReader(open('covid_19_clean_complete.csv', 'r'), delimiter=',')
    res = []
    tmpdict = {}

    count = 0
    for line in f:
        if line['Confirmed'] == '0':
            continue

        country = line['Country/Region']
        date = line['Date']
        numconfirmed = line['Confirmed']

        weeknum = datetime.datetime.strptime(date, '%m/%d/%y').isocalendar()[1]
        date = iso_to_gregorian(2020, weeknum, 0)
        date = datetime.datetime.strftime(date, '%-m/%-d/%y')

        #if line['Country/Region'] != "Poland": continue
        if country not in tmpdict:
            tmpdict[country] = {}
        if date not in tmpdict[country]:
            tmpdict[country][date] = 0
        tmpdict[country][date] += int(numconfirmed)
        #print(line['Country/Region'], line['Province/State'], line['Date'])

        count+=1

    percentdict = {}
    for country in tmpdict:
        curdate = datetime.datetime.strptime('1/5/20', '%m/%d/%y')
        percentdict[country] = {}
        #for d in tmpdict[country]:
        #    print(d)
        #    print(datetime.strptime(d, '%m/%d/%y'))
        for i in range(20):
            prevdate = curdate
            curdate += datetime.timedelta(days=7)
            curdatestr = datetime.datetime.strftime(curdate, '%-m/%-d/%y')
            prevdatestr =  datetime.datetime.strftime(prevdate, '%-m/%-d/%y')
            print(curdatestr, prevdatestr)
            if prevdatestr not in tmpdict[country] or curdatestr not in tmpdict[country]:
                continue
            else:
                diff = tmpdict[country][curdatestr] - tmpdict[country][prevdatestr]
                percentdiff = math.floor(10*diff*100/float(tmpdict[country][prevdatestr]))/10
                percentdict[country][curdatestr] = percentdiff

    #print(percentdict['Italy'])
    for country in percentdict:
        seq = []
        for elem in percentdict[country]:
            level = percentdict[country][elem]
            if level <= 0:
                level = '0%'
            elif level > 0 and level <= 10:
                level = '0% to 10%'
            elif level > 10 and level <= 50:
                level = '10% to 50%'
            elif level > 50 and level <= 100:
                level = '50% to 100%'
            elif level > 100 and level <= 200:
                level = '100% to 200%'
            elif level > 200 and level <= 500:
                level = '200% to 500%'
            else:
                level = 'more than 500%'
            seq.append({'seq_name': country, 'type': elem, 'level': level})
        seq = sorted(seq, key = lambda x: datetime.datetime.strptime(x['type'], '%m/%d/%y'))
        #if country == "Italy": print(seq)
        res.append(seq)

    # daysarray = ['source']
    # curdate = datetime.datetime.strptime('1/1/20', '%m/%d/%y')
    # for i in range(90):
    #     curdate += datetime.timedelta(days=1)
    #     daysarray.append(datetime.datetime.strftime(curdate, '%-m/%-d/%y'))
    # daysarray.append('sink')
    # print(daysarray)

    json.dump(res, open('covid.json', 'w'), indent=4)
    #pprint(tmpdict)

def covid2():
    # Province/State,Country/Region,Lat,Long,Date,Confirmed,Deaths,Recovered
    import csv
    from pprint import pprint
    import datetime
    import math
    import json

    def iso_year_start(iso_year):
        "The gregorian calendar date of the first day of the given ISO year"
        fourth_jan = datetime.date(iso_year, 1, 4)
        delta = datetime.timedelta(fourth_jan.isoweekday()-1)
        return fourth_jan - delta

    def iso_to_gregorian(iso_year, iso_week, iso_day):
        "Gregorian calendar date for the given ISO year, week and day"
        year_start = iso_year_start(iso_year)
        return year_start + datetime.timedelta(days=iso_day-1, weeks=iso_week-1)

    f = csv.DictReader(open('covid_19_clean_complete.csv', 'r'), delimiter=',')
    res = []
    tmpdict = {}

    count = 0
    for line in f:
        if line['Confirmed'] == '0':
            continue

        country = line['Country/Region']
        date = line['Date']
        numconfirmed = line['Confirmed']

        weeknum = datetime.datetime.strptime(date, '%m/%d/%y').isocalendar()[1]
        date = iso_to_gregorian(2020, weeknum, 0)
        date = datetime.datetime.strftime(date, '%-m/%-d/%y')

        #if line['Country/Region'] != "Poland": continue
        if country not in tmpdict:
            tmpdict[country] = {}
        if date not in tmpdict[country]:
            tmpdict[country][date] = 0
        tmpdict[country][date] += int(numconfirmed)
        #print(line['Country/Region'], line['Province/State'], line['Date'])

        count+=1

    percentdict = {}
    for country in tmpdict:
        curdate = datetime.datetime.strptime('1/5/20', '%m/%d/%y')
        percentdict[country] = {}
        #for d in tmpdict[country]:
        #    print(d)
        #    print(datetime.strptime(d, '%m/%d/%y'))
        for i in range(20):
            prevdate = curdate
            curdate += datetime.timedelta(days=7)
            curdatestr = datetime.datetime.strftime(curdate, '%-m/%-d/%y')
            prevdatestr =  datetime.datetime.strftime(prevdate, '%-m/%-d/%y')
            if prevdatestr not in tmpdict[country] or curdatestr not in tmpdict[country]:
                continue
            else:
                diff = tmpdict[country][curdatestr] - tmpdict[country][prevdatestr]
                percentdiff = math.floor(10*diff*100/float(tmpdict[country][prevdatestr]))/10
                percentdict[country][curdatestr] = percentdiff

    #print(percentdict['Italy'])
    for country in tmpdict:
        seq = []
        for elem in tmpdict[country]:
            level = tmpdict[country][elem]
            # if level <= 0:
            #     level = '0%'
            # elif level > 0 and level <= 10:
            #     level = '0% to 10%'
            # elif level > 10 and level <= 50:
            #     level = '10% to 50%'
            # elif level > 50 and level <= 100:
            #     level = '50% to 100%'
            # elif level > 100 and level <= 200:
            #     level = '100% to 200%'
            # elif level > 200 and level <= 500:
            #     level = '200% to 500%'
            # else:
            #     level = 'more than 500%'
            if level <= 5:
                level = '1 to 5'
            elif level > 5 and level <= 10:
                level = '5 to 10'
            elif level > 10 and level <= 20:
                level = '10 to 20'
            elif level > 20 and level <= 100:
                level = '20 to 100'
            elif level > 100 and level <= 200:
                level = '100 to 200'
            elif level > 200 and level <= 500:
                level = '200 to 500'
            else:
                level = 'more than 500'
            seq.append({'seq_name': country, 'type': elem, 'level': level})
        seq = sorted(seq, key = lambda x: datetime.datetime.strptime(x['type'], '%m/%d/%y'))
        #if country == "Italy": print(seq)
        res.append(seq)

    # daysarray = ['source']
    # curdate = datetime.datetime.strptime('1/1/20', '%m/%d/%y')
    # for i in range(90):
    #     curdate += datetime.timedelta(days=1)
    #     daysarray.append(datetime.datetime.strftime(curdate, '%-m/%-d/%y'))
    # daysarray.append('sink')
    # print(daysarray)

    json.dump(res, open('covid2.json', 'w'), indent=4)


covid2()
#athletes()
