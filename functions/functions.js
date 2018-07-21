//const { config } = require('../config');
const axios = require('axios');
const key = process.env.key || config.api_key;
module.exports = {
  getSummonerId: async function(summonerName) {
    let response = await axios.get(
      `https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/${summonerName}?api_key=${key}`
    );
    return response.data.accountId;
  },
  getMatchesIdList: async function(summonerId) {
    let response = await axios.get(
      `https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/${summonerId}?api_key=${key}&endIndex=5`
    );
    let data = await response.data.matches;
    let matchesList = [];
    data.forEach(match => {
      let detail = {
        gameId: match.gameId,
        championId: match.champion
      };
      matchesList.push(detail);
    });
    return matchesList;
  },
  getMatchesDetails: async function(matchesList) {
    let matchDetailsList = [];
    let promisesList = [];
    let i = 0;
    matchesList.forEach(match => {
      let url = `https://na1.api.riotgames.com/lol/match/v3/matches/${
        match.gameId
      }?api_key=${key}`;
      promisesList.push(axios.get(url));
    });

    await axios.all(promisesList).then(
      axios.spread((...responses) => {
        let promiseDataList = [];
        responses.forEach(promise => {
          promiseDataList.push(promise.data);
        });
        let i = 0;
        promiseDataList.forEach(data => {
          let duration = getGameDuration(data.gameDuration);
          let playerStats = getPlayerStats(data, matchesList[i].championId);
          let details = {
            duration,
            championId: matchesList[i].championId,
            ...playerStats
          };
          i++;
          matchDetailsList.push(details);
        });
      })
    );
    return matchDetailsList;
  },
  getChampionName: async function(matchesList) {
    let championNameList = [];
    let response = await axios
      .get(
        `https://na1.api.riotgames.com/lol/static-data/v3/champions?api_key=${key}`
      )
      .catch(err => console.log(err));
    let championList = await response.data.data;
    let objKeys = Object.keys(championList);
    matchesList.forEach(match => {
      let champion = objKeys.find(
        key => championList[key].id == match.championId
      );
      championNameList.push(champion);
    });
    return championNameList;
  },
  getSummonerSpellName: async function(summonerSpellObj) {
    let summonerSpellsList = [];
    let response = await axios.get(
      `https://na1.api.riotgames.com/lol/static-data/v3/summoner-spells?api_key=${key}`
    );
    let spellsList = response.data.data;
    let objKeys = Object.keys(spellsList);
    summonerSpellObj.forEach(spellObj => {
      let spell1 = objKeys.find(key => spellsList[key].id == spellObj.spell1);
      let spell2 = objKeys.find(key => spellsList[key].id == spellObj.spell2);
      summonerSpellsList.push({ spell1, spell2 });
    });
    summonerSpellsList.forEach(obj => {
      obj.spell1 = spellsList[obj.spell1].name;
      obj.spell2 = spellsList[obj.spell2].name;
    });
    return summonerSpellsList;
  },
  getItemsName: async function(itemsObjList) {
    let itemsNameList = [];
    let response = await axios.get(
      `https://na1.api.riotgames.com/lol/static-data/v3/items?api_key=${key}`
    );
    let itemsName = response.data.data;
    let objKeys = Object.keys(itemsName);
    itemsObjList.forEach(itemsObj => {
      let item0 = objKeys.find(key => itemsName[key].id == itemsObj.item0);
      let item1 = objKeys.find(key => itemsName[key].id == itemsObj.item1);
      let item2 = objKeys.find(key => itemsName[key].id == itemsObj.item2);
      let item3 = objKeys.find(key => itemsName[key].id == itemsObj.item3);
      let item4 = objKeys.find(key => itemsName[key].id == itemsObj.item4);
      let item5 = objKeys.find(key => itemsName[key].id == itemsObj.item5);
      let item6 = objKeys.find(key => itemsName[key].id == itemsObj.item6);

      itemsNameList.push({ item0, item1, item2, item3, item4, item5, item6 });
    });
    itemsNameList.forEach(obj => {
      obj.item0 ? (obj.item0 = itemsName[obj.item0].name) : null;
      obj.item1 ? (obj.item1 = itemsName[obj.item1].name) : null;
      obj.item2 ? (obj.item2 = itemsName[obj.item2].name) : null;
      obj.item3 ? (obj.item3 = itemsName[obj.item3].name) : null;
      obj.item4 ? (obj.item4 = itemsName[obj.item4].name) : null;
      obj.item5 ? (obj.item5 = itemsName[obj.item5].name) : null;
      obj.item6 ? (obj.item6 = itemsName[obj.item6].name) : null;
    });
    return itemsNameList;
  },
  getRunesReforgedName: async function(runesObjList) {
    let runesNameList = [];
    let response = await axios.get(
      `https://na1.api.riotgames.com/lol/static-data/v3/reforged-runes?api_key=${key}`
    );
    let runes = response.data;
    runesObjList.forEach(runesObj => {
      if (
        typeof runesObj.primary != 'undefined' &&
        typeof runesObj.sub != 'undefined' &&
        runesObj.primary &&
        runesObj.sub
      ) {
        let rune1 = runes.find(rune => rune.runePathId == runesObj.primary);
        let rune2 = runes.find(rune => rune.runePathId == runesObj.sub);
        runesNameList.push({
          primary: rune1.runePathName,
          sub: rune2.runePathName
        });
      } else {
        runesNameList.push({});
      }
    });
    return runesNameList;
  }
};

/************************************************/

function getGameDuration(gameDuration) {
  let gameMin = gameDuration / 60;
  let gameSec = Math.floor((gameMin - Math.floor(gameMin)) * 60);
  let duration = `${Math.floor(gameMin)}m ${gameSec}s`;
  return duration;
}

function getPlayerStats(game, championId) {
  let player = findPlayer(game.participants, championId);
  let outcome = getGameOutcome(game.teams, player.teamId);
  let summonerSpells = {
    spell1: player.spell1Id,
    spell2: player.spell2Id
  };
  let kda = (player.stats.kills + player.stats.assists) / player.stats.deaths;
  kda = kda.toFixed(2);
  let items = {
    item0: player.stats.item0,
    item1: player.stats.item1,
    item2: player.stats.item2,
    item3: player.stats.item3,
    item4: player.stats.item4,
    item5: player.stats.item5,
    item6: player.stats.item6
  };
  let championLevel = player.stats.champLevel;
  let totalCreepsScore =
    player.stats.totalMinionsKilled + player.stats.neutralMinionsKilled;
  let creepsScorePerMinute = (totalCreepsScore * 60) / game.gameDuration;
  creepsScorePerMinute = creepsScorePerMinute.toFixed(2);
  let runesReforged = {
    primary: player.stats.perkPrimaryStyle,
    sub: player.stats.perkSubStyle
  };
  return {
    outcome,
    summonerSpells,
    kda,
    items,
    championLevel,
    totalCreepsScore,
    creepsScorePerMinute,
    runesReforged
  };
}

function findPlayer(participants, championId) {
  let playerIndex = participants.findIndex(
    participant => participant.championId == championId
  );
  return participants[playerIndex];
}

function getGameOutcome(teamsDetails, playerTeamId) {
  let outcome;
  if (teamsDetails[0].teamId === playerTeamId) {
    outcome = teamsDetails[0].win;
  } else {
    outcome = teamsDetails[1].win;
  }
  return outcome;
}
