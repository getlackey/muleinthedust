/* jslint node:true, esnext:true */
'use strict';

const
    op = require('object-path');

function safeDate(input) {
    try {
        return new Date(input).getTime();
    } catch (err) {
        return null;
    }
}

function migrateNode(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
        return json;
    }

    let output = {
        _type: json.type
    };

    if (json.type === 'Media') {
        return json.id || undefined;
    }

    if (json.fields) {
        Object
            .keys(json.fields)
            .forEach(key => {
                output[key] = migrateNode(json.fields[key]);
            });
    }

    if (json.type === 'Variants') {
        Object
            .keys(json)
            .filter(key => key !== 'type')
            .forEach(key => {
                output[key] = migrateNode(json[key]);
            });
    }

    if (json.items) {
        output.items = json.items
            .map(item => migrateNode(item));
    }

    if (json.props && Object.keys(json.props).length) {
        output._props = json.props;
    }

    if (json.template) {
        output._meta = output._meta || {};
        output._meta.template = json.template;
    }

    return output;
}

module.exports = json => {
    let output = {
        _type: 'Block',
        _meta: {
            canonical: json.data.route,
            created: safeDate(json.data.content.createdAt),
            published: safeDate(json.data.content.publishAt),
            defaultLocale: json.defaultLocale,
            env: json.env,
            host: json.host,
            id: json.data.content.id,
            route: json.data.content.route,
            state: json.data.content.state,
            javascripts: json.javascripts,
            stylesheets: json.stylesheets,
            locale: json.locale,
            template: json.template
        },
        _edit: json.edit,
        _fragment: json.fragment,
        _taxonomies: json.data.content.taxonomies
            .map(taxonomy => {
                return {
                    label: taxonomy.label,
                    name: taxonomy.name,
                    type: {
                        label: taxonomy.type.label,
                        name: taxonomy.type.name
                    }
                };
            }),
        _props: {},
        _session: json.session
    };


    Object
        .keys(json.data.content.props)
        .filter(key => ['og_title', 'og_url', 'title'].indexOf(key) === -1)
        .forEach(key => {
            output._props[key] = json.data.content.props[key];
        });

    let author = op.get(json, 'data.content.author');

    if (author) {
        author = {
            id: author.id,
            name: author.name,
            image: author.image ? author.image.id : undefined
        };
    }

    Object
        .keys(json.data.content.layout)
        .filter(key => key !== 'type')
        .forEach(key => {
            output[key] = migrateNode(json.data.content.layout[key]);
        });

    if (json.data.content.template.populate) {
        json.data.content.template.populate
            .map(populate => populate.field)
            .forEach(field => {
                output[field] = json.data[field];
            });
    }

    output._meta.author = author;
    output._props.author = author;

    return output;
};
