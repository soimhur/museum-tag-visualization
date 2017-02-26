
			var d_clicked = 0;
			var t_clicked = 0;
			
			d3.csv("./data/drawing-tag.csv", function(data) {
				var blocking = [1];
				var urlData = [];
				blocking.forEach(function() {
					d3.csv("./data/drawing-tag-fetch.csv", function(newData) {
						urlData = newData;
					});
				});

				//Define basic variables
				var margin = {top: 32, right: 60, bottom: 32, left: 60};
				//var width = window.innerWidth - margin.right - margin.left;
				//var height = (width + margin.right + margin.left) * 3 / 4 - margin.top - margin.bottom;

				//Draw canvas
				var svg = d3.select("svg#container");

				var width = Number(svg.style("width").match(/^[\d]+/)) - margin.right - margin.left;
				var height = Number(svg.style("height").match(/^[\d]+/)) - margin.top - margin.bottom;

				//Convert drawing codes into numbers
				data.forEach(function(d) {
					d.title_num = +d.title_num;
				});

				//Create nested maps
				var nest_tag = d3.nest()
					.key(function(d) {
						return d.tag;
					});

				var map_degree = d3.nest()
					.key(function(d) {
						return d.tag;
					})
					.rollup(function(leaves) {
						return leaves[0].tag_count;
					})
					.map(data, d3.map);

				//Define scale
				var r_min = 5;
				var r_max = 30;
				var t_min = r_min;
				var t_max = r_max;

				var array_degree = [];
				map_degree.forEach(function(key, value) {
					array_degree.push(value);
				});

				var rScale = d3.scale.sqrt()
					.domain(d3.extent(array_degree))
					.range([r_min, r_max]);

				var tScale = d3.scale.sqrt()
					.domain(d3.extent(array_degree))
					.range([t_min, t_max]);

				//Make nodes data for drawings
				var half_of_number = Math.round(d3.max(data, function(d) { return d.title_num; }) / 2);
				var cy_drawing = margin.top + 30;
				var h_int = Math.round(width / (half_of_number - 1));

				var nodes_drawing = d3.nest()
					.key(function(d) {
						return d.title_num;
					})
					.rollup(function(leaves) {
						var leaf = leaves[0];
						var cx, cy;

						leaf.title_num > half_of_number ? (
							cx = margin.left + (leaf.title_num - 1 - half_of_number) * h_int, cy = height + margin.bottom - cy_drawing
							) : (
							cx = margin.left + (leaf.title_num - 1) * h_int, cy = cy_drawing
							);
						
						return {
							"cx": cx,
							"cy": cy,
							"title": leaf.title,
							"title_num": leaf.title_num,
							"selector": ".title_num_" + leaf.title_num // for tooltip selection
						};
					})
					.entries(data);

				// var temporary = d3.nest()
				// 	.key(function(d) {
				// 		return d.title_num;
				// 	})
				// 	.entries(data);
				// console.log(temporary);

				//make nodes data for tags
				var area_margin = margin.top;
				var tags_width = width;
				var tags = {
					"x0": margin.left,
					"x1": margin.left + Math.round(tags_width / 2),
					"x2": margin.left + tags_width,
					"y0": cy_drawing + area_margin,
					"y1": height + margin.bottom - cy_drawing - area_margin
				};

				var nodes_tag = nest_tag.rollup(function(leaves) {
						var leaf = leaves[0];
						var cx, cy, r;
						var colour_circle, colour_text;
						var circle_explain = "#AA3356";
						var circle_analysis = "#000088";
						var text_explain = "#D86150";
						var text_analysis = "#234567";

						cy = tags.y0 + (tags.y1 - tags.y0) * Math.random();

						switch(leaf.tag_type) {
							case "기술":
								cx = tags.x0 + (tags.x1 - tags.x0) * Math.random();
								colour_circle = circle_explain;
								colour_text = text_explain;
								break;
							case "분석 및 해석":
								cx = tags.x1 + (tags.x2 - tags.x1) * Math.random();
								colour_circle = circle_analysis;
								colour_text = text_analysis;
								break;
							default:
								cx = tags.x0 + (tags.x3 - tags.x0) * Math.random();
						}

						r = rScale(leaf.tag_count);

						return {
							"cx": cx,
							"cy": cy,
							"tag": leaf.tag,
							"tag_num": leaf.tag_num,
							"tag_type": leaf.tag_type,
							"tag_count": leaf.tag_count,
							"colour_circle": colour_circle,
							"colour_text": colour_text
						}
					})
					.entries(data);

				//Append drawing and tag groups
				var drawing_g = svg.selectAll(".drawing")
					.data(nodes_drawing)
					.enter()
					.append("g")
					.attr("class", function(d) {
						return "drawing title_num_" + d.values.title_num;
					});

				var tag_g = svg.selectAll(".tag")
					.data(nodes_tag)
					.enter()
					.append("g")
					.attr("class", function(d) {
						return "tag tag_num_" + d.values.tag_num;
					});

				var hiding_class = {"show": false};
				var showing_class = {"show": true};

				//Append nodes for drawings
				var r_basic = 5;

				drawing_g.append("circle")
					.attr("cx", function(d){
						return d.values.cx;
					})
					.attr("cy", function(d) {
						return d.values.cy;
					})
					.attr("r", r_basic);
				
				drawing_g.append("text")
					.attr("x", function(d) { return d.values.cx; })
					.attr("y", function(d) { return d.values.cy; })
					.text(function(d) { return d.values.title; })
					//.attr("font-size", "12px")
					.attr("transform", function(d) { 
						let degree = d.values.title_num > half_of_number ? 45 : -45;
						return "rotate(" + degree + " " + d.values.cx + " " + d.values.cy + ")";
					})
					.attr("dx", 8)
					.attr("dy", function(d) { return d.values.title_num > half_of_number ? 8 : -4; });

				//Implemnet tooltip
				var tooltip_drawing = d3.select("div.tooltip-area")
					.style("top", -margin.bottom - 40 + "px")
					.selectAll(".tooltip")
					.data(nodes_drawing)
					.enter()
					.append("div")
					.attr("class", function(d) {
						return "tooltip title_num_" + d.values.title_num;
					})
					/*.style("left", function(d) {
						return d.values.cx + "px";
					})
					.style("top", function(d) {
						return d.values.cy + "px";
					})
					.style("top", cy_drawing + 100 + "px")*/;

				var trickOffset = 450;
				tooltip_drawing.append("iframe")
					.attr("width", "200%")
					.attr("height", trickOffset * 3.35 + "px")
					.attr("scrolling", "yes")
					.style("top", -trickOffset * 1.25 + "px")
					.attr("frameborder", "0");

				/*tooltip_drawing.append("p")
					.text(function(d) {
						return d.values.title;
					});*/
				/*tooltip_drawing.append("img")
					.attr("src", "http://gmoma.ggcf.kr/wp-content/plugins/CL230KO-artwork/watermark.php?w=3&m=PREjcuIz%2BvyXDCSwnhpZsZnwCQjUF%2FI0p4yTDDuh4m8qelRBTUML5ZoD9QqcLY3IoFPVbD92GqwJM51CBKAtkA%3D%3D");*/

				//Mouse events of drawing_g
				drawing_g.on("mouseover", function(d) {
						var activeDiv = d3.select("div" + d.values.selector)
							.classed(showing_class);

						if(activeDiv.select("iframe").attr("src") === null) {
							activeDiv.select("iframe")
								.attr("src", function(d) {
									return urlData.filter(function(element) {
										return element.title_num == d.values.title_num;
									})[0].url;
								});
						}

						d3.select(this)
							.classed(showing_class);
					})
					.on("mouseout", function(d) {
						d3.select("div" + d.values.selector)
							.classed(hiding_class);

						d3.select(this)
							.classed(hiding_class);
					});

				//Append nodes for tags
				/*tag_g.append("circle")
					.attr("cx", function(d) {
						return d.values.cx;
					})
					.attr("cy", function(d) {
						return d.values.cy;
					})
					.attr("r", function(d) {
						return rScale(d.values.tag_count);
					})
					.attr("fill", function(d) {
						return d.values.colour_circle;
					});*/

				tag_g.append("text")
					.text(function(d) {
						return d.values.tag;
					})
					.attr("x", function(d) {
						return d.values.cx;
					})
					.attr("y", function(d) {
						return d.values.cy;
					})
					/*.attr("dy", function(d) {
						var selector = "g.tag_num_" + d.values.tag_num + " circle";
						return document.querySelector(selector).getAttribute("r") / 2;
					})*/
					.attr("text-anchor", "middle")
					.attr("font-size", function(d) {
						return tScale(d.values.tag_count);
					})
					.attr("dy", function(d) {
						return tScale(d.values.tag_count) / 2;
					})
					.attr("fill", function(d) {
						return d.values.colour_text;
					});

				//Mouse events of tag_g
				tag_g.on("mouseover", function(d) {
						d3.select(this)
							.classed(showing_class);
					})
					.on("mouseout", function(d) {
						d3.select(this)
							.classed(hiding_class);
					})
					.on("click", function(d) {
						this.classList.toggle("fix");
					});

				//Make link data
				var nodes_link = [];

				data.forEach(function(element, index) {
					var selector_drawing = ".title_num_" + element.title_num + " circle";
					var selector_tag = ".tag_num_" + element.tag_num + " text";

					var circle_drawing = document.querySelector(selector_drawing);
					var text_tag = document.querySelector(selector_tag);

					var x1 = circle_drawing.getAttribute("cx");
					var y1 = circle_drawing.getAttribute("cy");
					var x2 = text_tag.getAttribute("x");
					var y2 = text_tag.getAttribute("y");

					nodes_link.push({
						"x1": x1,
						"y1": y1,
						"x2": x2,
						"y2": y2,
						"selector_drawing": selector_drawing,
						"selector_tag": selector_tag,
						"title_num": element.title_num,
						"tag_num": element.tag_num
					});
				});

				//Append links
				var links = svg.selectAll(".link")
					.data(nodes_link)
					.enter()
					.append("line")
					.attr("class", "link")
					.attr("x1", function(d) {
						return d.x1;
					})
					.attr("y1", function(d) {
						return d.y1;
					})
					.attr("x2", function(d) {
						return d.x2;
					})
					.attr("y2", function(d) {
						return d.y2;
					})
					.attr("stroke", "#B5B5B4");

				// click callback of drawing_g
				drawing_g.on("click", function(d_drawing) {
					let arrayForLock = [];
					
					if (this.classList.contains("fix")) {
						d_clicked = 0;
					}

					

					this.classList.toggle("fix");

					d3.selectAll(".activated")
						.classed("activated", false);
					d3.selectAll("g.drawing.fix")
						.classed("fix", false);
					d3.selectAll("div.tooltip-area .tooltip")
						.classed("fix", false);
					arrayForLock.forEach(function(element) {});

					if (!this.classList.contains("clicked")) {
						let thisNode = this;
						let activeLinks = links.filter(function(d_link) {
							return thisNode.classList.contains("title_num_" + d_link.title_num);
						});
						
						let activeTagNums = [];
						
						activeLinks.each(function(d_link) {
							activeTagNums.push(d_link.tag_num);
							this.classList.add("activated");
						});
						this.classList.add("activated");
						this.classList.add("fix");

						activeTagNums.forEach(function(element) {
							document.querySelector("svg g.tag_num_" + element).classList.add("activated");
						});

						d_clicked = 1;
						document.querySelector("div" + d_drawing.values.selector).classList.add("fix");
						
					} else {
						document.querySelector("div" + d_drawing.values.selector).classList.remove("fix");
						
						d_clicked = 0;
					}
					//toggle clicked
					this.classList.toggle("clicked");
					
				});

				// click callback of tag_g
				tag_g.on("click", function(d_tag) {
					this.classList.toggle("fix");

					if (t_clicked === 0) {
						let thisNode = this;
						let activeLinks = links.filter(function(d_link) {
							return thisNode.classList.contains("tag_num_" + d_link.tag_num);
						});
						
						let activeTitleNums = [];
						
						activeLinks.each(function(d_link) {
							activeTitleNums.push(d_link.title_num);
							this.classList.add("activated");
						});

						activeTitleNums.forEach(function(element) {
							document.querySelector("svg g.title_num_" + element).classList.add("activated");
						});

						t_clicked = 1;
					} else if (t_clicked === 1) {
						d3.selectAll(".activated")
							.classed("activated", false);
						
						t_clicked = 0;
					}
				});

				/*d3.csv("./data/drawing-tag-fetch.csv", function(urlData) {
					tooltip_drawing.append("iframe")
						.attr("src", function(d) {
							return urlData.filter(function(element) {
								return element.title_num == d.values.title_num;
							})[0].url;
						});
				});*/
			});

			
