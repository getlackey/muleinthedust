# Mule in the Dust

> It's Lackey implementation for DustJS as Express renderer.

We used to use [adaro](https://github.com/krakenjs/adaro). Anyhow we found it doesn't fully match our case. We decided to develop our own solution.

## POM 2.0

```yaml
_type: < 'Block' | 'List' | 'Variant' >
_props: < PropertiesMap >
_meta: < MetaMap >
<any> : < POMObject | String | Number >
```

### Example

```
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
    type: List
    items:
        -
            type: Block
            _props:
                theme: blue
            copy: |
                My awesome layout is more awesome than you are
            example:
                type: Variant
                *: Example
                *:*:pl: Przykład
```

### Breaking changes

 * New data layout
 * `Fields` type dies, page is a block too
