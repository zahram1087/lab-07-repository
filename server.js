'use strict';

const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

//Acts as a bridge that between the client and network
app.use(cors());
//submitting the reqquest
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
})

app.get('/weather', getWeather);

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
//creating the response
function searchToLatLong(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then(res => {
      return new Location(res);

    })
    .catch(error => handleError(error));
}
function Location(res) {
  console.log(res);
  this.search_query = res.query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}
//sending the results to dark-sky
function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  return superagent.get(url)
    .then(result => {
      const weatherSummaries = [];
      result.body.daily.data.forEach(day => {
        const summary = new Weather(day);
        weatherSummaries.push(summary);
      });
      response.send(weatherSummaries)
    })
    .catch(error => handleError(error, response));

}

function handleError(err, result) {
  console.error(err);
  if (result) result.status(500).send('Sorry, something went wrong');
}

function Weather(day) {
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
  this.forecast = day.summary;
}
