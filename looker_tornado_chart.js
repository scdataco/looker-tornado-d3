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
        .viz-div, .viz-div a {
          // Vertical centering
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          font-family: sans-serif;
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

    console.log("shapedData\n",shapedData)

    // dummy data
    /*
    const shapedData = [
      { age: "<5", sex: leftCategory, value: 75713 },
      { age: "<5", sex: "F", value: 36305 },
      { age: "5-9", sex: leftCategory, value: 70147 },
      { age: "5-9", sex: "F", value: 31835 },
      { age: "10-14", sex: leftCategory, value: 61873 },
      { age: "10-14", sex: "F", value: 17913 },
      { age: "15-19", sex: leftCategory, value: 42624 },
      { age: "15-19", sex: "F", value: 11857 },
      { age: "20-24", sex: leftCategory, value: 76412 },
      { age: "20-24", sex: "F", value: 27820 },
      { age: "25-29", sex: leftCategory, value: 89596 },
      { age: "25-29", sex: "F", value: 18414 },
      { age: "30-34", sex: leftCategory, value: 25791 },
      { age: "30-34", sex: "F", value: 57848 },
      { age: "35-39", sex: leftCategory, value: 99569 },
      { age: "35-39", sex: "F", value: 56213 },
      { age: "40-44", sex: leftCategory, value: 30986 },
      { age: "40-44", sex: "F", value: 65142 },
      { age: "45-49", sex: leftCategory, value: 71984 },
      { age: "45-49", sex: "F", value: 98384 },
      { age: "50-54", sex: leftCategory, value: 51409 },
      { age: "50-54", sex: "F", value: 74081 },
      { age: "55-59", sex: leftCategory, value: 73646 },
      { age: "55-59", sex: "F", value: 28301 },
      { age: "60-64", sex: leftCategory, value: 24852 },
      { age: "60-64", sex: "F", value: 90829 },
      { age: "65-69", sex: leftCategory, value: 76271 },
      { age: "65-69", sex: "F", value: 71175 },
      { age: "70-74", sex: leftCategory, value: 67513 },
      { age: "70-74", sex: "F", value: 20208 },
      { age: "75-79", sex: leftCategory, value: 16432 },
      { age: "75-79", sex: "F", value: 13697 },
      { age: "80-84", sex: leftCategory, value: 78691 },
      { age: "80-84", sex: "F", value: 32738 },
      { age: "≥85", sex: leftCategory, value: 20771 },
      { age: "≥85", sex: "F", value: 37981 }
    ]
    */

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
    console.log("height", height)

    yAxis = g => g
      .attr("transform", `translate(${xLeft(0) - 10},0)`)
      .call(d3.axisRight(y).tickSizeOuter(0))
      .call(g => g.selectAll(".tick text").attr("fill", "black").attr("text-anchor", "middle"))

    // x axis with ticks
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
      .attr("font-size", 10)

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
      .text(d => d["xMeasure"].toLocaleString())
      // shift left/right match bar shift
      .attr("transform", d => d["category"] === leftCategory ? `translate(-${centreShift},0)` : `translate(${centreShift},0)`)

    // left category label
    svg.append("text")
      .attr("text-anchor", "end")
      // .attr("fill", "blue")
      .attr("dy", "0.35em")
      .attr("x", xLeft(0) - 24)
      // .attr("y", y(shapedData[0].age) + y.bandwidth() / 2)
      .attr("y", 10)
      .attr("font-size", 14)
      .attr("fill", d => leftColour)
      .attr("font-weight", 800)
      .text(leftCategory)

    // right category label
    svg.append("text")
      .attr("text-anchor", "start")
      // .attr("fill", "white")
      .attr("dy", "0.35em")
      .attr("x", xRight(0) + 24)
      // .attr("y", y(shapedData[0].age) + y.bandwidth() / 2)
      .attr("y", 10)
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
  }
})