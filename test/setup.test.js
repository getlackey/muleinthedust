/* jslint mocha:true, node:true, esnext:true */
'use strict';

const
    should = require('should'),
    library = require('../lib');

describe('Library', () => {

    it('Is what is should be', () => {
        should(typeof library).be.eql('function');
        library.length.should.be.eql(1);
    });

    it('Should init', () => {
        let instance = library();
        should(typeof instance).be.eql('function');
        instance.length.should.be.eql(3);
    });

});
