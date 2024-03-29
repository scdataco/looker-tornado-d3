looker.plugins.visualizations.add({
  options: {
    show_x_scale: {
      type: "boolean",
      label: "Show scale?",
      default: false,
      order: 1
    },
    left_colour: {
      label: "Left Bars Colour",
      type: "string",
      display: "color",
      default: "#FBB555",
      order: 2
    },
    right_colour: {
      label: "Right Bars Colour",
      type: "string",
      display: "color",
      default: "#3EB0D5",
      order: 3
    },
  },

  create: function (element, config) {
    this._svg = d3.select(element).append("svg")
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
    // errors if data isn't right
    if (this.addError && this.clearErrors) {
      if (!queryResponse.pivots) {
        this.addError({ title: 'No Pivots', group: "data", message: "Tornado chart requires a pivot and will use the first two visible columns." })
        return
      }
      if (queryResponse.fields.dimension_like.length == 0) {
        this.addError({ title: 'No Dimensions', group: "data", message: "Tornado chart requires an un-pivoted dimension." })
        return
      }
      if (queryResponse.fields.measure_like.length == 0) {
        this.addError({ title: 'No Measures', group: "data", message: "Tornado chart requires a measure." })
        return
      }
      this.clearErrors("data")
    }

    console.log("Query response:\n", queryResponse)

    const pivotName = queryResponse.fields.pivots[0].name
    const pivots = queryResponse.pivots

    const leftCategory = pivots[0].key
    const rightCategory = pivots[1].key
    const leftCategoryLabel = pivots[0].data[pivotName]
    const rightCategoryLabel = pivots[1].data[pivotName]

    // replace the options to include the series names
    const newOptions = {
      show_x_scale: {
        type: "boolean",
        label: "Show scale?",
        default: true,
        order: 1
      },
      left_colour: {
        label: leftCategoryLabel + " Colour",
        type: "string",
        display: "color",
        default: "#FBB555",
        order: 2
      },
      right_colour: {
        label: rightCategoryLabel + " Colour",
        type: "string",
        display: "color",
        default: "#3EB0D5",
        order: 3
      },
    }

    this.trigger('registerOptions', newOptions)

    const leftColour = config.left_colour
    const rightColour = config.right_colour

    const dimension = queryResponse.fields.dimension_like[0].name
    const measure = queryResponse.fields.measure_like[0].name

    shapedData = data.reduce((acc, curr) => {
      return acc.concat([
        {
          yGroup: curr[dimension]["value"],
          category: leftCategory,
          measure: curr[measure][leftCategory]["value"],
          rendered: curr[measure][leftCategory]["rendered"],
          links: curr[measure][leftCategory]["links"],
        },
        {
          yGroup: curr[dimension]["value"],
          category: rightCategory,
          measure: curr[measure][rightCategory]["value"],
          rendered: curr[measure][rightCategory]["rendered"],
          links: curr[measure][rightCategory]["links"],
        }
      ])
    }, []).reverse()

    // for making a gap in the middle
    const centreSpace = 90
    const centreShift = centreSpace / 2


    // to allow space for the scale
    const margin = ({ top: 10, right: centreShift, bottom: 20, left: centreShift })

    const width = element.clientWidth

    // count rows and set height for rows
    const rows = Math.ceil(shapedData.length / 2)

    const rowHeight = Math.floor((element.clientHeight - margin.top - margin.bottom) / rows)

    const height = shapedData.length / 2 * rowHeight + margin.top + margin.bottom

    const drillClick = (e, d) => {
      LookerCharts.Utils.openDrillMenu({
        links: d.links,
        event: e
      })
    }

    const yAxis = g => g
      .attr("transform", `translate(${xLeft(0) - 10},0)`)
      .call(d3.axisRight(y).tickSizeOuter(0))
      .call(g => g.selectAll(".tick text")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
      )
      .call(g => g.selectAll(".tick line").remove())


    const y = d3.scaleBand()
      .domain(shapedData.map(d => d["yGroup"]))
      .rangeRound([height - margin.bottom, margin.top])
      .padding(0.1)

    const xLeft = d3.scaleLinear()
      .domain([0, d3.max(shapedData, d => d["measure"])])
      .rangeRound([width / 2, margin.left])


    const xRight = d3.scaleLinear()
      .domain(xLeft.domain())
      .rangeRound([width / 2, width - margin.right])

    const svg = this._svg
      .html('') // clear existing contents
      .attr("viewBox", [0, 0, width, height])
      .attr("font-family", "sans-serif")
      .attr("font-size", '80%')

    // bars
    svg.append("g")
      .selectAll("rect")
      .data(shapedData)
      .join("rect")
      .attr("fill", d => d["category"] === leftCategory ? leftColour : rightColour)
      .attr("x", d => d["category"] === leftCategory ? xLeft(d["measure"]) : xRight(0))
      .attr("y", d => y(d["yGroup"]))
      .attr("width", d => d["category"] === leftCategory ? xLeft(0) - xLeft(d["measure"]) : xRight(d["measure"]) - xRight(0))
      .attr("height", y.bandwidth())
      // shift left/right to allow space for labels
      .attr("transform", d => d["category"] === leftCategory ? `translate(-${centreShift},0)` : `translate(${centreShift},0)`)
      .attr("cursor", "pointer")
      .on('click', (e, d) => drillClick(e, d))

    // bar values
    svg.append("g")
      .attr("fill", "#222222")
      .selectAll("text")
      .data(shapedData)
      .join("text")
      .attr("text-anchor", d => d["category"] === leftCategory ? "end" : "start")
      // puts values next to centre
      .attr("x", d => d["category"] === leftCategory ? xLeft(0) - 6 : xRight(0) + 6)
      .attr("y", d => y(d["yGroup"]) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text(d => d["rendered"] ? d["rendered"] : d["measure"])
      // shift left/right match bar shift
      .attr("transform", d => d["category"] === leftCategory ? `translate(-${centreShift},0)` : `translate(${centreShift},0)`)
      .attr("cursor", "pointer")
      .on('click', (e, d) => drillClick(e, d))

    // left category label
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("dy", "0.35em")
      .attr("x", xLeft(0) - centreShift)
      .attr("y", 6)
      .attr("font-size", 14)
      .attr("fill", d => leftColour)
      .attr("font-weight", 800)
      .text(leftCategoryLabel)

    // right category label
    svg.append("text")
      .attr("text-anchor", "start")
      .attr("dy", "0.35em")
      .attr("x", xRight(0) + centreShift)
      .attr("y", 6)
      .attr("font-size", 14)
      .attr("fill", d => rightColour)
      .attr("font-weight", 800)
      .text(rightCategoryLabel)

    // x axis with ticks
    if (config.show_x_scale) {
      const xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
          g =>
            g.append("g")
              .call(
                d3.axisBottom(xLeft)
                  .ticks(width / 80, "s")
                // make space in middle, match to bars
              ).attr("transform", `translate(-${centreShift},0)`)
        )
        .call(
          g =>
            g.append("g")
              .call(
                d3.axisBottom(xRight)
                  .ticks(width / 80, "s")
                // make space in middle, match to bars
              ).attr("transform", `translate(${centreShift},0)`)
        )
        .call(g => g.selectAll(".domain").remove())

      svg.append("g")
        .call(xAxis)
        .attr("fill", "white")
    }

    // y axis
    svg.append("g")
      .call(yAxis)
      // hide bar/ticks
      .selectAll(".domain").remove()

    this._svg = svg

    done()
  },
})