/* Constants */
const NAMESPACE = "tomate-timer";
const notificationIcon = "icon.png";
const notificationTitles = [];
notificationTitles["work"] = "Work";
notificationTitles["shortbreak"] = "Break";
notificationTitles["longbreak"] = "Long break";
notificationTitles["end"] = "End";
const notificationDescriptions = [];
notificationDescriptions["work"] = "Time for some focused time, you got this!";
notificationDescriptions["shortbreak"] = "Well done! You can take a short break now ;-)";
notificationDescriptions["longbreak"] = "Well done! You can take a longer break now ;-)";
notificationDescriptions["end"] = "Good job! Enough for today :-)";
const stateNames = [];
stateNames["work"] = "Work";
stateNames["shortbreak"] = "Break";
stateNames["longbreak"] = "Long Break";
stateNames["end"] = "End";
const defaultValues = [];
defaultValues["workMinutes"] = "25";
defaultValues["workSeconds"] = "00";
defaultValues["shortbreakMinutes"] = "05";
defaultValues["shortbreakSeconds"] = "00";
defaultValues["longbreakMinutes"] = "20";
defaultValues["longbreakSeconds"] = "00";
defaultValues["longbreakSession"] = "4";

function $(id) {
    return document.getElementById(id);
}

const Timer = {

    targetTime: null,
    secs: null,
    session: null,
    state: null,
    timerRunning: null,
    lastSetting: null,
    longbreakSession: null,

    init: function () {

        this.lastSetting = [];
        this.session = GUI.getSession();
        this.longbreakSession = GUI.getLongBreakSession();
        this.setState("work");
        App.reset();
    },

    stop: function () {
        if (this.timerRunning) {
            clearTimeout(this.timerRunning);
            this.timerRunning = null;
        }
    },

    ring: function (nextState) {

        const audio = $(nextState + "Audio");

        if (audio) {
            audio.volume = 1.0;
            audio.play();
        }

        GUI.notify(nextState);
    },

    start: function () {

        this.secs = Math.round((this.targetTime.getTime() - new Date().getTime()) / 1000);

        GUI.setTimer(this.secs);

        if (this.secs > 0) {
            this.timerRunning = self.setTimeout(function () {
                Timer.start();
            }, 1000);
        } else {
            App.stop();

            if (this.state === "work") {
                this.session = GUI.incSession();
                if ($("longbreak").checked && GUI.decLongBreakSession() === 0) {
                    this.ring("longbreak");
                    this.setState("longbreak", true);
                    $("longbreakSession").value = this.longbreakSession;
                } else if ($("shortbreak").checked) {
                    this.ring("shortbreak");
                    this.setState("shortbreak", true);
                } else if ($("repeat").checked) {
                    this.ring("work");
                    this.setState("work", true);
                } else {
                    this.ring("end");
                    this.setState("end");
                }
            } else if (this.state === "shortbreak" || this.state === "longbreak") {
                if ($("repeat").checked) {
                    this.ring("work");
                    this.setState("work", true);
                } else {
                    this.ring("end");
                    this.setState("end");
                }
            } else if (this.state === "end") {
                this.setState("work", true);
            }
        }
    },

    setSecs: function (s) {
        this.secs = s;
    },

    setTargetTime: function () {
        this.targetTime = new Date();
        this.targetTime.setSeconds(this.targetTime.getSeconds() + this.secs);
    },

    setState: function (state, startRightAfter) {
        App.stop();
        this.state = state;
        $("clock").className = this.state;
        GUI.flashFullscreen(state);
        this.setSecs(GUI.getTimer(this.state));
        this.setLastSetting(this.secs);
        GUI.setTimer(this.secs);

        if (startRightAfter) {
            App.start();
        }
    },

    setLastSetting: function (s) {
        this.lastSetting[this.state] = s;
    },

    setLongBreakSession: function (value) {
        this.longbreakSession = value;
    }
};

const GUI = {

    isFullscreen: false,
    isManualFullscreen: false,
    notification: null,

    nextInput: {
        "Minutes": "Seconds",
        "Seconds": "workMinutes",
        "workMinutes": "workSeconds",
        "workSeconds": "shortbreakMinutes",
        "shortbreakMinutes": "shortbreakSeconds",
        "shortbreakSeconds": "longbreakMinutes",
        "longbreakMinutes": "longbreakSeconds",
        "longbreakSeconds": "longbreakSession",
        "longbreakSession": "Minutes"
    },

    incSession: function () {
        let i = GUI.getSession() + 1;
        GUI.setSession(i);
        return i;
    },

    decLongBreakSession: function () {

        let value = this.getLongBreakSession() - 1;

        if (value < 0) value = 0;

        this.setLongBreakSession(value);

        return value;
    },

    resetSession: function() {
        GUI.setSession(0);
    },

    setSession: function (s) {
        $("sessionCounter").value = s;
        $("sessionsBadge").setAttribute('data-badge', s);
    },

    getSession: function () {
        return parseInt($("sessionCounter").value, 10);
    },

    setLongBreakSession: function (value) {
        if (value) {
            $("longbreakSession").value = value;
        }
    },

    getLongBreakSession: function () {
        return parseInt($("longbreakSession").value, 10);
    },

    setTimer: function (s) {

        const minutesStr = this.formatTime($("Minutes"), Utils.parseMinutes(s));
        const secondsStr = this.formatTime($("Seconds"), Utils.parseSeconds(s));

        $("fullscreenMinutes").innerHTML = minutesStr;
        $("fullscreenSeconds").innerHTML = secondsStr;

        document.title = minutesStr + ":" + secondsStr + " (" + stateNames[Timer.state] + ")";
        $("cardTitle").innerHTML = stateNames[Timer.state];
    },

    getTimer: function (state) {

        state = state || "";

        if (state === "end") return 0;

        const htmlMinutes = $(state + "Minutes").value;
        const htmlSeconds = $(state + "Seconds").value;

        return parseInt(htmlMinutes, 10) * 60 + parseInt(htmlSeconds, 10);
    },

    getTimerString: function (state) {

        state = state || "";

        if (state === "end") return "";

        const htmlMinutes = $(state + "Minutes").value;
        const htmlSeconds = $(state + "Seconds").value;

        return htmlMinutes + ":" + htmlSeconds;
    },

        lockTimer: function () {
            $("Minutes").blur();
            $("Seconds").blur();

            $("startButton").childNodes[0].nodeValue = "Stop";
        },

        unlockTimer: function () {
            $("Minutes").blur();
            $("Seconds").blur();

            $("startButton").childNodes[0].nodeValue = "Start";
        },

    initAudio: function () {
        // This is a workaround to make sounds work on Android, since a user gesture is required:
        // The first time the user clicks on the "Start" button
        const workAudio = $("workAudio");
        const shortbreakAudio = $("shortbreakAudio");
        const longbreakAudio = $("longbreakAudio");
        const endAudio = $("endAudio");

        // Set the volume of all audio elements to 0 (mute them)
        workAudio.volume = 0.0;
        shortbreakAudio.volume = 0.0;
        longbreakAudio.volume = 0.0;
        endAudio.volume = 0.0;

        // And play all audio elements once (no sound will be heard)
        // (This makes the play() function work later from inside the setTimeout() function)
        workAudio.play();
        shortbreakAudio.play();
        longbreakAudio.play();
        endAudio.play();
    },

    notify: function(state) {
        if("Notification" in window){
            if (Notification.permission === "granted") {
                if($("notifications").checked){
                    this.showNotification(state);
                }
            }
            else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        this.showNotification(state)
                    }
                    else {
                        this.disableNotifications();
                    }
                });
            }
        }
    },

    showNotification: function(state) {
        let timer = (state === "end")? "" : "  " + this.getTimerString(state)
        let title = notificationTitles[state] + timer;
        let body = notificationDescriptions[state];
        let icon = notificationIcon;

        this.enableNotifications();

        if (this.notification) {
            this.notification.close();
        }

        this.notification = new Notification(title, { body: body, icon: icon });

        this.notification.onclick = function () {
            window.focus();
            this.close();
        };
    },

    enableNotifications: function () {
        let checkbox = $("notifications");
        checkbox.checked = true;
        checkbox.parentElement.classList.add("is-checked");
        $(checkbox.id + "Settings").classList.remove("is-disabled");
        App.setSetting(checkbox.id, checkbox.checked);
    },

    disableNotifications: function () {
        let checkbox = $("notifications");
        checkbox.checked = false;
        checkbox.parentElement.classList.remove("is-checked");
        $(checkbox.id + "Settings").classList.add("is-disabled");
        App.setSetting(checkbox.id, checkbox.checked);
    },

    showTestNotification: function() {
        let title = "Notifications enabled"
        let body = "You've succesfully enabled notifications"
        let icon = notificationIcon;

        if (this.notification) {
            this.notification.close();
        }

        this.notification = new Notification(title, { body: body, icon: icon });

        this.notification.onclick = function () {
            window.focus();
            this.close();
        };
    },

    formatTime: function (input, value) {

        let formattedTime = (typeof value !== "undefined") ? value : "";

        if (input) {

            value = (typeof value !== "undefined") ? value : input.value;

            const time = parseInt(value, 10);

            if (isNaN(time)) {
                formattedTime = "00";
            } else {
                formattedTime = (time < 10) ? "0" + time : "" + time;
            }

            input.value = formattedTime;
        }

        return formattedTime;
    },

    jumpToNextInput: function (node) {

        const id = node.id;
        const nextId = this.nextInput[id];
        const nextInput = $(nextId);

        if (nextInput) {
            nextInput.select();
        }
    },

    isNumericKey: function (evt) {
        const code = evt.keyCode;

        /* if it is a number (0-9)  */
        return 48 <= code && code <= 57 || 96 <= code && code <= 105;
    },

    isEnterKey: function (evt) {
        return evt.keyCode === 13;
    },

    keyDownInput: null,

    evtCacheInput: function (evt) {
        if (GUI.isNumericKey(evt)) {
            GUI.keyDownInput = this;
        }
    },

    evtJumpToNextInput: function (evt) {
        if (GUI.isNumericKey(evt)) {

            if (GUI.keyDownInput === this && this.value.length >= 2) {

                GUI.jumpToNextInput(this);
            }
        }
    },

    evtFormatTime: function () {
        GUI.formatTime(this);
    },

    evtSetTime: function () {
        Timer.setSecs(GUI.getTimer());
    },

    evtFocusTime: function (evt) {
        if (Timer.timerRunning) {
            App.stop();
        }
        evt.target.select();
    },

    evtEditTime: function(){
        GUI.evtMinimize();
        $("Minutes").focus();
    },

    evtSetSession: function (evt) {
        $("sessionsBadge").setAttribute('data-badge', evt.target.value);
    },

    evtSetSessionBadge: function (evt) {
        if (evt) evt.stopPropagation();

        const leftButton = 0;
        const middleButton = 1;

        if (evt.button === leftButton) {
            GUI.incSession()
        } else if (evt.button === middleButton) {
            GUI.resetSession();
        }
    },

    evtStartStopReset: function (evt) {
        const leftButton = 0;
        const middleButton = 1;

        if (evt.button === leftButton) {
            GUI.evtStartStop();
        } else if (evt.button === middleButton) {
            GUI.evtReset();
        }
    },

    evtStartStop: function () {
        if (Timer.timerRunning) {
            App.stop();
        } else {
            App.start();
        }
    },

    evtReset: function () {
        App.reset();
        $("resetButton").focus();
    },

    evtNextState: function (evt) {
        App.nextState();
        evt.preventDefault();
    },

    toggleShortBreak: function(){
        $("shortbreak").click();
    },

    toggleLongBreak: function(){
        $("longbreak").click();
    },

    toggleRepeat: function(){
        $("repeat").click();
    },

    toggleNotifications: function(){
        $("notifications").click();
    },

    evtToggleShortBreak: function () {
        let checkbox = $("shortbreak");
        App.setSetting(checkbox.id, checkbox.checked);

        if (checkbox.checked) {
            $(checkbox.id + "Now").disabled = false;
            $(checkbox.id + "Minutes").disabled = false;
            $(checkbox.id + "Seconds").disabled = false;
            $(checkbox.id + "Settings").classList.remove("is-disabled");
        } else {
            $(checkbox.id + "Now").disabled = true;
            $(checkbox.id + "Minutes").disabled = true;
            $(checkbox.id + "Seconds").disabled = true;
            $(checkbox.id + "Settings").classList.add("is-disabled");
        }
    },

    evtToggleLongBreak: function () {
        let checkbox = $("longbreak");
        App.setSetting(checkbox.id, checkbox.checked);

        if (checkbox.checked) {
            $(checkbox.id + "Now").disabled = false;
            $(checkbox.id + "Minutes").disabled = false;
            $(checkbox.id + "Seconds").disabled = false;
            $(checkbox.id + "Session").disabled = false;
            $(checkbox.id + "Settings").classList.remove("is-disabled");
            $(checkbox.id + "Settings2").classList.remove("is-disabled");
        } else {
            $(checkbox.id + "Now").disabled = true;
            $(checkbox.id + "Minutes").disabled = true;
            $(checkbox.id + "Seconds").disabled = true;
            $(checkbox.id + "Session").disabled = true;
            $(checkbox.id + "Settings").classList.add("is-disabled");
            $(checkbox.id + "Settings2").classList.add("is-disabled");
        }
    },

    evtToggleRepeat: function () {
        let checkbox = $("repeat");
        App.setSetting(checkbox.id, checkbox.checked);

        if (checkbox.checked) {
            $(checkbox.id + "Settings").classList.remove("is-disabled");
        } else {
            $(checkbox.id + "Settings").classList.add("is-disabled");
        }
    },

    evtToggleNotifications: function () {
        let checkbox = $("notifications");

        if (checkbox.checked) {
            GUI.enableNotifications();

            if("Notification" in window && Notification.permission !== "granted"){
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        GUI.showTestNotification();
                    }
                    else {
                        GUI.disableNotifications();
                    }
                });
            }
        } else {
            GUI.disableNotifications();
        }
    },

    evtToggleSettings: function () {
        const settingsElem = $("cardSettings");
        if (settingsElem.style.display === "block") {
            settingsElem.style.display = "none";
            $("settingsIcon").innerHTML = "settings";
            $("settingsTooltip").innerHTML = "Settings";
            $("settingsButton").focus();
            App.setSetting("settingsButton", "false");
        } else {
            settingsElem.style.display = "block";
            $("settingsIcon").innerHTML = "close";
            $("settingsTooltip").innerHTML = "Close settings";
            $("settingsButton").focus();
            App.setSetting("settingsButton", "true");
        }
    },

    evtSetLongBreakSession: function () {
        Timer.setLongBreakSession(this.value);
        App.setSetting("longbreakSession", this.value);
    },

    evtToggleMaximize: function(){
        if(GUI.isFullscreen){
            GUI.evtMinimize();
        }
        else {
            GUI.evtMaximize();
            $("maximizeButton").focus();
        }
    },

    evtMaximize: function (evt) {
        $("fullscreen").style.display = "table";

        // Set the address bar background color to black
        GUI.evtChangeTheme("#000000");
        GUI.isFullscreen = true;
        if (evt) GUI.isManualFullscreen = true;
    },

    evtMinimize: function (evt) {
        if (evt) evt.stopPropagation();

        $("fullscreen").style.display = "none";

        // Set the address bar background color to default
        GUI.evtChangeTheme("");
        GUI.isFullscreen = false;
        if (evt) GUI.isManualFullscreen = false;
    },

    evtExpandOnResize: function () {
        if (!GUI.isManualFullscreen) {
            const card = $("card");
            const margin = 34;
            const cardWidth = card.offsetWidth + margin
            const cardHeight = card.offsetHeight + margin;

            if (window.innerWidth <= cardWidth || window.innerHeight <= cardHeight) {
                if (!GUI.isFullscreen) GUI.evtMaximize()
            } else if (GUI.isFullscreen) {
                GUI.evtMinimize()
            }
        }
    },

    evtOpenFullscreen: function (evt) {
        if (evt) evt.stopPropagation();
        GUI.evtMaximize();

        const fullscreenElem = $("fullscreen");

        if (fullscreenElem.requestFullscreen) {
            fullscreenElem.requestFullscreen();
        } else if (fullscreenElem.msRequestFullscreen) {
            fullscreenElem.msRequestFullscreen();
        } else if (fullscreenElem.mozRequestFullScreen) {
            fullscreenElem.mozRequestFullScreen();
        } else if (fullscreenElem.webkitRequestFullscreen) {
            fullscreenElem.webkitRequestFullscreen();
        }
    },

    evtExitFullscreen: function (evt) {
        if (evt) evt.stopPropagation();

        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    },

    evtInitFullscreen: function (evt) {
        const orientation = screen.msOrientation || (screen.orientation || screen.mozOrientation);

        if (orientation) {
            if (orientation.type === "landscape-primary" || orientation.type === "landscape-secondary") {
                GUI.evtOpenFullscreen(evt);
            } else {
                GUI.evtExitFullscreen(evt);
                GUI.evtMinimize(evt);
            }
        }
    },

    flashFullscreen: function(state){
        $("fullscreen").className = state + "-flash";
        setTimeout(function(){$("fullscreen").className = state;}, 500)
    },

    evtChangeTheme: function (color) {
        const m = document.getElementsByTagName("meta");

        for (let i = 0; i < m.length; i++) {
            if (m[i].name === "theme-color" || m[i].name === "msapplication-navbutton-color" || m[i].name === "apple-mobile-web-app-status-bar-style") {
                m[i].content = color;
            }
        }
    },

    evtSelectTextOnFocus: function(){
        const allInputs = document.getElementsByTagName("input");

        for (let i = 0; i < allInputs.length; i++) {
            let elem = allInputs[i];
            if (elem.type === "number" || elem.type === "text") {
                elem.addEventListener("focus", Utils.selectText, false);
            }
        }
    },

    storeTime: function(){
        App.setSetting(this.id, GUI.formatTime(this));
    },

    evtTimeInputsOnChange: function() {
        const allTimeInputs = Utils.getElementsByClassName("time");

        for (let i = 0; i < allTimeInputs.length; i++) {
            let elem = allTimeInputs[i];
            elem.addEventListener('blur', GUI.evtFormatTime, false);
            elem.addEventListener('keydown', GUI.evtCacheInput, false);
            elem.addEventListener('keyup', GUI.evtJumpToNextInput, false);
            elem.addEventListener('change', GUI.storeTime, false);
            Mousetrap(elem).bind('enter', GUI.evtStartStop);
        }

        $("longbreakSession").addEventListener('change', GUI.evtSetLongBreakSession, false);
    },

    evtSetTimeOnChange: function() {
        const minutesElem = $("Minutes");
        const secondsElem = $("Seconds");
        minutesElem.addEventListener('change', GUI.evtSetTime, false);
        secondsElem.addEventListener('change', GUI.evtSetTime, false);
        minutesElem.addEventListener('focus', GUI.evtFocusTime, false);
        secondsElem.addEventListener('focus', GUI.evtFocusTime, false);
    },

    evtButtonsAndTogglesOnClick: function() {
        $("sessionCounter").addEventListener('change', GUI.evtSetSession, false);
        $("sessionsBadge").addEventListener('mouseup', GUI.evtSetSessionBadge, false);

        $("workNow").addEventListener('click', App.startWorkNow, false);
        $("shortbreakNow").addEventListener('click', App.startShortBreakNow, false);
        $("longbreakNow").addEventListener('click', App.startLongBreakNow, false);

        $("shortbreak").addEventListener('click', GUI.evtToggleShortBreak, false);
        $("longbreak").addEventListener('click', GUI.evtToggleLongBreak, false);
        $("repeat").addEventListener('click', GUI.evtToggleRepeat, false);
        $("notifications").addEventListener('click', GUI.evtToggleNotifications, false);

        $("startButton").addEventListener('click', GUI.evtStartStop, false);
        $("resetButton").addEventListener('click', App.reset, false);
        $("maximizeButton").addEventListener('click', GUI.evtMaximize, false);
        $("minimizeButton").addEventListener('mouseup', GUI.evtMinimize, false);
        $("settingsButton").addEventListener('click', GUI.evtToggleSettings, false);

        const fullscreenElem = $("fullscreen");
        fullscreenElem.addEventListener('mouseup', GUI.evtStartStopReset, false);
        fullscreenElem.addEventListener('contextmenu', GUI.evtNextState, false);
    },

    evtFullscreenOnLandscape: function() {
        const orientation = screen.msOrientation || (screen.orientation || screen.mozOrientation);
        if (orientation) {
            orientation.addEventListener("change", GUI.evtInitFullscreen, false);
        }
    },

    loadSettings: function() {
        $("shortbreak").checked = App.getSetting("shortbreak") === null || App.getSetting("shortbreak") === "true";
        $("longbreak").checked = App.getSetting("longbreak") === null || App.getSetting("longbreak") === "true";
        $("repeat").checked = App.getSetting("repeat") === null || App.getSetting("repeat") === "true";
        $("notifications").checked = ("Notification" in window) && Notification.permission === "granted" &&
            (App.getSetting("notifications") === null || App.getSetting("notifications") === "true");

        for (let inputId in defaultValues) {
            $(inputId).value = App.getSetting(inputId) || defaultValues[inputId];
        }

        GUI.evtToggleShortBreak();
        GUI.evtToggleLongBreak();
        GUI.evtToggleRepeat();
        GUI.evtToggleNotifications();
        if(App.getSetting("settingsButton") === "true") GUI.evtToggleSettings();
    }
};

const App = {

    firstTime: true,

    start: function () {
        if (App.firstTime) {
            GUI.initAudio();
            App.firstTime = false;
        }

        GUI.lockTimer();
        Timer.setTargetTime();
        Timer.start();
    },

    stop: function () {
        GUI.unlockTimer();
        Timer.stop();
    },

    reset: function () {
        const timerWasRunning = Timer.timerRunning;
        App.stop();

        if (Timer.state === "end") {
            Timer.setState("work");
        } else if (GUI.getTimer() === GUI.getTimer(Timer.state)) {
            if (Timer.state === "work") {
                GUI.setSession(0);
            }
            Timer.setState("work");
        } else {
            Timer.setSecs(GUI.getTimer(Timer.state));
            GUI.setTimer(Timer.secs);
        }

        if (timerWasRunning)
            App.start();
    },

    nextState: function () {

        App.stop();

        if (Timer.state === "work") {
            if($("shortbreak").checked){
                Timer.setState("shortbreak", true);
            }
            else if($("longbreak").checked){
                Timer.setState("longbreak", true);
            }
            else {
                App.start();
            }
        } else if (Timer.state === "shortbreak" && $("longbreak").checked) {
            Timer.setState("longbreak", true);
        } else {
            Timer.setState("work", true);
        }
    },

    startWorkNow: function () {
        Timer.setState("work", true);
    },

    startShortBreakNow: function () {
        Timer.setState("shortbreak", true);
    },

    startLongBreakNow: function () {
        Timer.setState("longbreak", true);
        GUI.setLongBreakSession(Timer.longbreakSession)
    },

    getSetting: function(settingName) {
        return localStorage.getItem(NAMESPACE + "." + settingName);
    },

    setSetting: function(settingName, settingValue) {
        localStorage.setItem(NAMESPACE + "." + settingName, settingValue);
    }
};

const Utils = {

    parseMinutes: function (s) {
        let seconds = s;
        let minutes = 0;

        while (seconds >= 60) {
            minutes++;
            seconds -= 60;
        }

        return minutes;
    },

    parseSeconds: function (s) {
        return s % 60;
    },

    getElementsByClassName: function (className, node) {

        node = (node) ? node : document;
        node = (typeof node == 'string') ? document.getElementById(node) : node;

        const all = node.getElementsByTagName("*");
        const returnArray = [];

        if (node.getElementsByClassName) {
            return node.getElementsByClassName(className);
        } else {

            for (let i = 0; i < all.length; i++) {
                const elem = all[i];
                if (elem && elem.className === className) {
                    returnArray.push(elem);
                }
            }

            return returnArray;
        }
    },

    selectText: function (evt) {
        evt.target.select();
    }
};

window.addEventListener("resize", GUI.evtExpandOnResize, false);
window.addEventListener("load", function () {
    GUI.evtSelectTextOnFocus();
    GUI.evtTimeInputsOnChange();
    GUI.evtSetTimeOnChange();
    GUI.evtButtonsAndTogglesOnClick();
    GUI.evtFullscreenOnLandscape();
    GUI.evtExpandOnResize();
    GUI.loadSettings();
    Timer.init();
}, false);

Mousetrap.bindGlobal(['a', 'o'], GUI.evtStartStop);
Mousetrap.bindGlobal('r', GUI.evtReset);
Mousetrap.bindGlobal('n', GUI.evtNextState);
Mousetrap.bindGlobal('w', App.startWorkNow);
Mousetrap.bindGlobal('b', App.startShortBreakNow);
Mousetrap.bindGlobal('l', App.startLongBreakNow);
Mousetrap.bindGlobal('f', GUI.evtToggleMaximize);
Mousetrap.bindGlobal(['esc', 'u'], GUI.evtMinimize);
Mousetrap.bindGlobal('e', GUI.evtEditTime, 'keyup');
Mousetrap.bindGlobal('s', GUI.evtToggleSettings);
Mousetrap.bindGlobal('+', GUI.incSession);
Mousetrap.bindGlobal('-', GUI.resetSession);
Mousetrap.bindGlobal('t b', GUI.toggleShortBreak);
Mousetrap.bindGlobal('t l', GUI.toggleLongBreak);
Mousetrap.bindGlobal('t r', GUI.toggleRepeat);
Mousetrap.bindGlobal('t n', GUI.toggleNotifications);