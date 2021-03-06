//META{"name":"RemoveNicknames"}*//

class RemoveNicknames {
	initConstructor () {
		this.patchModules = {
			"NameTag":"componentDidMount",
			"FluxContainer(TypingUsers)":"componentDidUpdate",
			"Popout":"componentDidMount",
			"Clickable":"componentDidMount",
			"StandardSidebarView":"componentWillUnmount"
		};
		
		this.defaults = {
			settings: {
				replaceOwn:		{value:false, 	description:"Replace your own name:"},
				addNickname:    {value:false, 	description:"Add nickname as parentheses:"},
				swapPositions:	{value:false, 	description:"Swap the position of username and nickname:"}
			}
		};
	}

	getName () {return "RemoveNicknames";}

	getDescription () {return "Replace all nicknames with the actual accountnames.";}

	getVersion () {return "1.1.2";}

	getAuthor () {return "DevilBro";}
	
	getSettingsPanel () {
		if (!this.started || typeof BDFDB !== "object") return;
		var settings = BDFDB.getAllData(this, "settings"); 
		var settingshtml = `<div class="${this.getName()}-settings DevilBro-settings"><div class="${BDFDB.disCNS.titledefault + BDFDB.disCNS.title + BDFDB.disCNS.size18 + BDFDB.disCNS.height24 + BDFDB.disCNS.weightnormal + BDFDB.disCN.marginbottom8}">${this.getName()}</div><div class="DevilBro-settings-inner">`;
		for (let key in settings) {
			settingshtml += `<div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCNS.justifystart + BDFDB.disCNS.aligncenter + BDFDB.disCNS.nowrap + BDFDB.disCN.marginbottom8}" style="flex: 1 1 auto;"><h3 class="${BDFDB.disCNS.titledefault + BDFDB.disCNS.title + BDFDB.disCNS.marginreset + BDFDB.disCNS.weightmedium + BDFDB.disCNS.size16 + BDFDB.disCNS.height24 + BDFDB.disCN.flexchild}" style="flex: 1 1 auto;">${this.defaults.settings[key].description}</h3><div class="${BDFDB.disCNS.flexchild + BDFDB.disCNS.switchenabled + BDFDB.disCNS.switch + BDFDB.disCNS.switchvalue + BDFDB.disCNS.switchsizedefault + BDFDB.disCNS.switchsize + BDFDB.disCN.switchthemedefault}" style="flex: 0 0 auto;"><input type="checkbox" value="${key}" class="${BDFDB.disCNS.switchinnerenabled + BDFDB.disCN.switchinner}"${settings[key] ? " checked" : ""}></div></div>`;
		}
		settingshtml += `</div></div>`;
		
		var settingspanel = $(settingshtml)[0];

		BDFDB.initElements(settingspanel);

		$(settingspanel)
			.on("click", BDFDB.dotCN.switchinner, () => {this.updateSettings(settingspanel);});
		return settingspanel;
	}

	//legacy
	load () {}

	start () {
		var libraryScript = null;
		if (typeof BDFDB !== "object" || typeof BDFDB.isLibraryOutdated !== "function" || BDFDB.isLibraryOutdated()) {
			libraryScript = document.querySelector('head script[src="https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.js"]');
			if (libraryScript) libraryScript.remove();
			libraryScript = document.createElement("script");
			libraryScript.setAttribute("type", "text/javascript");
			libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.js");
			document.head.appendChild(libraryScript);
		}
		this.startTimeout = setTimeout(() => {this.initialize();}, 30000);
		if (typeof BDFDB === "object" && typeof BDFDB.isLibraryOutdated === "function") this.initialize();
		else libraryScript.addEventListener("load", () => {this.initialize();});
	}

	initialize () {
		if (typeof BDFDB === "object") {
			BDFDB.loadMessage(this);
			
			this.reseting = false;
			
			this.UserStore = BDFDB.WebModules.findByProperties("getUsers", "getUser");
			this.LastGuildStore = BDFDB.WebModules.findByProperties("getLastSelectedGuildId");
			this.LastChannelStore = BDFDB.WebModules.findByProperties("getLastSelectedChannelId");
			this.MemberStore = BDFDB.WebModules.findByProperties("getNicknames", "getNick");
			
			BDFDB.WebModules.forceAllUpdates(this);
		}
		else {
			console.error(this.getName() + ": Fatal Error: Could not load BD functions!");
		}
	}


	stop () {
		if (typeof BDFDB === "object") {
			this.reseting = true;
			
			BDFDB.WebModules.forceAllUpdates(this);
			
			BDFDB.unloadMessage(this);
		}
	}

	
	// begin of own functions

	updateSettings (settingspanel) {
		var settings = {};
		for (var input of settingspanel.querySelectorAll(BDFDB.dotCN.switchinner)) {
			settings[input.value] = input.checked;
		}
		this.updateUsers = true;
		BDFDB.saveAllData(settings, this, "settings");
	}
	
	getNewName (info) {
		if (!info) return null;
		let EditUsersData = BDFDB.isPluginEnabled("EditUsers") ? BDFDB.loadData(info.id, "EditUsers", "users") : null;
		if (EditUsersData && EditUsersData.name) return EditUsersData.name;
		let settings = BDFDB.getAllData(this, "settings");
		let member = this.MemberStore.getMember(this.LastGuildStore.getGuildId(), info.id);
		if (!member || !member.nick || info.id == BDFDB.myData.id && !settings.replaceOwn) return info.username;
		if (this.reseting) return member.nick || info.username;
		return settings.addNickname ? (settings.swapPositions ? (member.nick + " (" + info.username + ")") : (info.username + " (" + member.nick + ")")) : info.username;
	}
	
	processNameTag (instance, wrapper) {
		let username = wrapper.parentElement.querySelector("." + (wrapper.classList && wrapper.classList.contains(BDFDB.disCN.userpopoutheadertagwithnickname) ? BDFDB.disCN.userpopoutheadernickname : instance.props.usernameClass).replace(/ /g, "."));
		if (username) BDFDB.setInnerText(username, this.getNewName(instance.props.user));
	}
	
	processPopout (instance, wrapper) {
		let fiber = instance._reactInternalFiber;
		if (fiber.return && fiber.return.memoizedProps && fiber.return.memoizedProps.message) {
			let username = wrapper.querySelector(BDFDB.dotCN.messageusername);
			if (username) BDFDB.setInnerText(username, this.getNewName(fiber.return.memoizedProps.message.author));
		}
	}
	
	processFluxContainerTypingUsers (instance) {
		let users = !instance.state.typingUsers ? [] : Object.keys(instance.state.typingUsers).filter(id => id != BDFDB.myData.id).filter(id => !this.RelationshipUtils.isBlocked(id)).map(id => this.UserUtils.getUser(id)).filter(id => id != null);
		document.querySelectorAll(BDFDB.dotCNS.typing + "strong").forEach((username, i) => {
			if (users[i]) if (username) BDFDB.setInnerText(username, this.getNewName(users[i]));
		});
	}
	
	processClickable (instance, wrapper) {
		if (!wrapper || !instance.props || !instance.props.className) return;
		if (instance.props.tag == "a" && instance.props.className.indexOf(BDFDB.disCN.anchorunderlineonhover) > -1) {
			if (wrapper.parentElement.classList.contains(BDFDB.disCN.messagesystemcontent)) {
				let message = BDFDB.getKeyInformation({node:wrapper.parentElement, key:"message", up:true});
				if (message) BDFDB.setInnerText(wrapper, this.getNewName(message.author));
			}
		}
		else if (instance.props.tag == "span" && instance.props.className.indexOf(BDFDB.disCN.mention) > -1) {
			let fiber = instance._reactInternalFiber;
			if (fiber.return && fiber.return.return && fiber.return.return.stateNode && fiber.return.return.stateNode.props && typeof fiber.return.return.stateNode.props.render == "function") {
				if (wrapper) BDFDB.setInnerText(wrapper, "@" + this.getNewName(fiber.return.return.stateNode.props.render().props.user));
			}
		}
		else if (instance.props.tag == "div" && instance.props.className.indexOf(BDFDB.disCN.voiceuser) > -1) {
			let fiber = instance._reactInternalFiber;
			if (fiber.return && fiber.return.memoizedProps && fiber.return.memoizedProps.user) {
				let username = wrapper.querySelector(BDFDB.dotCN.voicename);
				if (username) BDFDB.setInnerText(username, this.getNewName(fiber.return.memoizedProps.user));
			}
		}
		else if (instance.props.tag == "div" && instance.props.className.indexOf(BDFDB.disCN.autocompleterow) > -1) {
			let fiber = instance._reactInternalFiber;
			if (fiber.return && fiber.return.memoizedProps && fiber.return.memoizedProps.user) {
				let username = wrapper.querySelector(BDFDB.dotCN.marginleft8);
				if (username) BDFDB.setInnerText(username, this.getNewName(fiber.return.memoizedProps.user));
			}
		}
	}
	
	processStandardSidebarView (instance, wrapper) {
		if (this.updateUsers) {
			this.updateUsers = false;
			BDFDB.WebModules.forceAllUpdates(this);
		}
	}
}
