# Dataview Persister

[![License: GPL v3](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/gpl-3)

If you search help about the **Settings** you can check the [documentation](./docs/settings.md).

## Summary

This plugin for Obsidian, works alongside [obsidian-dataview](https://github.com/blacksmithgu/obsidian-dataview) (it should also be installed) and allows persistening the result of the queries to the note, following the next process:

1. Locates comments containing  queries/scripts
2. Runs the _comment-queries_ against the **DataviewAPI**
3. and writes the result of those queries to the note under the _comment-query_.

### Features

It allows running the persisting process using the next triggers:

- Hotkey for persisting the _comment-query_ under the cursor (only on **editing mode**)
- Hotkey for persisting all the _comment-queries_ on the current note.
- Persist all _comment-queries_ when the focused note changes.

### Extra features

#### Link shortening

By default **obsidian-dataview** generates file-links using the full-path of the note, this avoids file-name collitions, but the persisted content may be hard to read on **editing mode**.

This plugin has a [link-shortening option](./docs/settings.md#shorten-persisted-links) enabled by default (can be disabled) that reduces the links to shorter possible way, but may cause name collitions if you tend to have notes with repeated names.

---

## Instalation

### From within Obsidian

> I'm working ⚒️ on making this posible.

You can activate this plugin within Obsidian by doing the following:

- Open Settings > Third-party plugin
- Make sure Safe mode is **off**
- Click Browse community plugins
- Search for "Dataview Persister"
- Click Install
- Once installed, enable the plugin

### From source

You can activate this plugin, building from source by doing the following:

- Clone the repository
- Install the dependencies
- Run `pnpm build:dist` or an equivalent.
- Copy the content of the repository `dist` folder to your vault, the path should look like `<path-to-your-vault>/.obsidian/plugins/dataview-persister`
- Open your vault in _Obsidian_ and activate the newly installed plugin

---

## Pricing

This plugin is provided to everyone for free, however if you would like to
say thanks or help support continued development, feel free to send a little
through the following method:

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/luisbs)

## Notes

The plugin is not on active development, new features or changes are developed when there is an oportunity. But issues and bugs will have especial priority.


### Similar plugins

For transparence this is not the only nor the first plugin to allow persisting the **obsidian-dataview** queries to the note.

I think a lot of people using **obsidian-dataview** may have tought on ideas similar to what this plugin does, I developed this plugin either way cause it was an execuse for me to look into **obsidian.md** plugin development.

I've developed other plugins (e.g. [attachments-cache](https://github.com/luisbs/obsidian-attachments-cache) or [components](https://github.com/luisbs/obsidian-components)) and this plugin open to me new areas I haven't research before.

But other plugins may suit you more, like:

- [udus122/dataview-publisher](https://github.com/udus122/dataview-publisher) similar in features.
- [dsebastien/obsidian-dataview-serializer](https://github.com/dsebastien/obsidian-dataview-serializer) is more limited, [it doesn't supports multiline quieries](https://github.com/dsebastien/obsidian-dataview-serializer/issues/12).

> Note: this comparison was done on april of 2025, the comparison is based on the information public on their GitHub page.

| Feature                                | this plugin | **udus122/dataview-publisher** |
| -------------------------------------- | ----------- | ------------------------------ |
| Supports queries on Markdown comments  |     ✅      |               ✅               |
| Supports queries on HTML comments      |     ✅      |               🚫               |
| Support for **DataviewJs**             |     ✅      | [limited](https://github.com/udus122/dataview-publisher?tab=readme-ov-file#dataview-js-experimental) |
| Avoids fencing simple results          |     ✅      |               🚫               |

#### About fencing

Fencing relates to having to add comments to mark the start and end of content

- A simple result would be the output of a [DQL](https://blacksmithgu.github.io/obsidian-dataview/queries/structure/) for example a `TABLE FROM ...`

**obsidian-dataview-persister** generates a more readable content, on **reading view** they may look the same, but on **editing mode** a simplier output may be preferred. An example looks like:

````md
%%dv LIST FROM #articles SORT file.name %%

- [[Article1]]
- [[Article2]]
````

Meanwhile using **udus122/dataview-publisher** would look like:

````md
%% DATAVIEW_PUBLISHER: start
```dataview
LIST FROM #articles SORT file.name
```
%%
- [[Article1.md|Article1]]
- [[Article2.md|Article2]]
%% DATAVIEW_PUBLISHER: end %%
````
On the other hand a complex result would contain line-breaks or HTML (using **DataviewJs**) or other content that may be harder to differentiate from the user written content. In that condition **obsidian-dataview-persister** will also use fences. e.g.:

````md
%%dv
const recipes = dv.pages('"recipes"').map(recipe => `[[${recipe.file.name}]]`);
dv.header(3, "Recipes");
dv.paragraph(dv.markdownList(recipes));
%%

<!--dv-start KEEP THIS COMMENT -->
<h3><span><p dir="auto">Recipes</p></span></h3><p><span><ul>
<li dir="auto"><a data-href="pbj" href="pbj" class="internal-link" target="_blank" rel="noopener nofollow">pbj</a></li>
<li dir="auto"><a data-href="toast" href="toast" class="internal-link" target="_blank" rel="noopener nofollow">toast</a></li>
</ul></span></p>
<!--dv-end KEEP THIS COMMENT -->
````
