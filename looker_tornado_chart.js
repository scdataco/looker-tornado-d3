looker.plugins.visualizations.add({
  options: {
    show_x_scale: {
      type: "boolean",
      label: "Show scale?",
      default: true,
      order: 0
    }
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

    pivots = queryResponse.pivots

    pivotFieldRef = Object.keys(pivots[0].data)[0]
    leftCategory = pivots[0].key
    rightCategory = pivots[1].key

    newOptions = {      
      ...this.options,
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

    console.log("newOptions:\n", newOptions)


    this.trigger('registerOptions', newOptions)

    leftColour = config.left_colour
    rightColour = config.right_colour

    console.log("pivot stuff:\n", pivotFieldRef, leftCategory, rightCategory)

    yDimension = queryResponse.fields.dimension_like[0].name
    xMeasure = queryResponse.fields.measure_like[0].name

    console.log("yDim:\n", yDimension)
    console.log("xMeasure:\n", xMeasure)

    shapedData = data.reduce((acc, curr) => {
      return acc.concat([
        {
          "yGroup": curr[yDimension]["value"],
          "category": leftCategory,
          "xMeasure": curr[xMeasure][leftCategory]["value"]
        },
        {
          "yGroup": curr[yDimension]["value"],
          "category": rightCategory,
          "xMeasure": curr[xMeasure][rightCategory]["value"]
        }
      ])
    }, []).reverse()

    // for making a gap in the middle
    let centreSpace = 60
    let centreShift = centreSpace / 2


    // to allow space for the scale
    let margin = ({ top: 10, right: centreShift, bottom: 20, left: centreShift })

    let width = element.clientWidth

    // count rows and set height for rows
    let rows = Math.ceil(shapedData.length / 2)
    console.log("rows:\n", rows)

    let rowHeight = Math.floor((element.clientHeight - margin.top - margin.bottom) / rows)
    console.log("rowHeight", rowHeight)

    let height = shapedData.length / 2 * rowHeight + margin.top + margin.bottom

    yAxis = g => g
      .attr("transform", `translate(${xLeft(0) - 10},0)`)
      .call(d3.axisRight(y).tickSizeOuter(0))
      .call(g => g.selectAll(".tick text").attr("fill", "black").attr("text-anchor", "middle"))


    y = d3.scaleBand()
      .domain(shapedData.map(d => d["yGroup"]))
      .rangeRound([height - margin.bottom, margin.top])
      .padding(0.1)

    xLeft = d3.scaleLinear()
      .domain([0, d3.max(shapedData, d => d["xMeasure"])])
      .rangeRound([width / 2, margin.left])

    console.log("xLeft:\n", xLeft.domain)

    xRight = d3.scaleLinear()
      .domain(xLeft.domain())
      .rangeRound([width / 2, width - margin.right])

    const svg = this._svg
      .html('') // clear existing contents
      .attr("viewBox", [0, 0, width, height])
      .attr("font-family", "sans-serif")
      .attr("font-size", 12)

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
      .text(d => d["xMeasure"] ? d["xMeasure"].toLocaleString() : 0)
      // shift left/right match bar shift
      .attr("transform", d => d["category"] === leftCategory ? `translate(-${centreShift},0)` : `translate(${centreShift},0)`)

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
      xAxis = g => g
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
      .attr("color", "white")

    this._svg = svg

    done()
  },
})