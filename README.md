# Drawing Pedigree Trees with D3
![example #1](readme_assets/header_image.png)

## Intro
This is a JavaScript tool which uses [D3.js]() to draw and/or arrange biparental [DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph)s. Ultimately, the goal is to make it a D3 plugin. It was developed in order to ease the visualization of complicated pedigree trees. As such, parent/child relationships are considered to be either mother/child or father/child (one of each for any given child).

---
[Skip to Documentation](#usage)

---

## Arranging the Tree

In order to "untangle" the tree the following algorithm is used:
1. Each node is assigned a level such that `level(node) = max(level(mother(node)), level(father(node))) + 1`
    - "Root" nodes (those without parents) are assigned a level such that `level(node) = max(0, min(level(child) for child in children(node))-1)`


## Usage

_pedigreeTree uses a closure for configuration._

Create a pedigreeTree function:
```javascript
let pdgtree = pedigreeTree();
```
Configure the function (this is an example, see the [Configuration Reference](#configuration-reference) for more information):
```javascript
pdgtree.levelWidth(400)
    .nodePadding(40)
    .zoomable(true)
    .sort(100)
    .groupChildless(true)
    .updateDuration(800)
    .hideOnHover(true)
    .mother(function(d){
        return d.mom;
    })
    .father(function(d){
        return d.dad;
    })
    .children(function(d){
        return node_data.filter(function(c){
            return (c.dad==d || c.mom==d);
        })
    })
    .data(node_data);
```
To just get the layout information:
```javascript
layout_data = pdgtree.treeLayout();
```
To draw the tree:
```javascript
svgSelector = '.tree-svg';

layout_data = pdgtree(svgSelector);
//OR
d3.select(layout_data).call(svgSelector);

```


### Configuration Reference
#### Defining Nodes  
_Options for input data & parsing._

<a href="#data" name="data">#</a> pdgtree.**data**(_array_)  
Sets an _array_ of objects (members) which will be used as the basis for constructing nodes. These will not be modified and will be accessible via node.value from the resulting node objects.

<a href="#id" name="id">#</a> pdgtree.**id**(_function_)  
Sets the the ID accessor. _function_ is passed a [data member](#data) and should return an ID string. IDs will be used to insure nodes maintain [object constancy](https://bost.ocks.org/mike/constancy/).

<a href="#mother" name="mother">#</a> pdgtree.**mother**(_function_)  
Sets the the mother accessor. _function_ is passed a [data member](#data) and should return the [data member](#data) which represents the mother node (or `null` if parentless).

<a href="#father" name="father">#</a> pdgtree.**father**(_function_)  
Sets the father accessor similar to [pdgtree.**mother**](#mother).

<a href="#children" name="children">#</a> pdgtree.**children**(_function_)  
Sets the child accessor. _function_ is passed a [data member](#data) and should return an array of all child [data members](#data). An empty array should be returned in the case of no children.

<a href="#value" name="value">#</a> pdgtree.**value**(_function_)  
Sets the the value accessor. _function_ is passed a [data member](#data) and should return a value to be given assigned as node.value. By deafult, the value is is [data member](#data) itself.


### Layout Options  
_Options for generating the tree data._

<a href="#sort" name="sort">#</a> pdgtree.**sort**(_value_)  
Sets the maximum number of iterations of the sort algorithm to perform.  

<a href="#level-width" name="level-width">#</a> pdgtree.**levelWidth**(_value_)  
Sets the horizontal distance (in points) between levels of nodes.  
<img src="readme_assets/level-width.png" height="200px">

<a href="#node-padding" name="node-padding">#</a> pdgtree.**nodePadding**(_value_)  
Sets the **minimum** verticle distance (in points) between nodes in a level.  
<img src="readme_assets/node-padding.png" height="200px">

<a href="#group-childless" name="group-childless">#</a> pdgtree.**groupChildless**(_boolean_)  
Toggle grouping for childless nodes. If enabled, siblings without children will be collapsed into groups. (In the drawn tree, these groups can be expanded by clicking them).

<a href="#min-group-size" name="min-group-size">#</a> pdgtree.**minGroupSize**(_value_)  
Sets the minimum number of siblings required in order for them to be collapsed into a group.


### Draw Options
_Options which effect how the tree is drawn & it's interactivity._  

<a href="#node-width" name="node-width">#</a> pdgtree.**nodeWidth**(_value_)  
Sets the horizontal distance (in points) nodes and the start of the outgoing edges. This allows for labels to be added to the nodes (by selecting them after drawing the tree) if desired.  
<img src="readme_assets/node-width.png" height="200px">

<a href="#group-expand" name="group-expand">#</a> pdgtree.**groupExpand**(_value_)  
Sets the number of siblings which are expanded from a group on each click.

<a href="#update-duration" name="update-duration">#</a> pdgtree.**updateDuration**(_value_)  
Sets the transition duration when a group is expanded.

<a href="#hide-on-hover" name="hide-on-hover">#</a> pdgtree.**hideOnHover**(_value_)  
When enabled, all but immediate relatives will fade out when the user hovers over a node.

<a href="#autofit" name="autofit">#</a> pdgtree.**autofit**(_selector_)  
If d3.select(_selector_) is not empty, the drawn tree will be automatically scaled to fit inside the selected SVG element.

<a href="#zoomable" name="zoomable">#</a> pdgtree.**zoomable**(_value_)  
When enabled, enables drag and zoome on the drawn tree.
