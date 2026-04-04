export interface GolfPlayer {
  id: string; // stable slug used as PK in DB
  name: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  odds: string;
  owgr: string;
}

export const GOLF_PLAYERS: GolfPlayer[] = [
  // Tier 1
  { id: "scottie-scheffler", name: "Scottie Scheffler", tier: 1, odds: "4/1", owgr: "1" },
  { id: "rory-mcilroy", name: "Rory McIlroy", tier: 1, odds: "7/1", owgr: "2" },
  { id: "bryson-dechambeau", name: "Bryson DeChambeau", tier: 1, odds: "10/1", owgr: "24" },
  { id: "jon-rahm", name: "Jon Rahm", tier: 1, odds: "12/1", owgr: "29" },
  { id: "ludvig-aberg", name: "Ludvig Aberg", tier: 1, odds: "16/1", owgr: "18" },
  { id: "tommy-fleetwood", name: "Tommy Fleetwood", tier: 1, odds: "18/1", owgr: "4" },
  { id: "xander-schauffele", name: "Xander Schauffele", tier: 1, odds: "18/1", owgr: "6" },
  { id: "collin-morikawa", name: "Collin Morikawa", tier: 1, odds: "22/1", owgr: "8" },
  { id: "cameron-young", name: "Cameron Young", tier: 1, odds: "27/1", owgr: "3" },
  { id: "matt-fitzpatrick", name: "Matt Fitzpatrick", tier: 1, odds: "30/1", owgr: "5" },
  // Tier 2
  { id: "justin-rose", name: "Justin Rose", tier: 2, odds: "30/1", owgr: "7" },
  { id: "patrick-reed", name: "Patrick Reed", tier: 2, odds: "30/1", owgr: "23" },
  { id: "chris-gotterup", name: "Chris Gotterup", tier: 2, odds: "35/1", owgr: "9" },
  { id: "hideki-matsuyama", name: "Hideki Matsuyama", tier: 2, odds: "35/1", owgr: "14" },
  { id: "viktor-hovland", name: "Viktor Hovland", tier: 2, odds: "35/1", owgr: "22" },
  { id: "brooks-koepka", name: "Brooks Koepka", tier: 2, odds: "38/1", owgr: "165" },
  { id: "jordan-spieth", name: "Jordan Spieth", tier: 2, odds: "40/1", owgr: "63" },
  { id: "justin-thomas", name: "Justin Thomas", tier: 2, odds: "40/1", owgr: "15" },
  { id: "robert-macintyre", name: "Robert MacIntyre", tier: 2, odds: "40/1", owgr: "11" },
  { id: "tyrrell-hatton", name: "Tyrrell Hatton", tier: 2, odds: "40/1", owgr: "31" },
  // Tier 3
  { id: "shane-lowry", name: "Shane Lowry", tier: 3, odds: "45/1", owgr: "32" },
  { id: "patrick-cantlay", name: "Patrick Cantlay", tier: 3, odds: "50/1", owgr: "34" },
  { id: "ben-griffin", name: "Ben Griffin", tier: 3, odds: "55/1", owgr: "16" },
  { id: "akshay-bhatia", name: "Akshay Bhatia", tier: 3, odds: "60/1", owgr: "20" },
  { id: "corey-conners", name: "Corey Conners", tier: 3, odds: "60/1", owgr: "43" },
  { id: "jake-knapp", name: "Jake Knapp", tier: 3, odds: "60/1", owgr: "42" },
  { id: "si-woo-kim", name: "Si Woo Kim", tier: 3, odds: "60/1", owgr: "30" },
  { id: "jason-day", name: "Jason Day", tier: 3, odds: "66/1", owgr: "41" },
  { id: "min-woo-lee", name: "Min Woo Lee", tier: 3, odds: "66/1", owgr: "25" },
  { id: "russell-henley", name: "Russell Henley", tier: 3, odds: "66/1", owgr: "10" },
  // Tier 4
  { id: "adam-scott", name: "Adam Scott", tier: 4, odds: "66/1", owgr: "53" },
  { id: "cameron-smith", name: "Cameron Smith", tier: 4, odds: "66/1", owgr: ">200" },
  { id: "max-homa", name: "Max Homa", tier: 4, odds: "66/1", owgr: "156" },
  { id: "daniel-berger", name: "Daniel Berger", tier: 4, odds: "70/1", owgr: "38" },
  { id: "sam-burns", name: "Sam Burns", tier: 4, odds: "70/1", owgr: "33" },
  { id: "sepp-straka", name: "Sepp Straka", tier: 4, odds: "70/1", owgr: "12" },
  { id: "gary-woodland", name: "Gary Woodland", tier: 4, odds: "80/1", owgr: "51" },
  { id: "marco-penge", name: "Marco Penge", tier: 4, odds: "80/1", owgr: "37" },
  { id: "sungjae-im", name: "Sungjae Im", tier: 4, odds: "80/1", owgr: "70" },
  { id: "wyndham-clark", name: "Wyndham Clark", tier: 4, odds: "80/1", owgr: "75" },
  // Tier 5
  { id: "dustin-johnson", name: "Dustin Johnson", tier: 5, odds: "90/1", owgr: ">200" },
  { id: "harris-english", name: "Harris English", tier: 5, odds: "90/1", owgr: "21" },
  { id: "jj-spaun", name: "J.J. Spaun", tier: 5, odds: "90/1", owgr: "13" },
  { id: "jacob-bridgeman", name: "Jacob Bridgeman", tier: 5, odds: "90/1", owgr: "17" },
  { id: "alexander-noren", name: "Alexander Noren", tier: 5, odds: "100/1", owgr: "19" },
  { id: "matthew-mccarty", name: "Matthew McCarty", tier: 5, odds: "100/1", owgr: "46" },
  { id: "sergio-garcia", name: "Sergio Garcia", tier: 5, odds: "100/1", owgr: ">200" },
  { id: "maverick-mcnealy", name: "Maverick McNealy", tier: 5, odds: "110/1", owgr: "27" },
  { id: "ryan-gerard", name: "Ryan Gerard", tier: 5, odds: "110/1", owgr: "28" },
  { id: "keegan-bradley", name: "Keegan Bradley", tier: 5, odds: "120/1", owgr: "26" },
  // Tier 6
  { id: "kurt-kitayama", name: "Kurt Kitayama", tier: 6, odds: "120/1", owgr: "35" },
  { id: "nicolai-hojgaard", name: "Nicolai Hojgaard", tier: 6, odds: "120/1", owgr: "36" },
  { id: "ryan-fox", name: "Ryan Fox", tier: 6, odds: "120/1", owgr: "48" },
  { id: "aaron-rai", name: "Aaron Rai", tier: 6, odds: "130/1", owgr: "40" },
  { id: "harry-hall", name: "Harry Hall", tier: 6, odds: "130/1", owgr: "59" },
  { id: "john-keefer", name: "John Keefer", tier: 6, odds: "130/1", owgr: "60" },
  { id: "rasmus-neergaard-petersen", name: "Rasmus Neergaard-Petersen", tier: 6, odds: "130/1", owgr: "68" },
  { id: "tom-mckibbin", name: "Tom McKibbin", tier: 6, odds: "140/1", owgr: "102" },
  { id: "brian-harman", name: "Brian Harman", tier: 6, odds: "150/1", owgr: "50" },
  { id: "carlos-ortiz", name: "Carlos Ortiz", tier: 6, odds: "150/1", owgr: "157" },
  { id: "rasmus-hojgaard", name: "Rasmus Hojgaard", tier: 6, odds: "150/1", owgr: "55" },
  { id: "sam-stevens", name: "Sam Stevens", tier: 6, odds: "150/1", owgr: "44" },
  { id: "aldrich-potgieter", name: "Aldrich Potgieter", tier: 6, odds: "200/1", owgr: "77" },
  { id: "andrew-novak", name: "Andrew Novak", tier: 6, odds: "200/1", owgr: "47" },
  { id: "casey-jarvis", name: "Casey Jarvis", tier: 6, odds: "200/1", owgr: "69" },
  { id: "michael-kim", name: "Michael Kim", tier: 6, odds: "200/1", owgr: "56" },
  { id: "nicolas-echavarria", name: "Nicolas Echavarria", tier: 6, odds: "200/1", owgr: "39" },
  { id: "bubba-watson", name: "Bubba Watson", tier: 6, odds: "250/1", owgr: ">200" },
  { id: "hao-tong-li", name: "Hao-Tong Li", tier: 6, odds: "250/1", owgr: "81" },
  { id: "max-greyserman", name: "Max Greyserman", tier: 6, odds: "250/1", owgr: "62" },
  { id: "nick-taylor", name: "Nick Taylor", tier: 6, odds: "250/1", owgr: "66" },
  { id: "davis-riley", name: "Davis Riley", tier: 6, odds: "300/1", owgr: "116" },
  { id: "kristoffer-reitan", name: "Kristoffer Reitan", tier: 6, odds: "300/1", owgr: "49" },
  { id: "sami-valimaki", name: "Sami Valimaki", tier: 6, odds: "300/1", owgr: "57" },
  { id: "charl-schwartzel", name: "Charl Schwartzel", tier: 6, odds: "350/1", owgr: ">200" },
  { id: "brian-campbell", name: "Brian Campbell", tier: 6, odds: "400/1", owgr: "111" },
  { id: "michael-brennan", name: "Michael Brennan", tier: 6, odds: "400/1", owgr: "45" },
  { id: "zach-johnson", name: "Zach Johnson", tier: 6, odds: "400/1", owgr: ">200" },
  { id: "angel-cabrera", name: "Angel Cabrera", tier: 6, odds: "500/1", owgr: ">200" },
  { id: "danny-willett", name: "Danny Willett", tier: 6, odds: "500/1", owgr: ">200" },
  { id: "fred-couples", name: "Fred Couples", tier: 6, odds: "1000/1", owgr: ">200" },
  { id: "mike-weir", name: "Mike Weir", tier: 6, odds: "1000/1", owgr: ">200" },
  { id: "vijay-singh", name: "Vijay Singh", tier: 6, odds: "1000/1", owgr: ">200" },
  { id: "brandon-holtz", name: "Brandon Holtz", tier: 6, odds: "2000/1", owgr: ">200" },
  { id: "ethan-fang", name: "Ethan Fang", tier: 6, odds: "2000/1", owgr: ">200" },
  { id: "fifa-laopakdee", name: "Fifa Laopakdee", tier: 6, odds: "2000/1", owgr: ">200" },
  { id: "jackson-herrington", name: "Jackson Herrington", tier: 6, odds: "2000/1", owgr: ">200" },
  { id: "jose-maria-olazabal", name: "Jose Maria Olazabal", tier: 6, odds: "2000/1", owgr: ">200" },
  { id: "mason-howell", name: "Mason Howell", tier: 6, odds: "2000/1", owgr: ">200" },
  { id: "mateo-pulcini", name: "Mateo Pulcini", tier: 6, odds: "2000/1", owgr: ">200" },
  { id: "naoyuki-kataoka", name: "Naoyuki Kataoka", tier: 6, odds: "2000/1", owgr: ">200" },
];

export const PLAYERS_BY_TIER = {
  1: GOLF_PLAYERS.filter(p => p.tier === 1),
  2: GOLF_PLAYERS.filter(p => p.tier === 2),
  3: GOLF_PLAYERS.filter(p => p.tier === 3),
  4: GOLF_PLAYERS.filter(p => p.tier === 4),
  5: GOLF_PLAYERS.filter(p => p.tier === 5),
  6: GOLF_PLAYERS.filter(p => p.tier === 6),
} as const;

export const PLAYER_BY_ID = Object.fromEntries(GOLF_PLAYERS.map(p => [p.id, p]));

export const DEADLINE = "2026-04-04T00:00:00.000Z"; // TEST: past deadline
export const CUT_PENALTY = 8;
export const PICKS_PER_TIER_1_5 = 1; // 1 from each of tiers 1-5
export const PICKS_FROM_TIER_6 = 3;  // 3 from tier 6
export const TOTAL_PICKS = 8;        // 5 + 3
export const SCORING_PICKS = 6;      // best 6 of 8 count
