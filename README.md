# Mule in the Dust

![](https://travis-ci.org/getlackey/muleinthedust.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/getlackey/muleinthedust/badge.svg?branch=master)](https://coveralls.io/github/getlackey/muleinthedust?branch=master)

> It's Lackey implementation for DustJS as Express renderer.

We used to use [adaro](https://github.com/krakenjs/adaro). Anyhow we found it doesn't fully match our case. We decided to develop our own solution.

## Install

```
npm i --save muleinthedust
```

## Usage

```javascript
let
    app = require('express')(),
    dust = require('muleinthedust')({
        root: ...
        ...
    });

app.engine('dust', dust);
app.set('view engine', 'dust');
```

Options

Options | Type | Required | Note
------- | ---- | -------- | ----
onLoad |  `(templateName, options, callback) => void` | No | template loading function
root   | string | Yes | state absolute path to templates directory

## Helpers

### @for

Allows iterating from `n` to `m`. Populate `$idx` field.

```dustjs
{@for from=0 to=10}
    {$idx}
{/for}
```

Param        | Type    | Required | Note
------------ | ------- | -------- | ----
from         | Number  | Yes      | first number to iterate from
to           | Number  | Yes      | last number to iterate to

Blocks

 * body

Status: Tested

### @has

Checks if path exists and is not empty.

```dustjs
{@has path="title"}
    {title}
{:else}
    Not title here
{/has}
```

Param        | Type    | Required | Note
------------ | ------- | -------- | ----
path         | string  | Yes      | see [@path](#path)

Blocks

 * body
 * else

Status: Tested

### @path

Creates new context from given path.

```dustjs
{@path path="items.{$idx}"}
    {title}
{/path}
```

Param        | Type    | Required | Note
------------ | ------- | -------- | ----
path         | string  | Yes      | define path from current context downwards, supports variables
data-*       | any     | No       | attributes to pass into new context

Blocks

 * body
 * else

Dynamic example

```dustjs
{@path path="item.in.the.list.{$idx}"}
{/path}

```

Passing data example

```dustjs
{@path path="item.in.the.list.{$idx}" data-$idx=$idx}
    {$idx}
{/path}

```

Status: Tested

### @block

Embeds block, referred content, or decorates.

```dustjs
{@block path="items.0"/}
{@block path="items.0" template="_partials/item"/}
{@block route="/referred/page"/}
{@block route="/referred/page" template="_partials/as_facebook"/}
```

Param        | Type    | Required | Note
------------ | ------- | -------- | ----
route        | string  | Yes      | d
template     | any     | No       | attributes to pass into new context

Blocks

 * body
 * else

Require implementing `route` resolver

```javascript
let
    app = require('express')(),
    dust = require('muleinthedust')({
        root: ...
        ...
    });

dust.resolvers.route = route => Promise.resolve(<CONTENT>);

app.engine('dust', dust);
app.set('view engine', 'dust');
```

Status: Tested, without extending

### @list

Populates list of blocks.

Param        | Type    | Required | Note
------------ | ------- | -------- | ----
path         | string  | Yes      | define path from current context downwards, supports variables

```dustjs
{@list path="items"/}
{@list path="items" template="_partials/as_facebook"/}
```

Blocks

 * body
 * else

Status: Tested

### @variant

Extendable

Sets best matching variant as context.


Param        | Type    | Required | Note
------------ | ------- | -------- | ----
path         | string  | Yes      | define path from current context downwards, supports variables
variant      | string  | Yes      | variant platform as for [bestmatch](https://github.com/sielay/bestmatch)


```dustjs
{@variant path="items.1" variant="pl"}
    {title}
{/variant}
```

Status: Tested, without extending

### @text

Extendable

Expose content for view / edit.

```dustjs
{@text path="items.1.title" editMode=edit/}
```

### @media

Extendable

Expose media for view / edit.

```dustjs
{@media path="items.1.image}" editMode=edit data-class="thumb"/}
```

### @attr

Extendable

Formatts content as html escaped string.

```dustjs
{@attr path="items.1.title" /}
```

### @base

Wraps url with base.

```dustjs
{@base}any/url.html{/base}
```

## POM 2.0

### POMObject

```yaml
_type: < 'Block' | 'List' | 'Variant' >
_props: < PropertiesMap >
_meta: < MetaMap >
<any> : < POMObject | String | Number >
```

#### Example

```yaml
_type: Block
_meta:
    route: /blog/my-awesome-layout
    created: 1476784049
    updated: 1476784049
    createdBy: UserObject
    template: TemplateObject
_props:
    author: UserObject # one you can set manually
    theme: red
title: My awesome layout
blocks:
    _type: List
    items:
        -
            _type: Block
            _props:
                theme: blue
            copy: |
                My awesome layout is more awesome than you are
            example:
                _type: Variant
                *: Example
                *:*:pl: Przykład
```

Restricted names:

 * any starting with underscore

### PropertiesMap

```yaml
<any> : < String | Number | Boolean | Variant >
```

### MetaMap

```yaml
<any> : < String | Number | Boolean >
```

#### POM universal meta

| Name       | Type          | Description                                    | Example
| ---------- | ------------- | ---------------------------------------------- | -------
| route      | string        | canonical route to resource in the system      | /blog/my-awesome-layout
| uri        | string        | full uri as entered                            | https://example.com/de-DE/blog/my-awesome-layout
| canonical | string        | canonical absolute uri                         | https://example.com/blog/my-awesome-layout
| locale     | string        | locale extracted from uri or session           | de-DE
| base       | stirng        | required for ensuring links are aboslute       | https://example.com/de-DE/

#### Lackey specific meta

| Name       | Type          | Description                                    | Example     | Values
| ---------- | ------------- | ---------------------------------------------- | ----------- | ----------------
| state      | enum          | Shows state of block                           | published   | draft, published |
| id         | number        | Unique id in the database                      | 134         | |
| created    | number        | Unixtimestamp of record creation               | 1476784049  | |
| updated    | number        | Unixtimestamp of record latest update          | 1476784049  | |
| publish    | number        | Unixtimestamp of record embargo                | 1476784049  | |
| author     | UserObject    | Actual user who has created the record         |             | |

### Mapping POM to POM 2.0

| POM                                   | POM 2.0
| ------------------------------------- | -------
| data.route                            | _meta.canonical
| data.content.id                       | _meta.id
| data.content.$uri                     | TBD
| data.content.type                     | _type
| data.content.name                     | title
| data.content.route                    | _meta.uri
| data.content.createdAt                | _meta.created
| data.content.publishAt                | _meta.publish
| data.content.props.og_title           | title
| data.content.props.og_url             | _meta.canonical
| data.content.author                   | _meta.author
| data.content.author (editable)        | _props.author
| data.content.template                 | _meta.template
| data.content.state                    | _meta.state
| data.content.layout                   | $
| data.content.[populated]              | [populated]
| data.content.taxonomies               | _taxonomies
| template                              | _meta.template.name
| [property]                            | [property]
| stylesheets                           | _meta.stylesheets
| javascript                            | _meta.javascripts
| edit                                  | _edit
| fragment                              | _fragment
| locale                                | _meta.locale
| host                                  | _meta.host
| env                                   | _meta.env
| defaultLocale                         | _meta.defaultLocale
| route                                 | _meta.route
| session                               | _session
| post                                  | TBD
| query                                 | TBD

### Title and OG:Title

In previous version of POM we had huge confusion around title and name of the page.

 * `$.data.content.name`
 * `$.data.content.props.og_title`
 * `$.data.content.layout.title`
 * any other

At the moment we will have just `$.title` which can (but don't have to) use variant `og`. Same goes for image and description. It should be edited via variant (i.e. `how looks on facebook view`).



### Breaking changes

 * New data layout
 * `Fields` type dies, page is a block too
 * (Lackey feature) autopopulated fields from template should land in root of POMObject, not in `$.data`
