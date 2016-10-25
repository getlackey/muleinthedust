/* jslint node:true, esnext: true */
'use strict';

const
    path = require('path'),
    fs = require('fs'),
    freshy = require('freshy'),
    commonDustJSHelpers = require('common-dustjs-helpers'),
    DustIntl = require('dust-intl'),
    debug = require('debug')('muleinthedust'),
    bestMatch = require('bestmatch'),
    namingConvention = require('dust-naming-convention-filters'),
    _ = require('lodash');

/**
 * Engine Constructor
 * @param   {[[Type]]} initOptions [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
module.exports = function (initOptions) {

    const
        dust = freshy.freshy('dustjs-helpers');

    commonDustJSHelpers.exportTo(dust);
    DustIntl.registerWith(dust);
    namingConvention(dust);

    /* istanbul ignore next */
    function pass(data) {
        console.log(data);
        return data;
    }

    /**
     * Renders named param value, allows dynamic param values
     * @param   {string} name
     * @param   {Chunk} chunk
     * @param   {Context} context
     * @param   {Bodies} bodies
     * @param   {object} params
     * @returns {string}
     */
    function param(name, chunk, context, bodies, params) {

        debug('param', name);

        if (params && params[name]) {
            if (typeof params[name] === 'function') {
                var output = '';
                chunk
                    .tap(function (data) {
                        output += data;
                        return '';
                    })
                    .render(params[name], context).untap();
                return output;
            } else {
                return params[name];
            }
        }
        return '';
    }

    /**
     * Map data attributes to object
     * @param {Chunk} chunk
     * @param {Context} context
     * @param {Boedies} bodies
     * @param {object} params  [[]]
     */
    function dataAttributes(chunk, context, bodies, params) {

        debug('dataAttributes');

        let output = {};

        Object
            .keys(params)
            .filter(key => key.match(/^data-/))
            .forEach(key => output[key.replace(/^data-/, '')] = param(key, chunk, context, bodies, params));

        return output;
    }

    /**
     * Map data attributes to HTML attributes
     * @param {Chunk} chunk
     * @param {Context} context
     * @param {Boedies} bodies
     * @param {object} params  [[]]
     */
    function dataAttributesToHTMLAttributes(chunk, context, bodies, params) {

        debug('dataAttributesToHTMLAttributes');

        let attr = dataAttributes(chunk, context, bodies, params);

        Object
            .keys(attr)
            .forEach(key => chunk.write(' ' + key + '="' + dust.filters.h(attr[key]) + '"'));
    }

    /**
     * Resolve context and renders blocks - DRY code
     * @param   {Chunk} chunk
     * @param   {Context} context
     * @param   {Bodies} bodies
     * @param   {object} params
     * @param   {function} resolve @see resolvePath
     * @param   {function} map
     * @returns {Chunk}
     */
    function getAndRender(chunk, context, bodies, params, resolve, map) {

        debug('getAndRender');

        return chunk
            .map(inner => resolve(inner, context, bodies, params)
                .then(target => map(target, inner, context, bodies, params))
                .then(output => {
                    if (output && output.block) {

                        return new Promise((resolve, reject) => dust
                            .render(output.block, output.context || {}, (error, out) => {
                                if (error) {
                                    debug('error ' + error);
                                    reject(error);
                                }
                                inner.write(out);
                                inner.end();
                                resolve();
                            }));
                    }
                    inner.end();
                    return Promise.resolve();
                })
                .catch(error => {
                    debug('error ' + error.toString());
                    inner.write('<!-- LKY:ERROR ' + error.toString() + ' -->');
                    inner.end();
                }));

    }

    /**
     * Resolve element referred by path param in data
     * @param   {Chunk} chunk
     * @param   {Context} context
     * @param   {Bodies} bodies
     * @param   {object} params
     * @returns {mixed}
     */
    function resolvePath(chunk, context, bodies, params) {
        let path = param('path', chunk, context, bodies, params);
        return new Promise(resolve => resolve(context
            .get(path)));
    }


    /**
     * Resolve element referred by path param in data
     * @param   {Chunk} chunk
     * @param   {Context} context
     * @param   {Bodies} bodies
     * @param   {object} params
     * @returns {mixed}
     */
    function resolveVariant(chunk, context, bodies, params) {
        return resolvePath(chunk, context, bodies, params)
            .then(value => {
                if (!value || typeof value !== 'object') {
                    return value;
                }

                if (!value || value._type !== 'Variants') {
                    return value;
                }

                let
                    variant = params.variant || '*',
                    variants = Object.keys(value)
                    .filter(val => val !== '_type'),
                    key = bestMatch(variants, variant);

                return value[key];
            });

    }

    /**
     * Mapping for path helper
     * @param   {object} target
     * @param   {Context} context
     * @param   {object}   bodies
     * @returns {Promise<object>}
     */
    function mapPath(target, chunk, context, bodies, params) {

        if (!target && !bodies.else) {
            return Promise.resolve(null);
        }

        let
            data = target,
            attrs = dataAttributes(chunk, context, bodies, params);

        if (data !== null && data !== undefined && typeof data === 'object') {
            data = _.merge({}, attrs, target || {});
        }

        if ((data === null || data === undefined) && Object.keys(attrs).length > 0) {
            data = _.merge({}, attrs);
        }

        return new Promise(resolve => resolve({
            block: target ? bodies.block : bodies.else,
            context: data
        }));

    }



    /**
     * DUSTjs Helper
     * Renders block making context from data targetted by path param
     * Supports :else
     *
     * Params
     * {string} path
     */
    dust.helpers.path = (chunk, context, bodies, params) =>
        getAndRender(chunk, context, bodies, params, resolvePath, mapPath);


    /**
     * Happing for has helper
     * @param   {object} target
     * @param   {Context} context
     * @param   {object}   bodies
     * @returns {Promise<object>}
     */
    function mapHas(target, chunk, context, bodies) {

        debug('mapHas');

        return Promise
            .resolve({
                block: target ? bodies.block : bodies.else,
                context: context
            });
    }

    /**
     * DUSTjs Helper
     * Renders block if element referred in path param exists
     * Supports :else
     *
     * Params
     * {string} path
     */
    dust.helpers.has = (chunk, context, bodies, params) =>
        getAndRender(chunk, context, bodies, params, resolvePath, mapHas);

    function resolveBlockContent(chunk, context, bodies, params) {

        debug('resolveBlockContent');

        if (params.path) {
            return resolvePath(chunk, context, bodies, params);
        }
        if (params.route) {
            return dust
                .onRoute(params.route);
        }
        return Promise
            .reject('What you want to render then?');
    }

    /**
     * Mapping for block helper
     * @param   {object} target
     * @param   {Context} context
     * @param   {object}   bodies
     * @returns {Promise<object>}
     */
    function mapBlock(target, chunk, context, bodies, params) {

        debug('mapBlock');

        if (!target) {
            return Promise.resolve(null);
        }

        if (!params.template && !target.template) {
            debug('No template defined');
            return Promise
                .reject('No template defined');
        }
        return Promise
            .resolve({
                block: params.template || target.template,
                context: target
            });
    }

    /**
     * DUSTjs Helper
     * Renders block
     * Supports :else
     *
     * Params
     * {string} path
     * {string} route
     * {string} template
     */
    dust.helpers.block = (chunk, context, bodies, params) =>
        getAndRender(chunk, context, bodies, params, resolveBlockContent, mapBlock);




    dust.helpers.content = (chunk, context, bodies, params) => chunk
        .map(inner => resolvePath(chunk, context, bodies, params)
            .then(() => {
                inner.write('a');
                inner.end();
            })
            .catch(pass));


    dust.helpers.variant = (chunk, context, bodies, params) =>
        getAndRender(chunk, context, bodies, params, resolveVariant, mapPath);




    dust.helpers.media = (chunk, context, bodies, params) => {

        debug('media');

        chunk.write('<strong>MEDIA</strong>');
    };

    dust.filters.typeOf = value => typeof value;


    dust.helpers.for = (chunk, context, bodies, params) => {

        debug('for');

        let
            from = +params.from,
            to = +params.to,
            curr;

        if (from > to) {
            return chunk;
        }

        return chunk
            .map(inner => {
                var render = () => {
                    curr = from++;
                    dust
                        .render(bodies.block, context
                            .clone()
                            .push({
                                $idx: curr
                            }), (error, out) => {
                                if (error) {
                                    debug('error ' + error);
                                    inner.end();
                                }

                                inner.write(out);
                                if (from > to) {
                                    return inner.end();
                                }
                                render();
                            });
                };
                render();
            });

    };

    function pathResolver(filePath) {

        debug('pathResolver', filePath);

        if (initOptions.pathResolver) {
            return initOptions.pathResolver(filePath);
        }

        let
            targetPath = initOptions.root ? path.join(initOptions.root, filePath) : filePath;

        if (path.extname(targetPath) === '') {
            targetPath += '.dust';
        }

        return Promise.resolve(targetPath);
    }

    dust.onRoute = (initOptions && initOptions.onRoute) ? initOptions.onRoute : () => Promise.reject('Route resolver not provided');

    /**
     * @param {string} templateName
     * @param {object} options
     * @param {function} callback
     */
    dust.onLoad = (templateName, options, callback) => {

        debug('onLoad ' + templateName);

        if (dust.cache[templateName]) {
            return dust.cache[templateName];
        }

        pathResolver(templateName)
            .then(filePath => fs
                .readFile(filePath, 'utf8', (error, content) => {
                    if (error) {
                        debug('error ' + error);
                        return callback(error);
                    }
                    callback(null, content);
                }))
            .catch(error => callback(error));
    };

    function render(filePath, data) {

        debug('render ' + filePath);

        return new Promise((resolve, reject) => {
            dust.render(filePath, data || {}, (error, html) => {
                if (error) {
                    debug('error ' + error);
                    return reject(error);
                }
                resolve(html);
            });
        });
    }

    /**
     * @see https://expressjs.com/en/advanced/developing-template-engines.html
     */
    return function (filePath, options, callback) {

        debug('rendering ' + filePath);

        render(filePath, options)
            .then(html => callback(null, html))
            .catch(error => callback(error));
    };
};
