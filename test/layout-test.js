// var tape = require("tape"),
//     d3 = require("../");
// var fs = require('fs');
// 
// var test_in = require("./in");
// var test_out = require("./out");
// 
// // https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
// var flattenObject = function(ob) {
//     var toReturn = {};
// 
//     for (var i in ob) {
//         if (!ob.hasOwnProperty(i)) continue;
// 
//         if ((typeof ob[i]) == 'object') {
//             var flatObject = flattenObject(ob[i]);
//             for (var x in flatObject) {
//                 if (!flatObject.hasOwnProperty(x)) continue;
// 
//                 toReturn[i + '.' + x] = flatObject[x];
//             }
//         } else {
//             toReturn[i] = ob[i];
//         }
//     }
//     return toReturn;
// };
// 
// var just_ids = function(d){return d.id};
// 
// tape("Everything layed out as expected?", function(test) {
//   var tree = d3.pedigreeTree()
//     .levelWidth(500)
//     .nodePadding(60)
//     .nodeWidth(150)
//     .linkPadding(25)
//     .value(function(d){
//       return d.id;
//     })
//     .parents(function(d){
//       return [test_in[d.mother],test_in[d.father]].filter(Boolean);
//     })
//     .groupChildless(true)
//     .iterations(10)
//     .data(test_in);
//   var results = tree();
//   results.nodes.forEach(function(node){
//     node.children = node.children.map(just_ids);
//     node.parents = node.parents.map(just_ids);
//     if (Array.isArray(node.value)){
//       node.value = node.value.map(just_ids);
//     }
//   });
//   results.links.forEach(function(d_link){
//     if (d_link.sources!==undefined){
//       d_link.sources = d_link.sources.map(just_ids);
//     } else {
//       d_link.source = just_ids(d_link.source);
//     }
//     if (d_link.sinks!==undefined){
//       d_link.sinks = d_link.sinks.map(just_ids);
//     } else {
//       d_link.sink = just_ids(d_link.sink);
//     }
//   });
//   var finobj = flattenObject(results);
//   var finstring = JSON.stringify(finobj, Object.keys(finobj).sort());
//   // var fs = require('fs');
//   // fs.writeFile("out.json", finstring, function(err) {
//   //     if(err) {
//   //         return console.log(err);
//   //     }
//   // 
//   //     console.log("The file was saved!");
//   // }); 
//   // test.equal(test_out, finstring);
//   // test.end();
// });
