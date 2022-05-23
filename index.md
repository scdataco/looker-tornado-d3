# Looker Tornado Chart Visualisation
This is a basic [Tornado chart](https://en.wikipedia.org/wiki/Tornado_diagram) custom visualisation for [Looker](https://www.looker.com/), using Looker's [custom visualisation API](https://github.com/looker-open-source/custom_visualizations_v2/), written/provided by [scdata](https://www.scdata.com).

<img width="856" alt="image" src="https://user-images.githubusercontent.com/61508254/169885133-641a56e2-b56c-4cb2-a9a3-a72c9eea2839.png">

## Installation
To install this visualisation on your Looker instance, go to the visualisations admin page at `[youlookerinstance]//admin/visualizations` and enter `https://scdataco.github.io/looker-tornado-d3/looker_tornado_chart.js` for the 'main' URL. Under dependencies, enter `https://d3js.org/d3.v7.min.js` to ensure that D3 is loaded alongside the main JavaScript file.

## Status/known issues
- currently in alpha status, so use at your own risk. Looker custom visualisations are loaded in a sandboxed iFrame so there *should* be minimal or no chance of this breaking anything beyond the visualisation not loading or working properly, but this cannot be guaranteed
- works with results made up of one visible dimension and one visible pivot.
- no friendly error messages yet
- Value formats work but may not behave correctly e.g. number of decimals is not always respected properly
- settings are available for bar colours and showing/hiding x scale
- x scale doesn't always respect value formats
- drill menus when clicking bars do work; styles don't currently match Looker's native drill menus
