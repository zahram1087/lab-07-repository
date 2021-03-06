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
      const weatherSummaries = result.body.daily.data.map(day => {
        return new Weather(day);
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

//Yelp API

app.get('/yelp', getYelp);

function getYelp(request, response) {
  console.log(`yelp`, request.query.data.search_query);
  const url = `https://api.yelp.com/v3/businesses/search?location=${request.query.data.search_query}`;
  superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(result => {
      const yelpSummaries = result.body.businesses.map(ele => {
        return new Yelp(ele)
      })
      response.send(yelpSummaries);
    })
    .catch(error => handleError(error, response));
}

function Yelp(business) {
  this.name = business.name;
  this.image_url = business.image_url;
  this.price = business.price;
  this.rating = business.rating;
  this.url = business.url
}

//Movies API

app.get('/movies', getMovie);
function getMovie(request, response) {
  console.log(`movies`, request.query.data.search_query);
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.THE_MOVIE_DB_API}&query=${request.query.data.search_query}`;
  // console.log( `this`);
  superagent.get(url)
    .then(result => {
      console.log(result.body);
      const movieSummaries = result.body.results.map(ele =>{
        return new Movie(ele);
      });
      response.send(movieSummaries);
      console.log(movieSummaries);
    })
    .catch(error => handleError(error, response));
}
function Movie(movie){
  this.title= movie.title;
  this.overview= movie.overview;
  this.average_votes= movie.vote_average;
  this.total_votes= movie.vote_count;
  this.image_url= movie.poster_path;
  this.popularity= movie.popularity;
  this.released_on= movie.release_date;
}
