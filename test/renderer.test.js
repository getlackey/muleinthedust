/* jslint mocha:true, node:true, esnext:true, -W030, -W098 */
'use strict';

const
    should = require('should'),
    library = require('../lib'),
    instance = library({
        root: __dirname + '/mockups'
    });

describe('Renderer', () => {

    it('Renders hello world', done => {
        instance('hello', undefined, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/^\s+|\s+$/g, '').should.be.eql('Hello world!');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('Renders with partials', done => {
        instance('index', {
            this: {
                is: {
                    it: 'navigation'
                }
            }
        }, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/^\s+|\s+$/g, '').should.be.eql('This is my headThis is my nav called navigationThis is my bodyThis is my foot');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

});
