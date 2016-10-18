/* jslint node:true, esnext: true */
'use strict';

const
    path = require('path'),
    fs = require('fs'),
    freshy = require('freshy');

/**
 * Engine Constructor
 * @param   {[[Type]]} initOptions [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
module.exports = function (initOptions) {

    const
        dust = freshy.freshy('dustjs-helpers');

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

        return chunk
            .map(inner => resolve(chunk, context, bodies, params)
                .then(target => map(target, context, bodies, params))
                //.then(pass)
                .then(output => output.block ? new Promise((resolve, reject) => dust
                    .render(output.block, output.context, (error, out) => {
                        if (error) {
                            reject(error);
                        }
                        inner.write(out);
                        inner.end();
                        resolve();
                    })) : () => {
                    return inner.end();
                })
                .catch(error => {
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
    let resolvePath = (chunk, context, bodies, params) => {
        try {
            return Promise
                .resolve(context
                    .get(param('path', chunk, context, bodies, params)));
        } catch (error) {
            return Promise
                .reject(error);
        }
    };

    function mapPath(target, context, bodies) {
        return Promise
            .resolve({
                block: target ? bodies.block : bodies.else,
                context: target || dust.context({})
            });
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


    function mapHas(target, context, bodies) {
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

    function mapBlock(target, context, bodies, params) {
        if (!params.template && (!target || !target.template)) {
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


    dust.helpers.for = (chunk, context, bodies, params) => {

        let
            from = +params.from,
            to = +params.to;

        if (from > to) {
            return chunk;
        }

        return chunk
            .map(inner => {
                var render = () => dust
                    .render(bodies.block, context
                        .push({
                            $idx: from++
                        }), (error, out) => {
                            if (error) {
                                inner.end();
                            }
                            inner.write(out);
                            if (from > to) {
                                return inner.end();
                            }
                            render();
                        });
                render();
            });

    };

    function pathResolver(filePath) {
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
        if (dust.cache[templateName]) {
            return dust.cache[templateName];
        }

        pathResolver(templateName)
            .then(filePath => fs
                .readFile(filePath, 'utf8', (error, content) => {
                    if (error) {
                        return callback(error);
                    }
                    callback(null, content);
                }))
            .catch(error => callback(error));
    };

    function render(filePath, data) {
        return new Promise((resolve, reject) => {
            dust.render(filePath, data || {}, (error, html) => {
                if (error) {
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
        render(filePath, options)
            .then(html => callback(null, html))
            .catch(error => callback(error));
    };
};
