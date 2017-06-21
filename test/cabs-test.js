// npm test in blueberryCabs directory


var mongoose = require("mongoose");

var cabs = require('../app/models/cabs');
var customer = require('../app/models/customer');
var cabsRequest = require('../app/models/cabRequest');

//Require the dev-dependencies
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();

chai.use(chaiHttp);

describe('blueberryCabs', function() {

  describe('/GET welcome page', function(done) {
      it('it should GET welcome page', function() {
        chai.request(server)
            .get('/api/')
            .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
              done();
            });
      });
  });

  describe('/POST customer requested a ride', function(done) {
      it('customer requested a cab with source & destination locations and isPink value', function() {
        chai.request(server)
            .post('/api/requestCar?fromLongitude=78&fromLatitude=13&toLongitude=80&toLatitude=15&userId=1&isPink=true')
            .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
              done();
            });
      });
  });

});
