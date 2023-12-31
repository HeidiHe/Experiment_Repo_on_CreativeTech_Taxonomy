// app that creates a collapsible tree visualization using D3

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let data;

fetch('./processed_data.json')
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
})
.then(data => {console.log(data); create_visualization(data)})
.catch(error => console.log(error));

function color(d) {
  const creativeCodeColor = "red";
  const AimlColor = "blue";
  const UncategorizedUtilsColor = "purple";

  //color all the nodes
  function checkAncestors(node, name) {
    if (!node) {
      return false;
    }
    if (node.data.name === name) {
      return true;
    }
    return checkAncestors(node.parent, name);
  }

  if (checkAncestors(d, "Creative Code Frameworks")) {
    return "pink";
  } else if (checkAncestors(d, "Real-time 3D/Game Engines")) {
    return "deepskyblue";
  } else if (checkAncestors(d, "AI/Machine Learning")) {
    return "red";
  }  else if (checkAncestors(d, "Uncategorized Utilities/DevOps")) {
    return "firebrick";
  } else if (checkAncestors(d, "Pro AV Hardware and Related Software")) {
    return "darksalmon";
  } else if (checkAncestors(d, "Optical Tracking")) {
    return "darkmagenta";
  } else if (checkAncestors(d, "Sensors/Interaction Methods")) {
    return "darkviolet";
  } else if (checkAncestors(d, "Physical Computing")) {
    return "lightblue";
  } else if (checkAncestors(d, "Web/Networking Frameworks")) {
      return "limegreen";
  } else if (checkAncestors(d, "Mobile Technology")) {
    return "gold";
  } else if (checkAncestors(d, "Asset Creation")) {
    return "deeppink";
  }else {
    return d._children ? "#555" : "#999"; // Default color
  }
}

//document.body.style.backgroundColor = "black";

function create_visualization(data){    // Specify the charts’ dimensions. The height is variable, depending on the layout.
    const width = 2200;
    
    const marginTop = 100;
    const marginRight = 10;
    const marginBottom = 10;
    const marginLeft = 150;  
    const fontSize = 12; // Adjust the font size as needed
    const circleRadius = 3; // Adjust the circle radius as needed
    const strokeWidth = 3; // Adjust the stroke width as needed

    // Rows are separated by dx pixels, columns by dy pixels. These names can be counter-intuitive
    // (dx is a height, and dy a width). This because the tree must be viewed with the root at the
    // “bottom”, in the data domain. The width of a column is based on the tree’s height.
    const root = d3.hierarchy(data);
    const dx = 15;
    const dy = 200; // Set dy to the screen width minus the left and right margins

    // Define the tree layout and the shape for links.
    const tree = d3.tree().nodeSize([dx, dy]);
    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

    // Create the SVG container, a layer for the links and a layer for the nodes.
    const svg = d3.create("svg")
      .attr("width", "100%") // Set the width to 100% of the container
      .attr("height", dx)
      .attr("viewBox", [-marginLeft, -marginTop, window.innerWidth, dx]) // Set the viewBox width to the screen width
      // .attr("style", "max-width: 100%; height: auto; font: 30px Source Sans Pro; user-select: none;");        // .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; user-select: none;");
      .attr("style", `width: auto; height: auto; font: ${fontSize}px sans-serif; overflow-x: scroll;`);

    const gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", strokeWidth);

    const gNode = svg.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");
  
    function update(event, source) {
      const duration = event?.altKey ? 2500 : 250; // hold the alt key to slow down the transition
      const nodes = root.descendants().reverse();
      const links = root.links();
  
      // Compute the new tree layout.
      tree(root);
  
      let left = root;
      let right = root;
      root.eachBefore(node => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });
  
      const height = right.x - left.x + marginTop + marginBottom;
  
      const transition = svg.transition()
          .duration(duration)
          .attr("height", height)
          .attr("viewBox", [-marginLeft, left.x - marginTop, width, height])
          .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));
  
      // Update the nodes…
      const node = gNode.selectAll("g")
        .data(nodes, d => d.id);
  
      // Enter any new nodes at the parent's previous position.
      
      const nodeEnter = node.enter().append("g")
          .attr("transform", d => `translate(${source.y0},${source.x0})`)
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0)
          .on("click", (event, d) => {
            d.children = d.children ? null : d._children;
            update(event, d);
          });

      
      // add warping box around text node
      nodeEnter.append("rect")
        .attr("rx", 5) // Adjust the x-radius for rounded corners
        .attr("ry", 5) // Adjust the y-radius for rounded corners
        .attr("width", d =>d.data.name.length * (fontSize-5) + 20) // Adjust the width based on text length and font size
        .attr("height", fontSize + 4) // Adjust the height as needed (font size + padding)
        .attr("fill", "lightgray") // Adjust the background color
        .attr("x", d => d._children ? -d.data.name.length * (fontSize-5) -20 : 5) // Center the rect around the text
        .attr("y", -(fontSize + 4)/2) // Center the rect vertically around the text
        .attr('fill', color)
        .attr("opacity", d => d._children ? 0: 0.5)
      
      nodeEnter.append("circle")
        .attr("r", circleRadius)
        .attr("fill", color)
        .attr("stroke-width", strokeWidth);
  
      nodeEnter.append("text")
          .attr("dy", "0.31em")
          .attr("x", d => d._children ? -fontSize : fontSize)
          .attr("text-anchor", d => d._children ? "end" : "start")
          //.attr("text-anchor", "middle")
          .text(d => d.data.name)

      nodeEnter.select("text")
          .clone(true).lower()
          .attr("stroke-linejoin", "round")
          .attr("stroke-width", strokeWidth)
          .attr("stroke", "white");

      /*
      //to implement later - how to add things to nodes
      nodeEnter.select("circle")
      .on("click", (event, d) => {
        const newNodeName = prompt("Enter the name for the new node:");
        if (newNodeName) {
          // Create a new node
          const newNode = { name: newNodeName, children: [] };
    
          // Add the new node as a child of the clicked node
          if (!d.children) d.children = [];
          d.children.push(newNode);
    
          // Update the hierarchy and visualization
          const newRoot = d3.hierarchy(data);
          tree(newRoot);
          update(event, newRoot);
        }
      });
      */

      // Transition nodes to their new position.
      const nodeUpdate = node.merge(nodeEnter).transition(transition)
          .attr("transform", d => `translate(${d.y},${d.x})`)
          .attr("fill-opacity", 1)
          .attr("stroke-opacity", 1);
  
      // Transition exiting nodes to the parent's new position.
      const nodeExit = node.exit().transition(transition).remove()
          .attr("transform", d => `translate(${source.y},${source.x})`)
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0);
  
      // Update the links…
      const link = gLink.selectAll("path")
        .data(links, d => d.target.id);
  
      // Enter any new links at the parent's previous position.
      const linkEnter = link.enter().append("path")
          .attr("d", d => {
            const o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          })
          .attr("stroke-width", strokeWidth)
          .attr("stroke", d => color(d.source)); // Set link color to the same color as nodes

  
      // Transition links to their new position.
      link.merge(linkEnter).transition(transition)
          .attr("d", diagonal)
          .attr("stroke", d => color(d.source)); // Set link color to the same color as nodes
  
      // Transition exiting nodes to the parent's new position.
      link.exit().transition(transition).remove()
          .attr("d", d => {
            const o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          });
  
      // Stash the old positions for transition.
      root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }
  
    // Do the first update to the initial configuration of the tree — where a number of nodes
    // are open (arbitrarily selected as the root, plus nodes with 7 letters).
    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
     // if (d.depth && d.data.name.length !== 12) d.children = null;
    });
  
   update(null, root);
  
  container.append(svg.node());
}
   