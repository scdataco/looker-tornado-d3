looker.plugins.visualizations.add({
  formatType: function (valueFormat) {
    if (valueFormat == null){
      return function (x) { return x.toLocaleString() }
    }
    if (typeof valueFormat != "string") {
      return function (x) { return x }
    }
    let format = ""
    switch (valueFormat.charAt(0)) {
      case '$':
        format += '$'; break
      case '£':
        format += '£'; break
      case '€':
        format += '€'; break
    }
    if (valueFormat.indexOf(',') > -1) {
      format += ','
    }
    splitValueFormat = valueFormat.split(".")
    format += '.'
    format += splitValueFormat.length > 1 ? splitValueFormat[1].length : 0

    switch (valueFormat.slice(-1)) {
      case '%':
        format += '%'; break
      case '0':
        format += 'f'; break
    }
    return d3.format(format)
  },

  create: function (element, config) {
    console.log("d3:\n", d3)

    element.innerHTML = `
      <style>
        #vis {
        
        }
      </style>
    `

    this._tooltip = d3.select(element).append('div').attr('class', 'tornado-tooltip')
    this._svg = d3.select(element).append("svg")
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
    this.clearErrors()

    console.log("QUERY RESPONSE:\n", queryResponse)
    console.log("DATA:\n", data)

    const pivots = queryResponse.pivots

    const leftCategory = pivots[0].key
    const rightCategory = pivots[1].key

    const newOptions = {
      show_x_scale: {
        type: "boolean",
        label: "Show scale?",
        default: true,
        order: 0
      },
      left_colour: {
        label: leftCategory + " Colour",
        type: "string",
        display: "color",
        default: "#B1399E",
        order: 1
      },
      right_colour: {
        label: rightCategory + " Colour",
        type: "string",
        display: "color",
        default: "#3EB0D5",
        order: 2
      },
    }

    this.trigger('registerOptions', newOptions)

    const leftColour = config.left_colour
    const rightColour = config.right_colour

    const yDimension = queryResponse.fields.dimension_like[0].name
    const xMeasure = queryResponse.fields.measure_like[0].name

    const d3Format = this.formatType(queryResponse.fields.measure_like[0].value_format)

    shapedData = data.reduce((acc, curr) => {
      return acc.concat([
        {
          "yGroup": curr[yDimension]["value"],
          "category": leftCategory,
          "xMeasure": curr[xMeasure][leftCategory]["value"],
          "links": curr[xMeasure][leftCategory]["links"],
        },
        {
          "yGroup": curr[yDimension]["value"],
          "category": rightCategory,
          "xMeasure": curr[xMeasure][rightCategory]["value"],
          "links": curr[xMeasure][rightCategory]["links"],
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


    const y = d3.scaleBand()
      .domain(shapedData.map(d => d["yGroup"]))
      .rangeRound([height - margin.bottom, margin.top])
      .padding(0.1)

    const xLeft = d3.scaleLinear()
      .domain([0, d3.max(shapedData, d => d["xMeasure"])])
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
      .attr("x", d => d["category"] === leftCategory ? xLeft(d["xMeasure"]) : xRight(0))
      .attr("y", d => y(d["yGroup"]))
      .attr("width", d => d["category"] === leftCategory ? xLeft(0) - xLeft(d["xMeasure"]) : xRight(d["xMeasure"]) - xRight(0))
      .attr("height", y.bandwidth())
      // shift left/right to allow space for labels
      .attr("transform", d => d["category"] === leftCategory ? `translate(-${centreShift},0)` : `translate(${centreShift},0)`)
      .on('click', (e, d) => drillClick(e, d))

    // bar values
    svg.append("g")
      .attr("fill", "white")
      .selectAll("text")
      .data(shapedData)
      .join("text")
      // .attr("text-anchor", "middle")
      .attr("text-anchor", d => d["category"] === leftCategory ? "start" : "end")
      .attr("x", d => d["category"] === leftCategory ? xLeft(d["xMeasure"]) + 4 : xRight(d["xMeasure"]) - 4)
      .attr("y", d => y(d["yGroup"]) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text(d => d["xMeasure"] ? d3Format(d["xMeasure"]) : 0)
      // shift left/right match bar shift
      .attr("transform", d => d["category"] === leftCategory ? `translate(-${centreShift},0)` : `translate(${centreShift},0)`)
      .on('click', (e, d) => drillClick(e, d))

    // left category label
    svg.append("text")
      .attr("text-anchor", "end")
      // .attr("fill", "blue")
      .attr("dy", "0.35em")
      .attr("x", xLeft(0) - centreShift)
      // .attr("y", y(shapedData[0].age) + y.bandwidth() / 2)
      .attr("y", 6)
      .attr("font-size", 14)
      .attr("fill", d => leftColour)
      .attr("font-weight", 800)
      .text(leftCategory)

    // right category label
    svg.append("text")
      .attr("text-anchor", "start")
      // .attr("fill", "white")
      .attr("dy", "0.35em")
      .attr("x", xRight(0) + centreShift)
      // .attr("y", y(shapedData[0].age) + y.bandwidth() / 2)
      .attr("y", 6)
      .attr("font-size", 14)
      .attr("fill", d => rightColour)
      .attr("font-weight", 800)
      .text(rightCategory)

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
        .call(g => g.selectAll(".tick:first-of-type").remove())

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