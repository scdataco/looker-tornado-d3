# Looker Tornado Chart Visualisation
This is a basic [Tornado chart](https://en.wikipedia.org/wiki/Tornado_diagram) custom visualisation for [Looker](https://www.looker.com/), using Looker's [custom visualisation API](https://github.com/looker-open-source/custom_visualizations_v2/), written/provided by [scdata](https://www.scdata.com).

<img width="856" alt="image" src="https://user-images.githubusercontent.com/61508254/169885133-641a56e2-b56c-4cb2-a9a3-a72c9eea2839.png">

## Installation
To install this visualisation on your Looker instance, go to the visualisations admin page at `[youlookerinstance]/admin/visualizations` and enter [https://scdataco.github.io/looker-tornado-d3/looker_tornado_chart.js](https://scdataco.github.io/looker-tornado-d3/looker_tornado_chart.js) for the 'main' URL. Under dependencies, enter [https://d3js.org/d3.v7.min.js](https://d3js.org/d3.v7.min.js) to ensure that d3 is loaded alongside the main JavaScript file.

Choose a suitable ID e.g. `tornado_chart` and a label e.g. `🌪 Tornado` to show to users when they pick a visualisation.

**Note: it seems that Looker's [New Explore Visualisations beta lab feature](https://docs.looker.com/admin-options/settings/labs#new_explore_visualizations) causes custom visualisation errors not to work properly and settings to behave strangely, and the drill menu to not be styled correctly. Turning this lab off appears to resolve these issues.**

## Status/known issues
- currently in alpha status, so use at your own risk. Looker custom visualisations are loaded in a sandboxed iFrame so there *should* be minimal or no chance of this breaking anything beyond the visualisation not loading or working properly, but this cannot be guaranteed
- works with results made up of one visible dimension, one visible pivot and the first visible measure/measure-like calculation.
- ~no friendly error messages yet~ errors if there are no pivots/dimensions/measures in the query. See note above about New Explore visualisations lab.
- Value formats work but may not behave correctly e.g. number of decimals is not always respected properly
- settings are available for bar colours and showing/hiding x scale
- x scale doesn't always respect value formats
- drill menus when clicking bars do work ~styles don't currently match Looker's native drill menus~ (see note above about New Explore visualisations lab)
- probably various other things to improve/fix/add

## License
MIT license, i.e. do what you want with this and it's not my problem if it doesn't work or something goes wrong :)

See the [license file](LICENSE).

## Misc
If you're interested in helping make this better (or want me to build a custom Looker visualisation for you) get in touch via my [website](https://www.scdata.co/contact), or on [LinkedIn](https://www.linkedin.com/in/looker-expert/).

scdata is a trading name of SC IT Consulting Limited.
