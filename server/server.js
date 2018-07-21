//const { mongoose } = require('../db/mongoose.js');
const lol = require('../functions/functions');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express(); //App is now an instance of our express server
const PORT = process.env.PORT || 3001;

//Everytime our client sends some sor of information to our server
//It'll transform it into JSON for our db
app.use(bodyParser.json());
//This middleware allows our form data to be used in our server
app.use(bodyParser.urlencoded({ extended: true }));

// Add headers
app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );
  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', false);
  // Pass to next layer of middleware
  next();
});

//lets make a simple get request to get some sort of response from our server
app.get('/', (req, res) => {
  res.send('Hello Battlefy');
});

app.get('/:id', (req, res) => {
  let player = {};
  let summonerName = req.params.id;
  lol.getSummonerId(summonerName).then(summonerId => {
    player = {
      ...player,
      summonerName,
      summonerId
    };
    lol.getMatchesIdList(summonerId).then(matchesList => {
      player = {
        ...player,
        matchesList
      };
      setTimeout(() => {}, 1500);
      lol.getMatchesDetails(matchesList).then(matchDetailsList => {
        player = {
          ...player,
          matchDetailsList
        };
        setTimeout(() => {}, 1500);
        lol.getChampionName(player.matchesList).then(championNameList => {
          player = {
            ...player,
            championNameList
          };
          let summonerSpells = [];
          player.matchDetailsList.forEach(matchDetail => {
            summonerSpells.push(matchDetail.summonerSpells);
          });
          setTimeout(() => {}, 1500);
          lol.getSummonerSpellName(summonerSpells).then(summonerSpellsList => {
            player = {
              ...player,
              summonerSpellsList
            };
            let itemsList = [];
            player.matchDetailsList.forEach(matchDetail => {
              itemsList.push(matchDetail.items);
            });
            lol.getItemsName(itemsList).then(itemsNameList => {
              player = {
                ...player,
                itemsNameList
              };
              let runesList = [];
              player.matchDetailsList.forEach(matchDetail => {
                runesList.push(matchDetail.runesReforged);
              });
              lol.getRunesReforgedName(runesList).then(runesNameList => {
                player = {
                  ...player,
                  runesNameList
                };
                let i = 0;
                player.matchDetailsList.forEach(matchDetail => {
                  matchDetail.championId = player.championNameList[i];
                  matchDetail.summonerSpells = player.summonerSpellsList[i];
                  matchDetail.items = player.itemsNameList[i];
                  matchDetail.runesReforged = player.runesNameList[i];
                  i++;
                });
                let data = {
                  summonerName: player.summonerName,
                  matchDetailsList: player.matchDetailsList
                };
                res.send(data).status(200);
              });
            });
          });
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Wagwan I'm alive on Port ${PORT}`);
});
