import csv
from pprint import pprint
import json

def analyze_games():
	f = open("metacritic_games.csv", 'r')
	f2 = open("vgsales-12-4-2019.csv")

	main_consoles = ['PC', 'PS2', 'PS3', 'X360', 'Wii', 'PS4', 'PS', 'NES', 'WiiU', 'XOne', 'N64', 'GEN', 'SNES', 'XB', 'SAT', '2600', 'Linux', 'OSX', '3DO', 'DC', 'NG', '5200', 'PCFX', 'GC', '7800', 'C64', 'PCE', 'CDi', 'Int', 'MS', 'SCD', 'ZXS', 'Amig', 'AJ', 'Arc', 'CD32', 'S32X']
	handhelds = ['GB', 'DS', 'GBA', '3DS', 'GBC', 'PSP', 'PSV', 'DSi', 'And', 'DSiW', 'NGage', 'Lynx', 'iOS', 'GG', 'WS', 'WinP', 'Ouya', 'VB', 'Mob', 'iQue', 'GIZ']
	other_consoles = ['PSN', 'XBL', 'WW', 'NS', 'VC', 'BRW']
	weirdness = []

	franchises = {}
	games = []

	game = 'Mass Effect'

	csv_reader = csv.DictReader(f)
	for line in csv_reader:

		if game not in line['name']: continue
		if line['platform'] in handhelds or line['platform'] in other_consoles: continue

		year = line['release_date'].split(',')[1].strip()

		element = {'year': year, 'name': line['name'], 'platform': line['platform'], 'score': float(line['metascore'])/10}
		games.append(element)

	csv_reader = csv.DictReader(f2)
	for line in csv_reader:

		if game not in line['Name']: continue
		if line['Platform'] in handhelds or line['Platform'] in other_consoles: continue

		score = ''
		if line['User_Score'] != '':
			score = line['User_Score']
		elif line['Critic_Score'] != '':
			score = line['Critic_Score']

		element = {'year': line['Year'], 'name': line['Name'], 'platform': line['Platform'], 'score': score}
		games.append(element)

	games_refined = []
	titles = []
	for elem in games:
		if elem['name'] in titles: 
			continue
		
		filt = list(filter(lambda x: x['name'] == elem['name'], games))

		maxscore = 0
		if len(list(filter(lambda x: x['score'] != '', filt))) != 0: 
			filt = list(filter(lambda x: x['score'] != '', filt))
			maxscore = max([float(el['score']) for el in filt])
		else:
			maxscore = ''

		titles.append(elem['name'])

		elem['score'] = maxscore
		elem['platform'] = [el['platform'] for el in filt if el['score'] == maxscore][0]

		games_refined.append(elem)

		#print(filt)
		#print(maxscore)
		
	games_refined.sort(key=lambda x: x['year'])
	pprint(games_refined)


def get_franchises(franchises):
	sequences = []
	
	for franchise in franchises:
		#print(franchise)
		sequence = []
		
		count = 0

		for movie in franchises[franchise]:
			#print(movie)
			movie_file = open("IMDb movies.csv", 'r')
			csv_reader = csv.DictReader(movie_file)
			
			vote = 0

			if movie == "Rocky":
				vote = 8.0
			else:
				for line in csv_reader:
					if movie.lower() == line['title'].lower():
						print(line['title'])
						vote = myround(float(line['avg_vote']))

			elem = {'type': count, 'level': vote, 'label':movie, 'seq_name':franchise}
			sequence.append(elem)

			count += 1
		sequences.append(sequence)

	return sequences


def myround(x, base=0.5):
    return base * round(x/base)


def analyze_movies():

	franchises = {
		"Marvel":[
			"Iron Man",
			"The Incredible Hulk",
			"Iron Man 2",
			"Thor",
			"Captain America: The First Avenger",
			"The Avengers",
			"Iron Man Three",
			"Thor: The Dark World",
			"Captain America: The Winter Soldier",
			"Guardians of the Galaxy",
			"Avengers: Age of Ultron",
			"Ant-Man",
			"Captain America: Civil War",
			"Doctor Strange",
			"Guardians of the Galaxy Vol. 2",
			"Spider-Man: Homecoming",
			"Thor: Ragnarok",
			"Black Panther",
			"Avengers: Infinity War",
			"Ant-Man and the Wasp",
			"Captain Marvel",
			"Avengers: Endgame",
			"Spider-Man: Far From Home"
		],
		'Star Wars':[
				'Star Wars',
				'Star Wars: Episode V - The Empire Strikes Back',
				'Star Wars: Episode VI - Return of the Jedi',
				'Star Wars: Episode I - The Phantom Menace',
				'Star Wars: Episode II - Attack of the Clones',
				'Star Wars: Episode III - Revenge of the Sith',
				'Rogue One',
				'Star Wars: Episode VII - The Force Awakens',
				'Star Wars: Episode VIII - The Last Jedi',
				'Solo: A Star Wars Story'
				],
		# 'Disney Live Action'
		'Harry Potter':[
			"Harry Potter and the Sorcerer's Stone",
			"Harry Potter and the Chamber of Secrets",
			"Harry Potter and the Prisoner of Azkaban",
			"Harry Potter and the Goblet of Fire",
			"Harry Potter and the Order of the Phoenix",
			"Harry Potter and the Half-Blood Prince",
			"Harry Potter and the Deathly Hallows: Part 1",
			"Harry Potter and the Deathly Hallows: Part 2",
			"Fantastic Beasts and Where to Find Them",
			"Fantastic Beasts: The Crimes of Grindelwald"
		],
		"Spider-Man":[
			"Spider-Man",
			"Spider-Man 2",
			"Spider-Man 3",
			"The Amazing Spider-Man",
			"The Amazing Spider-Man 2",
			"Spider-Man: Homecoming",
			"Spider-Man: Into the Spider-Verse",
			"Spider-Man: Far From Home"
		],
		"X-Men":[
			"X-Men",
			"X2",
			"X-Men: The Last Stand",
			"X-Men Origins: Wolverine",
			"X: First Class",
			"The Wolverine",
			"X-Men: Days of Future Past",
			"Deadpool",
			"X-Men: Apocalypse",
			"Logan",
			"Deadpool 2",
			"Dark Phoenix"
		],
		"Batman":[
			"Batman",
			"Batman Returns",
			"Batman: Mask of the Phantasm",
			"Batman Forever",
			"Batman & Robin",
			"Batman Begins",
			"The Dark Knight",
			"The Dark Knight Rises",
			"Batman v Superman: Dawn of Justice",
			"Suicide Squad",
			"The Lego Batman Movie",
			"Justice League",
			"Joker"
		],
		"James Bond":[
			"Dr. No",
			"From Russia with Love",
			"Goldfinger",
			"Thunderball",
			"You Only Live Twice",
			"On Her Majesty's Secret Service",
			"Diamonds Are Forever",
			"Live and Let Die",
			"The Man with the Golden Gun",
			"Moonraker",
			"For Your Eyes Only",
			"Octopussy",
			"A View to a Kill",
			"The Living Daylights",
			"Licence to Kill",
			"GoldenEye",
			"Tomorrow Never Dies",
			"The World is Not Enough",
			"Die Another Day",
			"Casino Royale",
			"Quantum of Solace",
			"Skyfall",
			"Spectre"
		],
		"DC":[
			"Man of Steel",
			"Batman v Superman: Dawn of Justice",
			"Suicide Squad",
			"Wonder Woman",
			"Justice League",
			"Aquaman",
			"Shazam!"
		],
		"Middle Earth":[
			"The Lord of the Rings: The Fellowship of the Ring",
			"The Lord of the Rings: The Two Towers",
			"The Lord of the Rings: The Return of the King",
			"The Hobbit: An Unexpected Journey",
			"The Hobbit: The Desolation of Smaug",
			"The Hobbit: The Battle of the Five Armies"
		],
		"Jurassic Park": [
			"Jurassic Park",
			"The Lost World: Jurassic Park",
			"Jurassic Park III",
			"Jurassic World",
			"Jurassic World: Fallen Kingdom"
		],
		"Fast and Furious":[
			"The Fast and the Furious",
			"2 Fast 2 Furious",
			"The Fast and the Furious: Tokyo Drift",
			"Fast & Furious",
			"Fast Five",
			"Furious 6",
			"Furious Seven",
			"The Fate of the Furious",
			"Fast & Furious Presents: Hobbs & Shaw"
		],
		"Transformers":[
			"Transformers",
			"Transformers: Revenge of the Fallen",
			"Transformers: Dark of the Moon",
			"Transformers: Age of Extinction",
			"Transformers: The Last Knight",
			"Bumblebee"
		],
		"Pirates of the Caribbean":[
			"Pirates of the Caribbean: The Curse of the Black Pearl",
			"Pirates of the Caribbean: Dead Man's Chest",
			"Pirates of the Caribbean: At World's End",
			"Pirates of the Caribbean: On Stranger Tides",
			"Pirates of the Caribbean: Dead Men Tell No Tales"
		],
		"Hunger Games":[
			"The Hunger Games",
			"The Hunger Games: Catching Fire",
			"The Hunger Games: Mockingjay - Part 1",
			"The Hunger Games: Mockingjay - Part 2"
		],
		"Shrek":[
			"Shrek",
			"Shrek 2",
			"Shrek the Third",
			"Shrek Forever After", 
			"Puss in Boots"
		],
		"Star Trek":[
			"Star Trek: The Motion Picture",
			"Star Trek II: The Wrath of Khan",
			"Star Trek III: The Search for Spock",
			"Star Trek IV: The Voyage Home",
			"Star Trek V: The Final Frontier",
			"Star Trek VI: The Undiscovered Country",
			"Star Trek: Generations",
			"Star Trek: First Contact",
			"Star Trek: Insurrection",
			"Star Trek: Nemesis",
			"Star Trek",
			"Star Trek Into Darkness",
			"Star Trek Beyond"
		],
		"Twilight":[
			"Twilight",
			"The Twilight Saga: New Moon",
			"The Twilight Saga: Eclipse",
			"The Twilight Saga: Breaking Dawn - Part 1",
			"The Twilight Saga: Breaking Dawn - Part 2"
		],
		"Toy Story":[
			"Toy Story",
			"Toy Story 2",
			"Toy Story 3",
			"Toy Story 4"
		],
		"Despicable Me":[
			"Despicable Me",
			"Despicable Me 2",
			"Minions",
			"Despicable Me 3"
		],
		"Mission: Impossible":[
			"Mission: Impossible",
			"Mission: Impossible II",
			"Mission: Impossible III",
			"Mission: Impossible - Ghost Protocol",
			"Mission: Impossible - Rogue Nation",
			"Mission: Impossible - Fallout"
		],
		# Superman
		"Indiana Jones": [
			"Raiders of the Lost Ark",
			"Indiana Jones and the Temple of Doom",
			"Indiana Jones and the Last Crusade",
			"Indiana Jones and the Kingdom of the Crystal Skull"
		],
		# incredibles
		# finding nemo
		"Bourne":[
			"The Bourne Identity",
			"The Bourne Supremacy",
			"The Bourne Ultimatum",
			"The Bourne Legacy",
			"Jason Bourne"
		],
		"Planet of the Apes":[
			"Planet of the Apes",
			"Rise of the Planet of the Apes",
			"Dawn of the Planet of the Apes",
			"War for the Planet of the Apes"
		],
		"Ice Age":[
			"Ice Age",
			"Ice Age: The Meltdown",
			"Ice Age: Dawn of the Dinosaurs",
			"Ice Age: Continental Drift",
			"Ice Age: Collision Course"
		],
		"Rocky":[
			"Rocky",
			"Rocky II",
			"Rocky III",
			"Rocky IV",
			"Rocky V",
			"Rocky Balboa",
			"Creed",
			"Creed II"
		],
		"Rambo":[
			"First Blood",
			"Rambo: First Blood Part II",
			"Rambo III",
			"Rambo",
			"Rambo: Last Blood"
		],
		# Men in Black
		# Madagascar
		# Alvin
		# The hangover
		# the conjuring
		"Terminator":[
			"The Terminator",
			"Terminator 2: Judgment Day",
			"Terminator 3: Rise of the Machines",
			"Terminator Salvation",
			"Terminator Genisys",
			"Terminator: Dark Fate"
		],
		# lego
		# fockers
		# matrix
		"Alien":[
			"Alien",
			"Aliens",
			"Alien³",
			"Alien Resurrection",
			"AVP: Alien vs. Predator",
			"AVPR: Aliens vs Predator - Requiem",
			"Prometheus",
			"Alien: Covenant"
		]
		# cars
		# john wick
		# madea
		# ocean
		# train dragon
		# mummy
		# night museum
		# narnia
		# secret pets
		# monsters
		# panda
		# rush hour
		# jumanji
		# die hard
	}

	movie_file = open("IMDb movies.csv", 'r')
	csv_reader = csv.DictReader(movie_file)

	sequences = get_franchises(franchises)
	json.dump(sequences, open('movies.json', 'w'), indent=4)
	
	#for line in csv_reader:
	#	if 'avpr' in line['title'].lower():
	#		print(line['title'], line['avg_vote'], line['year'])
			#print(line['title'])
	

analyze_movies()