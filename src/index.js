var filesaver = require("filesaver.js-npm");
var _ = require("underscore");
var uuidv3 = require('uuid/v3');
var dotScap = {};

(function(context) { 
	//A lot of dotgraph settings lingering here in case they find a use later.
	var config = {checkpoint: true,
								checkpointTag: "checkpoint",
								cluster: false,
								color: "bw",
								countWords: true,
								display: true,
								ends: true,
								endTag: "End",
								lastTag: false,
								omitSpecialPassages: true,
								omitTags: [],
								showNodeNames: true,
								trace: "",
								palette: ["#FEAF16", "#2ED9FF", "#DEA0FD", "#FE00FA", "#F7E1A0",
													"#16FF32", "#3283FE", "#1C8356", "#FBE426", "#FA0087",
													"#F8A19F", "#1CBE4F", "#C4451C", "#C075A6", "#90AD1C", 
													"#B00068", "#AA0DFE", "#FC1CBF", "#1CFFCE", "#F6222E", 
													"#85660D", "#325A9B", "#B10DA1", "#A0A0A0", "#782AB6",
													"#565656"],
								paletteExceptions: {
									start: "#C8C8C8",
									ends: "#C8C8C8",
									unreachable: "#FF6666",
									untagged: "#FFFFFF",
									default: "#FFFFFF"
								}
							 };

	var specialPassageList = ["StoryTitle", "StoryIncludes",
														"StoryAuthor", "StorySubtitle", "StoryMenu", "StorySettings",
														"StoryColophon",
														"StoryBanner", "StoryCaption", "StoryInit", "StoryShare", 
														"PassageDone", "PassageFooter", "PassageHeader", "PassageReady",
														"MenuOptions", "MenuShare"];

	var storyObj = {title: "Untitled", 
									startNode: 1, 
									startNodeName: "Start", 
									leaves: 0,
									links: 0,
									tightEnds: 0,
									avLength: 1,
									maxLength: 1,
									passages: [],
									reachable: [],
									tags: [],
									tagObject: [],
									targets: {},
									twineVersion: 0
								 };

//graph
//init
//passage
//settings
//story
 
context.graph = (function() {

	return {
		convert: convert,
		saveScap: saveScap
	};

	function convert() {
		//Get the xml in one step using storyObj.
		//A better idea would have been to simplify tw-storydata's html to something amenable to xslt,
		//but the dotgraph code was quicker to adapt.
		var output = dot();
		
		//Convert to full Scapple xml format and return the result.
		return output;
	}

	function saveScap() {
		//Having trouble reading the existing svg off the page, so regenerate it.
		var output = convert();
		var preblob = output;
		var blob = new Blob([preblob], {type: "application/xml;charset=utf-8"});
		filesaver.saveAs(blob, "dotscap" + Date.now() + ".scap", true);
 	}

	//Private
	function convertHexColor(hexString) {
		//Reformat existing colors to Scapple's format (RGB percentages)
		//Assumes a #.
		hexString = hexString.split("#")[1];
		var R, G, B;
		R = convertHexFragment(hexString.substring(0,2));
		G = convertHexFragment(hexString.substring(2,4));
		B = convertHexFragment(hexString.substring(4,6));
		return R + " " + G + " " + B;
	}

	//Private
	function convertHexFragment(hexFragment) {
		return parseInt(hexFragment,16) / 255;
	}

	function dot() {
		//(Re)parse the story into the scapple xml format.
		var buffer = [];

		//A change in the settings is what normally triggers regraphing.
		context.settings.parse();
		context.story.parse();

		buffer.push("<?xml version='1.0' encoding='UTF-8' standalone='no'?>");
		buffer.push('<ScappleDocument ID="' + generateUUID() + '" Version="1.1">');
		
		buffer.push('<Notes>');

		//The main part of the graph is the passage graphing, including links.
		buffer = buffer.concat(passages());

		//Push closing material.
		buffer.push("</Notes>");
		buffer.push("<BackgroundShapes/>");
		buffer.push('<NoteStyles>\n\
      <Style AffectFontStyle="No" AffectAlignment="No" Name="Red Text" ID="1C10E977-4771-4213-A182-7C79298BC8D4" AffectTextColor="Yes" AffectNoteBody="No" AffectSticky="No" AffectSize="No" AffectFade="No">\n\
         <TextColor>1.0 0.0 0.0</TextColor>\n\
      </Style>\n\
      <Style AffectFontStyle="No" AffectAlignment="No" Name="Brown Bubble" ID="29849575-02E8-4B8E-9F81-25D227E055DF" AffectTextColor="No" AffectNoteBody="Yes" AffectSticky="No" AffectSize="No" AffectFade="No">\n\
         <BorderThickness>1</BorderThickness>\n\
         <BorderColor>0.269490 0.164034 0.186694</BorderColor>\n\
         <FillColor>0.934157 0.888319 0.785290</FillColor>\n\
      </Style>\n\
      <Style AffectFontStyle="No" AffectAlignment="No" Name="Green Bubble" ID="725C2580-333C-43FA-A038-099ED6E0F113" AffectTextColor="No" AffectNoteBody="Yes" AffectSticky="No" AffectSize="No" AffectFade="No">\n\
         <BorderThickness>1</BorderThickness>\n\
         <BorderColor>0.399100 0.583322 0.354864</BorderColor>\n\
         <FillColor>0.808835 0.872419 0.801343</FillColor>\n\
      </Style>\n\
      <Style AffectFontStyle="No" AffectAlignment="No" Name="Blue Bubble" ID="C4F75CFC-8C56-4F82-99AB-B348B56801BB" AffectTextColor="No" AffectNoteBody="Yes" AffectSticky="No" AffectSize="No" AffectFade="No">\n\
         <BorderThickness>1</BorderThickness>\n\
         <BorderColor>0.485893 0.568933 0.756207</BorderColor>\n\
         <FillColor>0.844068 0.869596 0.923064</FillColor>\n\
      </Style>\n\
      <Style AffectFontStyle="No" AffectAlignment="No" Name="Pink Bubble" ID="50D2426C-F754-4EBC-8D5B-9E83E229CAFC" AffectTextColor="No" AffectNoteBody="Yes" AffectSticky="No" AffectSize="No" AffectFade="No">\n\
         <BorderThickness>1</BorderThickness>\n\
         <BorderColor>0.690303 0.407263 0.550912</BorderColor>\n\
         <FillColor>0.898329 0.817472 0.865339</FillColor>\n\
      </Style>\n\
      <Style AffectFontStyle="No" AffectAlignment="No" Name="Yellow Bubble" ID="90442B24-E28F-41C9-91EA-CBB0A50D6450" AffectTextColor="No" AffectNoteBody="Yes" AffectSticky="No" AffectSize="No" AffectFade="No">\n\
         <BorderThickness>1</BorderThickness>\n\
         <BorderColor>0.769436 0.762219 0.390143</BorderColor>\n\
         <FillColor>0.912963 0.894118 0.644541</FillColor>\n\
      </Style>\n\
      <Style AffectFontStyle="Yes" AffectAlignment="Yes" Name="Title Text" ID="3F6B6120-67C6-4DC2-83E5-435D92327755" AffectTextColor="No" AffectNoteBody="No" AffectSticky="No" AffectSize="No" AffectFade="No">\n\
         <IsBold>Yes</IsBold>\n\
         <FontSize>12.0</FontSize>\n\
      </Style>\n\
   </NoteStyles>\n\
   <UISettings>\n\
      <BackgroundColor>1.0 0.988006 0.945006</BackgroundColor>\n\
      <DefaultFont>Helvetica</DefaultFont>\n\
      <DefaultTextColor>0.0 0.0 0.0</DefaultTextColor>\n\
      <LeftToRight>Yes</LeftToRight>\n\
   </UISettings>\n\
   <PrintSettings VerticalPagination="Auto" HorizontalPagination="Clip" Orientation="Portrait" RightMargin="12.000000" BottomMargin="12.000000" HorizontallyCentered="Yes" ScaleFactor="1.000000" PagesAcross="1" PaperType="na-letter" PagesDown="1" TopMargin="12.000000" Collates="Yes" PaperSize="-1.000000,-1.000000" LeftMargin="12.000000" VerticallyCentered="Yes"/>');
		buffer.push("</ScappleDocument>");

		return buffer.join("\n");
	}

	function generateUUID() {
		//Using the URL version:
		return uuidv3('http://mcdemarco.net/tools/scree/dotscap', uuidv3.URL);
		//return "659F6C04-7CA6-4052-8D89-7C9D490818B1";
	}

	function getAppearanceString(color, weight) {
		if (!color) color = "0.934157 0.888319 0.78529";
		if (!weight) weight = 1;

		return '<Appearance>\n\
			<Alignment>Center</Alignment>\n\
			<Border Weight="' + weight + '" Style="Rounded">0.0 0.0 0.0</Border>\n\
			<Fill>' + color + '</Fill>\n\
		</Appearance>';
	}

	function getPidFromTarget(target) {
		if (storyObj.targets.hasOwnProperty(target))
			return storyObj.targets[target];
		else
			return scrub(target);
	}	

	function getNameOrPid(passage, reversed, withCount) {
		//Used to get the node label in the style requested by the settings, 
		//except in tooltips, where we give the alternate label and a word count.
		var name;
		var returnAsName = (reversed ? !config.showNodeNames : config.showNodeNames);

		if (returnAsName) {
			name = passage.name;
		} else {
			name = passage.pid ? passage.pid : "Untitled Passage";
		}
		if (withCount && config.countWords)
			name += " (" + passage.wordCount + " word" + (passage.wordCount == 1 ? "" : "s") + ")";
		return scrub(name);
	}

	function getNameOrPidFromTarget(target) {
		//Sometimes used to get the real name (returnName), sometimes the pids.
		var name;
		if (config.showNodeNames) {
			name = scrub(target);
		} else {
			name = getPidFromTarget(target);
		}
		return name;
	}

	function passages() {
		//Graph passages.
		var subbuffer = [];

		for (i = 0; i < storyObj.passages.length; ++i) {
			if (!storyObj.passages[i].omit)
				subbuffer = subbuffer.concat(passage(storyObj.passages[i]));
		}

		return subbuffer;
	}

	function passage(passage,label) {
		//Graph a single parsed passage, including links.
		var result = [];

		if ((config.omitSpecialPassages && passage.special) || passage.omit)
			return result;

		var scrubbedNameOrPid = getNameOrPid(passage);
		var styles = stylePassage(passage, label);

		var links = _.uniq(passage.links.map(function(link) {return getPidFromTarget(link[0]);}));
		
		//Push the node.
		result.push('<Note Width="' + (scrubbedNameOrPid.length * 8 + 20) + '" FontSize="16" ID="' + passage.pid + '" Position="' + passage.position +'">');
    result.push(styles);
    result.push('<String>' + scrubbedNameOrPid + '</String>');
		//Push the link list.  This no longer needs a whole function.
    result.push('<ConnectedNoteIDs>' + links.join(", ") + '</ConnectedNoteIDs>');
    result.push('<PointsToNoteIDs>' + links.join(", ") + '</PointsToNoteIDs>');
    result.push('</Note>');

		return result;
	}

	function stylePassage(passage, label) {
		var weight = 1;
		var color;

		var hue = 0;
		var pid = passage.pid;
		var content = passage.content;
		var tag = passage.theTag;

		//Start with any special shape for the passage.
		if (passage.trace) {
			weight++;
		}

		if (pid == storyObj.startNode || _.find(storyObj.unreachable, function(str){return str == passage.name;})) {
			weight++;
		}

		if (config.ends && context.passage.hasTag(passage, config.endTag)) {
			weight++;
		}

		if (config.checkpoints && context.passage.hasTag(passage, config.checkpointTag)) {
			//really needs a shape (was diamond)
		}

		//Omitting fill and bold styles, but weigh one case.
		if (weight == 1 && passage.links.length === 0  && config.ends) {
			//We are at a terminal passage that isn't already styled as the start or an end.
			weight++;
		}

		//Calculate color.
		if (passage.trace) {
			color = "0.5 0.5 1";
		}	else if (config.color == "bw") {
			color = "1 1 1";
		} else if (config.color == "length") {
			hue = Math.round(100 * (Math.min(1.75, passage.textLength / storyObj.avLength)) / 3)/100;
			hue = Math.min(hue,1);
			color = (1 - hue) + " " + hue + " 0.1";
		} else if (config.color == "tag" && tag) {
			var indx = storyObj.tags.indexOf(tag);
			if (indx > -1)
				hue = config.palette[indx%26]; //color alphabet colors
			color = convertHexColor(hue);
		} else if (pid == storyObj.startNode) {
			color = convertHexColor(config.paletteExceptions.start);
		} else if (config.ends && context.passage.hasTag(passage, config.endTag)) {
			color = convertHexColor(config.paletteExceptions.ends);
		} else if (_.find(storyObj.unreachable, function(str){return str == passage.name;})) {
			color = convertHexColor(config.paletteExceptions.unreachable);
 		} else if (config.color == "tag") {
			color = convertHexColor(config.paletteExceptions.untagged);
 		} else {
			color = convertHexColor(config.paletteExceptions.default);
		}

		return getAppearanceString(color,weight);
	}

	function scrub(name) {
		//Put names into a legal dot format.
		if (name) {
			// scrub for xml insertion
			name = _.escape(name);
		}
		return name;
	}

	function writeClusters(tagObject) {
		var clusters = [];
		var clusterIndex = 0;
		for (var tag in tagObject) {
			if (tagObject.hasOwnProperty(tag) && !context.settings.isOmittedTag(tag)) {
				clusters.push("subgraph cluster_" + clusterIndex + " {");
				clusters.push("label=" + scrub(tag));
				clusters.push("style=\"rounded, filled\" fillcolor=\"ivory\"");
				clusters.push(tagObject[tag].map(getNameOrPidFromTarget).join(" \r\n"));
				clusters.push("}\r\n");
				clusterIndex++;
			}
		}
		return clusters;
	}
	
	function writeTagKey(story,settings) {
		var tagKey = ["{rank=source\r\nstyle=\"rounded, filled\""];
		var tagName;
		for (var t=0; t<story.tags.length; t++) {
			if (!context.settings.isOmittedTag(storyObj.tags[t])) {
				tagName = scrub(storyObj.tags[t]);
				tagKey.push(tagName + " [shape=rect style=\"filled,rounded\" fillcolor=\"" + settings.palette[t%26] + "\"]");
			}
		}
		tagKey.push("}");
		
		var startName = (settings.showNodeNames ? scrub(story.startNodeName) : story.startNode);

		//Dot hackery: invisible graphing to keep things lined up.
		for (t=0; t<story.tags.length; t++) {
			if (!context.settings.isOmittedTag(story.tags[t]))
				tagKey.push(scrub(story.tags[t]) + " -> " + startName + " [style=invis]");
		}
		return tagKey;
	}
	
})();

context.init = (function() {

	return {
		load: load
	};

	function load() {
		//Onload function.
		context.settings.load();
		context.settings.write();
		activateForm();
		context.graph.saveScap();
	}

	//Private.
	function activateForm() {
		document.getElementById("settingsForm").addEventListener('click', context.graph.convert, false);
		document.getElementById("omitTags").addEventListener('change', context.graph.convert, false);
		document.getElementById("trace").addEventListener('change', context.graph.convert, false);

		document.getElementById("saveScapButton").addEventListener('click', context.graph.saveScap, false);
	}

})();

context.passage = (function() {

	return {
		hasTag: hasTag,
		parse: parse
	};

	function hasTag(passage, tag) {
		if (passage.tagArray.indexOf(tag) > -1)
			return true;
		else
			return false;
	}

	function parse(source, index) {
		//Parse passage from twine1 or 2 source.
		var passageObj = {};
		var tagArray = (source.getAttribute("tags") ? source.getAttribute("tags").trim().split(" ") : []);
		var links = parseLinks(source.innerText);

		passageObj.links = links;
		passageObj.leaf = (links.length === 0);
		passageObj.textLength = source.innerText.length;
		passageObj.wordCount = source.innerText.trim() ? source.innerText.trim().split(/\s+/).length: 0;
		//Make it like Twine2.
		passageObj.pid = source.getAttribute("pid") ? source.getAttribute("pid") : index;
		passageObj.tagArray = tagArray;
		passageObj.theTag = getTheTag(tagArray);
		passageObj.name = source.getAttribute("name") ? source.getAttribute("name") : (source.getAttribute("tiddler") ? source.getAttribute("tiddler") : "Untitled Passage");
		passageObj.special = (specialPassageList.indexOf(passageObj.name) > -1);
		passageObj.omit = hasOmittedTag(passageObj);
		passageObj.trace = (config.trace && source.innerText.indexOf(config.trace) > -1);
		passageObj.position = source.getAttribute("position") ? source.getAttribute("position") : source.getAttribute("twine-position");

		return passageObj;
	}

	//Private	
	function getTheTag(tags) {
		var tagArray = tags.slice(0);
		if (config.ends && tagArray.indexOf(config.endTag) > -1) {
			tagArray.splice(tagArray.indexOf(config.endTag), 1);
		}
		if (config.checkpoints && tagArray.indexOf(config.checkpointTag) > -1)
			tagArray.splice(tagArray.indexOf(config.checkpointTag), 1);
		if (tagArray.length && config.lastTag) 
			return tagArray[tagArray.length - 1];
		else if (tagArray.length)
			return tagArray[0];
		else
			return "";
	}

	function hasOmittedTag(passage) {
		if (config.omitTags.length == 0) 
			return false;
		else {
			for (var t=0; t<config.omitTags.length; t++) {
				if (hasTag(passage,config.omitTags[t]))
					return true;
			}
			return false;
		}
	}

	function parseLink(target, type) {
		//Parsing code for the various formats, adapted from Snowman.
		
		// display|target format
		
		var barIndex = target.indexOf('|');
		
		if (barIndex != -1) {
			target = target.substr(barIndex + 1);
		} else {
			// display->target format
			
			var rightArrIndex = target.indexOf('->');
			
			if (rightArrIndex != -1) {
				target = target.substr(rightArrIndex + 2);
			} else {
				// target<-display format
				var leftArrIndex = target.indexOf('<-');
				
				if (leftArrIndex != -1) {
					target = target.substr(0, leftArrIndex);
				}
			}
		}
		return [target,type];
	}

	function parseLinks(content) {
		var linkList = [];
		var re = /\[\[(.*?)\]\]/g;
		var re2 = /\<\<display \"(.*?)\"\>\>/g;
		var re3 = /\(display: \"(.*?)\"\)/g;
		var targetArray, target, target2;
		if (content) {
			//Clean up the content a bit (snowman), then extract links.
			// Remove /* comments */
			content = content.replace(/\/\*.*\*\//g, '');
			// Remove (starting) // comments
			content = content.replace(/^\/\/.*(\r\n?|\n)/g, '');
			
			while ((targetArray = re.exec(content)) !== null) {
				target = parseLink(targetArray[1],0);
				if (/^\w+:\/\/\/?\w/i.test(target)) {
					// do nothing with external links
				}	else {
					linkList.push(target);
				}
			}
			if (config.display) {
				while ((targetArray = re2.exec(content)) !== null) {
					target2 = parseLink(targetArray[1],1);
					if (/^\w+:\/\/\/?\w/i.test(target2)) {
						// do nothing with external links
					}	else {
						linkList.push(target2);
					}
				}
				while ((targetArray = re3.exec(content)) !== null) {
					target2 = parseLink(targetArray[1],1);
					if (/^\w+:\/\/\/?\w/i.test(target2)) {
						// do nothing with external links
					}	else {
						linkList.push(target2);
					}
				}
			}
		}
		return linkList;
	}

})();

context.settings = (function () {

	return {
		isOmittedTag: isOmittedTag,
		load: load,
		parse: parse,
		write: write
	};

	function isOmittedTag(tag) {
		if (config.omitTags.length == 0) 
			return false;
		else {
			for (var t=0; t<config.omitTags.length; t++) {
				if (config.omitTags[t] == tag)
					return true;
			}
			return false;
		}
	}

	function load() {
		//Parse the StorySettings for dotgraph presets.
		var StorySettings;
		if (window.document.getElementById("storeArea"))
			StorySettings = window.document.getElementById("storeArea").querySelector('div[tiddler="StorySettings"]');
		else 
			StorySettings = window.document.querySelector('tw-passagedata[name="StorySettings"]');

		if (!StorySettings || !StorySettings.innerText || !StorySettings.innerText.split("dotgraph:").length > 0)
			return;

		var dgSettings = (StorySettings.innerText.split("dotgraph:")[1]).split("\n")[0];
		try {
			dgSettings = JSON.parse(dgSettings);
		} catch(e) {
			console.log("Found but couldn't parse dotscap settings: " + dgSettings);
			return;
		}
		_.each(dgSettings, function(value, key) {
			config[key] = value;
		});
	}

	function parse() {
		//Check for config changes.
		config.checkpoints = document.getElementById("checkpointsCheckbox") ? document.getElementById("checkpointsCheckbox").checked : false;
		config.cluster = document.getElementById("clusterCheckbox") ? document.getElementById("clusterCheckbox").checked : false;
//rewriting to bw/length/tag
		config.color = document.querySelector("input[name='colorCheckbox']:checked") ? document.querySelector("input[name='colorCheckbox']:checked").value : "length";
		config.display = document.getElementById("displayCheckbox") ? document.getElementById("displayCheckbox").checked : true;
		config.ends = document.getElementById("endsCheckbox") ? document.getElementById("endsCheckbox").checked : false;
		config.omitSpecialPassages = document.getElementById("specialCheckbox") ? document.getElementById("specialCheckbox").checked : false;
		config.showNodeNames = document.getElementById("nodeCheckbox0") ? document.getElementById("nodeCheckbox0").checked : false;
		config.omitTags = document.getElementById("omitTags") ? splitAndTrim(document.getElementById("omitTags").value) : [];
		config.lastTag = document.getElementById("lastTagCheckbox") ? document.getElementById("lastTagCheckbox").checked : false;
		config.countWords = document.getElementById("wcCheckbox") ? document.getElementById("wcCheckbox").checked : false;
		config.trace = document.getElementById("trace") ? trim(document.getElementById("trace").value) : "";
	}
			
	function write() {
		//Write the current config object as a settings panel.
		var output = _.template('<input type="radio" id="nodeCheckbox0" name="nodeCheckbox" value="names" <%= (showNodeNames ? "checked" : "") %>/><label for="nodeCheckbox">&nbsp;Passage titles</label> \
			<input type="radio" id="nodeCheckbox1" name="nodeCheckbox" value="pid"  <%= (showNodeNames ? "" : "checked") %> /><label for="nodeCheckbox">&nbsp;Passage ids</label><br/> \
			<input type="radio" id="colorCheckbox0" name="colorCheckbox" value="bw" <%= (color == "bw" ? "checked" : "")%> />&nbsp;<label for="colorCheckbox0">Black & white</label> \
			<input type="radio" id="colorCheckbox1" name="colorCheckbox" value="length" <%= (color == "length" ? "checked" : "")%> />&nbsp;<label for="colorCheckbox1">Color by node length</label> \
			<input type="radio" id="colorCheckbox2" name="colorCheckbox" value="tag" <%= (color == "tag" ? "checked" : "")%>/>&nbsp;<label for="colorCheckbox2">Color by tag</label><br/> \
			<input type="checkbox" id="displayCheckbox" name="displayCheckbox" checked/>&nbsp;<label for="displayCheckbox">Include display macro links</label> \
			<!-- <input type="checkbox" id="wcCheckbox" name="wcCheckbox" <%= (countWords ? "checked" : "") %> />&nbsp;<label for="wcCheckbox">Include word counts</label> --><br/> \
			<input type="checkbox" id="specialCheckbox" <%= (omitSpecialPassages ? "checked" : "") %> />&nbsp;<label for="specialCheckbox">Omit&nbsp;special&nbsp;passages</label> (StoryAuthor,&nbsp;StorySubtitle,&nbsp;etc.)<br/> \
			<input type="radio" id="omitTagsFakeRadioButton" disabled/>&nbsp;<label for="omitTags">Omit by tag(s):</label>&nbsp;<input type="input" id="omitTags" placeholder="Separate tags with commas." value="<%=omitTags.join(" ")%>"/><br/> \
			<input type="checkbox" id="checkpointsCheckbox" <%= (checkpoint ? "checked" : "") %> />&nbsp;<label for="checkpointsCheckbox">Detect checkpoint tags</label> \
			<input type="checkbox" id="endsCheckbox" <%= (ends == true ? "checked" : "") %>/>&nbsp;<label for="endsCheckbox">Detect end tags</label> \
			<input type="checkbox" id="lastTagCheckbox" <%= (lastTag ? "checked" : "") %> />&nbsp;<label for="lastTagCheckbox">Use last tag</label><br/> \
			<!-- <input type="checkbox" id="clusterCheckbox" <%= (cluster ? "checked" : "") %> />&nbsp;<label for="clusterCheckbox">Cluster by tags</label> --> \
			<input type="radio" id="traceFakeRadioButton" disabled/>&nbsp;<label for="trace">Trace phrase:</label>&nbsp;<input type="input" id="trace" value="<%=trace%>" /><br/> \
			<br/>');
		document.getElementById("settingsForm").innerHTML = output(config);
	}

	function splitAndTrim(tagList) {
		var tagArray = tagList.trim().split(",");
		var tagArrayTrimmed = [];
		for (var i = 0; i<tagArray.length; i++) {
			var tagTrimmed = tagArray[i].trim(); 
			if (tagTrimmed != "")
				tagArrayTrimmed.push(tagTrimmed);
		}

		document.getElementById("omitTagsFakeRadioButton").checked = (tagArrayTrimmed.length > 0);		
		return tagArrayTrimmed;
	}

	function trim(tracePhrase) {
		tracePhrase = tracePhrase.trim();

		document.getElementById("traceFakeRadioButton").checked = (tracePhrase.length > 0);		
		return tracePhrase;
	}

})();

context.story = (function () {

	return {
		parse: parse
	};

	function parse() {
		//Parse the story from the relevant Twine 1 or Twine 2 source data.
		//Avoid division by zero in corner case by pretending we have non-empty passages.
		//Note that we haven't cleaned out comments yet, and never clean script,
		//so the passage lengths may be inaccurate.
		var p;
		var source;
		
		//Detecting twine version here.
		var storyTwine1 = window.document.getElementById("storeArea");
		var storyTwine2 = window.document.getElementsByTagName("tw-storydata")[0];

		if (storyTwine1) {
			storyObj.twineVersion = 1;
			var title = "Untitled Story";
			if (storyTwine1.querySelectorAll('[tiddler="StoryTitle"]').length) {
				title = storyTwine1.querySelectorAll('[tiddler="StoryTitle"]')[0].innerText;
			}
			storyObj.title = title;
		} else if (storyTwine2) {
			storyObj.twineVersion = 2;
			storyObj.title = storyTwine2.getAttribute("name") ? storyTwine2.getAttribute("name") : "Untitled";
			storyObj.startNode = storyTwine2.getAttribute("startnode") ? storyTwine2.getAttribute("startnode") : 1;
		} else {
			//Not clear this can occur.
			storyObj.title = 1;
			storyObj.startNode = 1;
		}

		if (storyTwine1)
			source = storyTwine1.querySelectorAll("div[tiddler]");
		else 
			source = document.querySelectorAll("tw-passagedata");

		storyObj.passages = parsePassages(source);
		storyObj.leaves = 0;
		storyObj.links = 0;
		storyObj.tightEnds = 0;

		storyObj.tagObject = {};
		storyObj.tags = [];
		storyObj.targets = {};
		storyObj.reachable = storyObj.reachable.concat(specialPassageList);

		for (p = 0; p < storyObj.passages.length; p++) {

			var stopo = storyObj.passages[p];

			if (storyTwine1 && stopo.name == "Start") {
				//Couldn't do this until source was cleaned.
				storyObj.startNode = p;
			}

			if (config.ends) {
				if (context.passage.hasTag(stopo,config.endTag))
					storyObj.tightEnds++;
			}
			
			if (stopo.pid == storyObj.startNode) {
				storyObj.startNodeName = stopo.name;
				storyObj.reachable.push(stopo.name);
			}
			
			if (stopo.theTag) {
				if (!storyObj.tagObject.hasOwnProperty(stopo.theTag)) {
					storyObj.tagObject[stopo.theTag] = [];
					storyObj.tags.push(stopo.theTag);
				}
				storyObj.tagObject[stopo.theTag].push(stopo.name);
			}

			//Create targets key for lookups.
			storyObj.targets[stopo.name] = stopo.pid;

			storyObj.links += stopo.links.length;
			storyObj.reachable = storyObj.reachable.concat(_.map(stopo.links,_.first));
			if (stopo.leaf && !stopo.omit && !(stopo.special && config.omitSpecialPassages))
				storyObj.leaves++;

		};

		storyObj.reachable = _.uniq(storyObj.reachable); 
		storyObj.unreachable = _.difference(_.pluck(storyObj.passages,"name"),storyObj.reachable);
		storyObj.maxLength = storyObj.passages.reduce(function(acc,pasg) { return Math.max(acc,pasg.textLength); }, 1);
		storyObj.avLength = storyObj.passages.reduce(function(acc,pasg) { return acc + pasg.textLength; }, 0) / storyObj.passages.length;

console.log(storyObj.avLength);

		writeStats();
	}

	//Private
	function parsePassages(source) {
		var passages = [];
		for (var p = 0; p < source.length; p++) {
			passages[p] = context.passage.parse(source[p],p);
		}
		return passages;
	}

	function writeStats() {
		document.getElementById("nodeCount").innerHTML = storyObj.passages.length;
		if (config.omitSpecialPassages || config.omitTags.length > 0) {
			var omittedCount = storyObj.passages.reduce(function(count, item) {
				return count + ((( item.special && config.omitSpecialPassages ) || item.omit ) ? 1 : 0);
			}, 0);
			document.getElementById("omitCount").innerHTML = " (" + (storyObj.passages.length - omittedCount) + " included, " + omittedCount + " omitted, " + storyObj.unreachable.length + " unreachable)";	
		} 

		document.getElementById("leafCount").innerHTML = storyObj.leaves;
		if (config.ends) {
			var looseEnds = storyObj.leaves - storyObj.tightEnds;
			document.getElementById("looseCount").innerHTML = " (including " + (looseEnds > 0 ? looseEnds : 0) + " loose end" + (looseEnds != 1 ? "s" : "") + ")";
		} else {
			document.getElementById("looseCount").innerHTML = "";
		}

		document.getElementById("linkCount").innerHTML = storyObj.links;
		document.getElementById("average").innerHTML = Math.round(100 * (storyObj.links / storyObj.passages.length))/100;

		document.getElementById("stats").setAttribute("title","Twine " + storyObj.twineVersion);
	}

})();
			
})(dotScap);

window.onload = dotScap.init.load();
