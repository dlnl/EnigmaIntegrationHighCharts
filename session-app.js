const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.612.0');
const WebSocket = require('ws');
require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT;
const fs = require("fs");
var mySeries = {};


(async () => {
    const randomId = Math.random().toString(32).substring(3);
    const appId = process.env.APPID
    const tenant = process.env.TENANT
    const apiKey = process.env.APIKEY
    const url = `wss://${tenant}/app/${appId}`;


    const session = enigma.create({
        schema,
        createSocket: () => new WebSocket(url, { // use the API key to authenticate:
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        })
    });

    try {
        const global = await session.open();
        const app = await global.getActiveDoc();
        // const result = await app.evaluate('COUNT([Country])');
        // console.log(result)

        var sessionModel = await app.createSessionObject({
            qInfo: {
                qType: 'cube'
            },
            qHyperCubeDef: {
                qDimensions: [
                    {
                        qDef: {
                            qFieldDefs: ["Country"]
                        }
                    }
                ],
                qMeasures: [
                    {
                        qDef: {
                            qDef: 'SUM(Budget)'
                        }
                    }
                ]
            }
        });
        sessionData = await sessionModel.getHyperCubeData('/qHyperCubeDef', [{
                qTop: 0,
                qLeft: 0,
                qWidth: 3,
                qHeight: 3333
            }]);

        var level3Temp = sessionData[0].qMatrix;
        // console.log(level3Temp);
        // console.log('------------------------------------------');
        mySeries = normalizeAndSortData(level3Temp);
        console.log('mySeries', JSON.stringify(mySeries));
        


    } catch (err) {
        console.log('An unexpected error thrown:', err);
    }

    session.close();
    // console.log('session closed')
})();


function normalizeAndSortData(senseArray) {
    var result = [];

    for (const row of senseArray) {
        result.push({
          name: row[0].qText,
          y: +row[1].qText 
        })
    }

    var mySeries =  [{
      name: 'Brands',
      colorByPoint: true,
      data: result
  
  }]
  return mySeries;

  
};
app.set('view engine', 'ejs')
app.use(express.static('static'));
app.use(express.static('public'));


app.get("/", (req, res) => {
  
  console.log('server received get for landing page')
  
  res.render("index", { mySeries });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})