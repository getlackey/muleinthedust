/* jslint mocha:true, node:true, esnext:true */
'use strict';

const
    library = require('../lib/migrate'),
    tests = [
      'enigma.website.team.lukasz'
  ];

require('should');

describe('Migrate', () => {

    tests
        .forEach(test => it(test, () => {
            library(require('./mappings/oldoutput/' + test + '.json')).should.be.eql(require('./mappings/newoutput/' + test + '.json'));
        }));
});
