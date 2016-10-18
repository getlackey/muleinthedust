/* jslint mocha:true, node:true, esnext:true, -W030, -W098 */
'use strict';

const
    should = require('should'),
    library = require('../lib'),
    fs = require('fs'),
    instance = library({
        root: __dirname + '/mockups',
        onRoute: (route) => Promise.resolve({
            path: route,
            name: route + ' name',
            data: {
                a: '123123'
            },
            template: 'block2'
        })
    }),
    ctx = require('./context.json');

function resultMockup(name) {
    return fs.readFileSync(__dirname + '/mockups/' + name + '.test.html', 'utf8').replace(/^\s+|\s+$/g, '');
}

describe('Helpers', () => {

    it('@for', done => {
        instance('for', {
            A: 'King Kong'
        }, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/^\s+|\s+$/g, '').should.be.eql('3 - King Kong4 - King Kong5 - King Kong');
                done();
            } catch (err) {
                done(err);
            }

        });
    });

    it('@path', done => {
        instance('path', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/^\s+|\s+$/g, '').should.be.eql(resultMockup('path'));
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('@has', done => {
        instance('has', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/\s+/g, '').should.be.eql(resultMockup('has'));
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('@block', done => {
        instance('block', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/^\s+|\s+$/g, '').should.be.eql(resultMockup('block'));
                done();
            } catch (err) {
                done(err);
            }
        });
    });

});
