// generates a new input for the test code.
function generate_nodes(num_init,num_breedings,min_children,max_children){
  var nodes = [];
  var id = 0;
  for (var i = 0; i < num_init; i++) {
    nodes.push({'mother':null,'father':null,'children':[],'id':id++,'level':0});
  }
  for (var i = 0; i < num_breedings; i++) {
    var mother = nodes[Math.floor(Math.random()*nodes.length)].id;
    var father = mother;
    while (father==mother || (father.level!==mother.level)){
      father = nodes[Math.floor(Math.random()*nodes.length)].id;
    }
    if (Math.random()>0.5){
      father = nodes[Math.floor(Math.random()*nodes.length)].id;
      while (father==mother){
        father = nodes[Math.floor(Math.random()*nodes.length)].id;
      }
    }
    var num_offspring = min_children+Math.floor(Math.random()*(max_children+1-min_children));
    for (var j = 0; j < num_offspring; j++) {
      var new_child = {'mother':mother,'father':father,'children':[],'id':id++};
      nodes[mother].children.push(new_child.id);
      nodes[father].children.push(new_child.id);
      nodes.push(new_child);
    }
  }
  return nodes; 
}

var ob = generate_nodes(4,10,2,10);

var ar = ob.map(function(d){
  return JSON.stringify(d, Object.keys(d).sort());
})

var st = "["+ar.join(",")+"]";



console.log(st);
