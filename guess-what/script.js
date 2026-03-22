// initalize some variables
var overlay;
var resultsPage;
var startText;
var gameList;
var listNum;
var allowColorChange = false;
var passCorrectList = [];
var cardList = [];
var currentPosition = "NEUTRAL";
var gamesDict;
//defaultTimer = 60;

function shuffleList(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Check if the user is on an iOS device
function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Detects if device is in standalone mode
function isRunningStandalone() {
  return (window.matchMedia('(display-mode: standalone)').matches);
}

function removeDuplicates(inputList) {
  return [...new Set(inputList)];
}

function createOverlay() {
  // create the overlay
  overlay = document.createElement('div');
  overlay.id = "overlay";
  overlay.classList = "light-or-dark";
  overlay.style.height = "100%";
  overlay.style.width = "100%";
  overlay.style.overflow = "hidden";
  overlay.style.top = "0";
  overlay.style.position = "fixed";

  resultsPage = document.createElement('div');
  resultsPage.style.height = "85%";
  resultsPage.style.width = "90%";
  resultsPage.style.top = "15%";
  resultsPage.style.position = "fixed";
  resultsPage.style.alignItems = "flex-start";
  overlay.appendChild(resultsPage);

  var banner = document.createElement('div');
  banner.style.backgroundColor = "#06C7C3";
  banner.style.height = "15%";
  banner.style.width = "100%";
  banner.style.position = "absolute";
  banner.style.top = "0";
  overlay.appendChild(banner);

  circle = document.createElement('div');
  circle.classList = "circle light-or-dark";
  circle.style.borderRadius = "50%";
  circle.style.border = "1vw solid #06C7C3";
  circle.style.height = "10vw";
  circle.style.width = "10vw";
  circle.style.top = "80%";
  circle.style.left = "50%";
  circle.style.position = "absolute";
  circle.style.transform = "translate(-50%, -50%)";
  circle.innerText = roundTimer;
  circle.style.fontSize = "240%";
  circle.style.fontWeight = "bold";
  banner.appendChild(circle);

  startText = document.createElement('div');
  startText.innerText = "Get Ready\n5";
  startText.style.position = "absolute";
  startText.style.width = "85%";
  startText.style.fontSize = "500%";
  startText.style.backgroundColor = "rgba(0, 0, 0, 0)";
  startText.style.top = "60%";
  startText.style.left = "50%";
  startText.style.transform = "translate(-50%, -50%)";
  startText.style.textAlign = "center";
  startText.style.display = "-webkit-box";
  startText.style.webkitLineClamp = "3";
  startText.style.webkitBoxOrient = "vertical";
  startText.style.overflow = "hidden";
  startText.style.textOverflow = "ellipsis";
  overlay.appendChild(startText);

  const exitButton = document.createElement('div');
  exitButton.style.top = "30%";
  exitButton.style.left = "4%";
  exitButton.style.position = "absolute";
  exitButton.style.fontSize = "150%";
  exitButton.innerHTML = '<img src="icons/general/arrow-left.svg" style="display: inline; width: 1em;" alt="back" class="invertable-image">Back';
  exitButton.addEventListener('click', function () {
    // break the loop for displaying the results
    breakLoop = true;
    document.body.removeChild(overlay);
    // set the gameCancled variable to true to stop the countdown timers
    gameCancled = true;
    allowColorChange = false;
  });
  banner.appendChild(exitButton);

  document.body.appendChild(overlay);

  gameCancled = false;
  getReady(6);
}

function getReady(countdown) {
  if (gameCancled) {
    return;
  }
  // start counting down to get ready
  if (countdown == 1) {
    passCorrectList = [];
    cardList = [];
    startGame();
  } else {
    var newNum = countdown - 1;
    startText.innerText = "Get Ready\n" + newNum;
    // play the count sound
    //playCountSound();
    setTimeout(function () {
      getReady(newNum);
    }, 1000);
  }
}

function startTimer(countdown) {
  if (gameCancled) {
    return;
  }
  // start the game timer
  if (countdown == 1) {
    circle.innerText = "0";
    passCorrectList.push("PASS");
    cardList.push(gameList[listNum]);
    endGame();
  } else {
    var newNum = countdown - 1;
    circle.innerText = newNum;
    setTimeout(function () {
      startTimer(newNum);
    }, 1000);
  }
}

function startGame() {
  // start the game timer
  startTimer(roundTimer); // how many seconds the game will last. Default is roundTimer
  listNum = 0;
  startText.innerText = gameList[listNum];
  allowColorChange = true;
}

function getGameList(gameName) {
  // set a global variable to know what the key for the game is
  replay = function () {
    getGameList(gameName);
  }
  // get the array from the dictionary
  gameList = gamesDict[gameName];
  shuffleList(gameList);
  createOverlay();
}

function handleOrientation(event) {
  if (!allowColorChange) {
    return;
  }
  if (event.gamma > -50 && event.gamma < 0) {
    if (lockAnswer) {
      return;
    }
    if (currentPosition == "NEUTRAL") {
      overlay.classList.add('redGradient');
      startText.innerText = "PASS";
      playPassSound();

      // add current item to passed list
      passCorrectList.push("PASS");
      cardList.push(gameList[listNum]);
      currentPosition = "PASS";
      lockAnswer = true;
      listNum += 1;
    } else {
      skippedNeutral();
    }
  } else if (event.gamma < 60 && event.gamma > 0) {
    if (lockAnswer) {
      return;
    }
    if (currentPosition == "NEUTRAL") {
      overlay.classList.add('greenGradient');
      startText.innerText = "CORRECT";
      playCorrectSound();

      // add current item to correct list
      passCorrectList.push("CORRECT");
      cardList.push(gameList[listNum]);
      currentPosition = "CORRECT";
      lockAnswer = true;
      listNum += 1;
    } else {
      skippedNeutral();
    }
  } else {
    if (lockAnswer) {
      if (waitingForLockAnswer) {
        return;
      }
      setTimeout(function () {
        lockAnswer = false;
        waitingForLockAnswer = false;
      }, 500);
      waitingForLockAnswer = true;
      return;
    }
    overlay.classList.remove('greenGradient');
    overlay.classList.remove('redGradient');
    if (currentPosition != "NEUTRAL") {
      if (listNum > gameList.length - 1) {
        listNum = 0;
      }
      startText.innerText = gameList[listNum];
      currentPosition = "NEUTRAL";
    }
  }
}

function skippedNeutral() {
  lockAnswer = true;
  waitingForLockAnswer = true;
  overlay.classList.remove('greenGradient');
  overlay.classList.remove('redGradient');
  if (currentPosition != "NEUTRAL") {
    if (listNum > gameList.length - 1) {
      listNum = 0;
    }
    startText.innerText = gameList[listNum];
    currentPosition = "NEUTRAL";
  }
  setTimeout(function () {
    lockAnswer = false;
    waitingForLockAnswer = false;
  }, 100);
}

function requestPermission() {
  if (window.DeviceOrientationEvent) {
    if (!isiOS()) {
      window.addEventListener('deviceorientation', handleOrientation);
      return true;
    }
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          console.log("permission granted");
          return true;
        } else {
          console.log("permission denied");
          return false;
        }
      })
      .catch(error => {
        console.error('Error requesting device orientation permission:', error);
        return false;
      });
  } else {
    return false;
  }
}

function endGame() {
  // end the game and show the results
  allowColorChange = false;
  overlay.classList.remove('greenGradient');
  overlay.classList.remove('redGradient');
  startText.innerText = "TIME'S UP!";
  // play the pass sound
  playPassSound();
  setTimeout(function () {
    // display the results
    startText.innerText = '';
    var leftCol = document.createElement('div');
    leftCol.style.width = "45%";
    leftCol.style.height = "100%";
    leftCol.style.justifyContent = "start";
    leftCol.style.flexDirection = "column";
    leftCol.style.display = "flex";
    leftCol.style.fontSize = "150%";
    leftCol.style.height = "auto";
    resultsPage.appendChild(leftCol);

    var middleCol = document.createElement('div');
    middleCol.style.width = "10%";
    resultsPage.appendChild(middleCol);

    var rightCol = document.createElement('div');
    rightCol.style.width = "45%";
    rightCol.style.height = "100%";
    rightCol.style.justifyContent = "start";
    rightCol.style.flexDirection = "column";
    rightCol.style.display = "flex";
    rightCol.style.fontSize = "150%";
    rightCol.style.height = "auto";
    resultsPage.appendChild(rightCol);

    resultsPage.style.overflowY = "auto";
    // allow certain elements to scroll again if the user started creating a new set
    allowScroll(resultsPage);

    overlay.removeChild(startText);

    // create the replay button
    const replayButton = document.createElement('div');
    replayButton.style.top = "30%";
    replayButton.style.right = "4%";
    replayButton.style.position = "absolute";
    replayButton.style.fontSize = "150%";
    replayButton.innerHTML = 'Replay<img src="icons/general/arrow-replay.svg" style="display: inline; width: 1em;" alt="replay" class="invertable-image">';
    replayButton.addEventListener('click', function () {
      // break the loop for displaying the results
      breakLoop = true;
      overlay.remove();
      replay();
    });
    var banner = document.querySelector("#overlay > div:nth-child(2)");
    banner.appendChild(replayButton);

    var totalPoints = 0;
    var length = passCorrectList.length;
    breakLoop = false;
    loopTime = 1000;

    function loopResults(indexLength, i = 0) {
      if (i == indexLength || breakLoop == true) {
        return;
      }
      var card = cardList[i];
      if (passCorrectList[i] == "CORRECT") {
        var color = "green";
        totalPoints++;
        if (loopTime == 1000) {
          // play the count sound
          playCountSound();
        }
      } else {
        var color = "red";
      }
      var text = document.createElement('span');
      text.innerText = card;
      text.style.color = color;
      text.style.marginTop = "3%";
      var evenOdd = i % 2;
      if (evenOdd == 0) {
        // it is even, add to left list
        leftCol.appendChild(text);
      } else {
        // it is odd, add to right list
        rightCol.appendChild(text);
      }
      circle.innerText = totalPoints;
      setTimeout(function () {
        loopResults(indexLength, i + 1);
      }, loopTime);
    }
    // call the function to loop through the results
    loopResults(length);

    // add an event listener to change the loop time to 0 seconds if the screen is tapped
    function changeLoopTime() {
      loopTime = 0;
      // Remove the event listener after it executes once
      document.removeEventListener('click', changeLoopTime);
    }
    document.addEventListener('click', changeLoopTime);



  }, 3000);
}









function getDictionary(path) {
  //first, request permission to use the device's orientation
  requestPermission();
  // get the JSON file from the path
  fetch("game-sets/" + path)
    .then(response => response.json())
    .then(collectionDict => {
      var title = collectionDict["title"];
      var description = collectionDict["description"];
      gamesDict = collectionDict["games"];
      buildGamePreview(title, description);
    })
    .catch(error => console.error('Error fetching or parsing JSON:', error));
}

function buildGamePreview(title, description) {
  // build the screen to confirm to play the game
  // first create a blank div tag to prevent background items from being clicked
  preventInput = document.createElement('div');
  preventInput.style.height = "100%";
  preventInput.style.width = "100%";
  preventInput.style.overflow = "hidden";
  preventInput.style.top = "0";
  preventInput.style.position = "fixed";
  preventInput.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
  document.body.appendChild(preventInput);

  // Create main container div
  const mainDiv = document.createElement('div');
  mainDiv.classList.add('mainGamePreview');
  mainDiv.style.position = 'absolute';
  mainDiv.style.top = '50%';
  mainDiv.style.left = '50%';
  mainDiv.style.transform = 'translate(-50%, -50%)';
  mainDiv.style.width = '85%';
  mainDiv.style.border = '1px solid #ccc';
  mainDiv.style.padding = '10px';
  mainDiv.style.backgroundColor = '#06C7C3';
  mainDiv.style.textAlign = 'center';
  mainDiv.style.overflowY = "hidden";

  // Create close button in the top left
  const closeButton = document.createElement('div');
  closeButton.classList = "closeBtn redGradient";
  closeButton.style.borderRadius = "999px";
  closeButton.style.aspectRatio = "1/1";
  closeButton.style.display = "flex";
  closeButton.style.alignItems = "center";
  closeButton.style.justifyContent = "center";
  closeButton.textContent = 'x';
  closeButton.style.position = 'absolute';
  closeButton.style.cursor = 'pointer';
  closeButton.addEventListener('click', () => {
    mainDiv.remove();
    preventInput.remove();
  });

  // Create title
  const titleDiv = document.createElement('div');
  titleDiv.textContent = title;
  titleDiv.style.fontWeight = 'bold';
  titleDiv.style.fontSize = "200%";
  titleDiv.style.display = "-webkit-box";
  titleDiv.style.webkitLineClamp = "2";
  titleDiv.style.webkitBoxOrient = "vertical";
  titleDiv.style.overflow = "hidden";
  titleDiv.style.textOverflow = "ellipsis";
  titleDiv.style.margin = "0% 5%";

  // Create time options div
  const timeOptionsDiv = document.createElement('div');
  timeOptionsDiv.className = "orangeGradient";
  timeOptionsDiv.classList.add('timeOptions');
  timeOptionsDiv.style.margin = "auto";
  timeOptionsDiv.style.display = 'flex';
  timeOptionsDiv.style.flexDirection = 'column';
  timeOptionsDiv.style.fontSize = "125%";

  var chooseTimeText = document.createElement('div');
  chooseTimeText.innerText = "Game Timer Options";
  timeOptionsDiv.appendChild(chooseTimeText);
  var theOptions = document.createElement('div');
  theOptions.style.display = 'flex';
  theOptions.style.flexDirection = 'row';
  theOptions.style.justifyContent = 'center';
  timeOptionsDiv.appendChild(theOptions);

  // Create options (60s, 90s, 120s)
  const timeOptions = [60, 90, 120];
  timeOptions.forEach((option) => {
    optionDiv = document.createElement('div');
    optionDiv.classList.add('timerOption');
    optionDiv.textContent = option + "s";
    optionDiv.style.cursor = 'pointer';
    optionDiv.style.paddingLeft = '8%'; // Add margin to separate options
    optionDiv.style.paddingRight = '8%';
    optionDiv.style.paddingTop = '2%';
    optionDiv.style.paddingBottom = '2%';
    optionDiv.style.borderRadius = "999px";
    if (defaultTimer == option) {
      optionDiv.classList.add('selectedTimer');
      roundTimer = defaultTimer;
    }
    optionDiv.addEventListener('click', () => {
      // Execute function based on the selected option
      roundTimer = option;
      // Find all elements with the class name 'selectedTimer'
      const selectedTimers = document.getElementsByClassName('timerOption');
      // Loop through the collection and remove the 'selectedTimer' class from each element
      for (let i = 0; i < selectedTimers.length; i++) {
        const element = selectedTimers[i];
        if (element.innerText == option + 's') {
          element.classList.add('selectedTimer');
        } else {
          element.classList.remove('selectedTimer');
        }
      }
    });
    theOptions.appendChild(optionDiv);
  });

  // Create description div
  const descriptionDiv = document.createElement('div');
  descriptionDiv.style.flexGrow = "1";
  descriptionDiv.style.display = "flex";
  descriptionDiv.style.flexDirection = "column";
  descriptionDiv.style.justifyContent = "center";
  descriptionDiv.style.alignItems = "center";
  descriptionDiv.style.overflow = "hidden";
  var descriptionText = document.createElement('p');
  descriptionText.className = "description";
  descriptionText.innerText = description;
  descriptionText.style.margin = "2%";
  descriptionDiv.appendChild(descriptionText);


  const gridDiv = document.createElement('div');
  gridDiv.style.height = "100%";
  gridDiv.style.overflowY = "auto";
  theKeys = Object.keys(gamesDict);
  if (theKeys.length > 1) {
    // add a "Play All" option
    var playAll = addPlayAllOption();
    gridDiv.appendChild(playAll);

    var gamesGrid = document.createElement('div');
    gamesGrid.classList.add('grid');

    // Create grid of div tags with titles and functions
    theKeys.forEach((key) => {
      const gridItemDiv = document.createElement('div');
      gridItemDiv.textContent = key;
      gridItemDiv.style.border = '1px solid #ddd';
      gridItemDiv.style.padding = '5px';
      gridItemDiv.style.margin = '5px';
      gridItemDiv.style.cursor = 'pointer';
      gridItemDiv.style.display = 'flex';
      gridItemDiv.style.justifyContent = 'center';
      gridItemDiv.style.alignItems = 'center';
      gridItemDiv.addEventListener('click', function () {
        getGameList(key);
      });
      gridItemDiv.style.borderRadius = "3vmin";
      gamesGrid.appendChild(gridItemDiv);
    });

    gridDiv.appendChild(gamesGrid);

    var topHeight = "65%";
    var bottomHeight = "35%";

  } else {
    // add only the single play option
    var playBtn = addPlayButton();
    gridDiv.appendChild(playBtn);

    var topHeight = "80%";
    var bottomHeight = "20%";
  }

  var top = document.createElement('div');
  top.style.height = topHeight;
  top.style.display = "flex";
  top.style.flexFlow = "column";

  var bottom = document.createElement('div');
  bottom.style.height = bottomHeight;
  bottom.style.marginTop = "2%";

  mainDiv.style.borderRadius = "4vmin";
  timeOptionsDiv.style.borderRadius = "999px";

  // Append created elements to the main container
  top.appendChild(closeButton);
  top.appendChild(titleDiv);
  top.appendChild(descriptionDiv);
  top.appendChild(timeOptionsDiv);
  bottom.appendChild(gridDiv);
  mainDiv.appendChild(top);
  mainDiv.appendChild(bottom);

  // Append main container to the body
  document.body.appendChild(mainDiv);

  // allow certain elements to scroll again if the user started creating a new set
  allowScroll(gridDiv);
}


function addPlayAllOption() {
  const gridItemDiv = document.createElement('div');
  gridItemDiv.textContent = "Play All Sets";
  gridItemDiv.style.border = '1px solid #ddd';
  gridItemDiv.style.padding = '5px';
  gridItemDiv.style.margin = '5px';
  gridItemDiv.style.cursor = 'pointer';
  gridItemDiv.addEventListener('click', function () {
    getAllGames();
    replay = getAllGames;
  });
  gridItemDiv.style.borderRadius = "3vmin";
  gridItemDiv.className = "pinkGradient";
  gridItemDiv.style.color = "white";
  gridItemDiv.style.fontSize = "150%";
  return gridItemDiv;
}

function getAllGames() {
  var theList = [];
  theKeys.forEach((key) => {
    var set = gamesDict[key];
    theList = theList.concat(set);
  });
  removeDuplicates(theList);
  shuffleList(theList);
  gameList = theList;
  createOverlay();
}

function addPlayButton() {
  var gridItemDiv = document.createElement('div');
  gridItemDiv.classList = "pinkGradient";
  gridItemDiv.textContent = "Play";
  gridItemDiv.style.border = '1px solid #ddd';
  gridItemDiv.style.padding = '5px';
  gridItemDiv.style.margin = '5px';
  gridItemDiv.style.cursor = 'pointer';
  gridItemDiv.addEventListener('click', function () {
    getGameList("Play");
  });
  gridItemDiv.style.borderRadius = "3vmin";
  gridItemDiv.style.color = "white";
  gridItemDiv.style.fontSize = "150%";
  return gridItemDiv;
}


function preventScroll() {
  // prevent any element from scrolling after the user has clicked on an input
  var preventDefault = function (e) {
    e.preventDefault();
    e.stopPropagation(); // Stop the event from propagating to parent or child elements
  };

  document.addEventListener('touchmove', preventDefault, {
    passive: false
  });
  document.addEventListener('touchforcechange', preventDefault, {
    passive: false
  });

}

function allowScroll(element) {
  var allowDefault = function (e) {
    // do nothing
    e.stopPropagation();
  };

  element.addEventListener('touchmove', allowDefault, {
    passive: false
  });
  element.addEventListener('touchforcechange', allowDefault, {
    passive: false
  });

  element.addEventListener('scroll', function () {
    // Check if the scroll position is at the top
    if (element.scrollTop === 0) {
      // If at the top, prevent further scrolling up
      element.scrollTop = 1; // Set it to 1 to prevent further scrolling
    } else if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      // If at the bottom, prevent further scrolling down
      element.scrollTop = element.scrollHeight - element.clientHeight - 1;
    }
  });

  setTimeout(function () {
    // set topscroll to 1 immediately so that scrolling up doesn't casue the whole screen to move
    element.scrollTop = 1;
  }, 1);

}



function controlStretch(element) {
  // adjusts the height of the stretch element to make sure that the grid containers can always scroll
  var stretch = element.querySelector('.stretch');
  if (stretch == null) {
    return;
  }

  // first set the height to zero in order to reset it
  stretch.style.height = "0px";

  if (element.clientHeight >= element.scrollHeight) {
    var allCards = element.querySelectorAll('.gameCard:not(.stretch):not(.buffer)');
    var num = allCards.length;
    if (num == 0) {
      stretch.style.height = element.clientHeight + 1 + 'px';
      return;
    }

    var lastCard = allCards[num - 1];
    var lastElementPosition = lastCard.offsetTop + lastCard.offsetHeight;
    var newHeight = (element.clientHeight - lastElementPosition) + 1;
    stretch.style.height = newHeight + 'px';
  }
}

function addEmptyClickEvent() {
  // this function is needed in order to prevent random scrolling when double tapping on elements after clicking on an input tag on iOS
  // Get all elements on the page
  var allElements = document.getElementsByTagName("*");

  // Iterate through each element
  for (var i = 0; i < allElements.length; i++) {
    var currentElement = allElements[i];
    // Check if the element does not already have an onclick attribute
    if (!currentElement.hasAttribute("onclick")) {
      currentElement.addEventListener("click", function () {
        // simply return to prevent scrolling
        return;
      });
    }
  }

}

function displayPopup(message, closeText = null, continueText = null, continueFunction = null, ...continueArgs) {
  // first remove the prevent input element if it already exists
  var oldElem = document.getElementById('preventInput');
  if (oldElem != null) {
    oldElem.remove();
  }
  // create an element over the top of everything and display a message with options
  // create a blank div tag to prevent background items from being clicked
  var preventInput = document.createElement('div');
  preventInput.id = "preventInput";
  preventInput.style.height = "100%";
  preventInput.style.width = "100%";
  preventInput.style.overflow = "hidden";
  preventInput.style.top = "0";
  preventInput.style.position = "fixed";
  preventInput.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
  document.body.appendChild(preventInput);

  var mainDiv = document.createElement('div');
  mainDiv.classList = "light-or-dark";
  mainDiv.style.width = "70%";
  mainDiv.style.position = "fixed";
  mainDiv.style.top = "50%";
  mainDiv.style.left = "50%";
  mainDiv.style.transform = 'translate(-50%, -50%)';
  mainDiv.style.margin = "auto";
  mainDiv.style.overflow = "hidden";
  mainDiv.style.borderRadius = "20px";
  mainDiv.style.border = "solid";
  mainDiv.style.display = "flex";
  mainDiv.style.flexDirection = "column";
  mainDiv.style.textAlign = "center";
  preventInput.appendChild(mainDiv);

  var messageDiv = document.createElement('div');
  messageDiv.style.margin = "5%";
  messageDiv.innerHTML = message;
  mainDiv.appendChild(messageDiv);

  var buttonContainer = document.createElement('div');
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "space-evenly";
  buttonContainer.style.marginBottom = "5%";
  mainDiv.appendChild(buttonContainer);

  if (closeText != null) {
    var cancelBtn = document.createElement('div');
    cancelBtn.style.padding = "3% 5% 3% 5%";
    cancelBtn.style.borderRadius = "999px";
    cancelBtn.classList = "redGradient";
    cancelBtn.innerText = closeText;
    cancelBtn.addEventListener('click', () => {
      preventInput.remove();
    });
    buttonContainer.appendChild(cancelBtn);
  }

  if (continueText != null && continueFunction != null) {
    var continueBtn = document.createElement('div');
    continueBtn.style.padding = "3% 5% 3% 5%";
    continueBtn.style.borderRadius = "999px";
    continueBtn.classList = "blueGradient";
    continueBtn.innerText = continueText;
    continueBtn.addEventListener('click', () => {
      continueFunction(...continueArgs);
      preventInput.remove();
    });
    buttonContainer.appendChild(continueBtn);
  }
}

function displayLoadingPopup(message) {
  var topText = message + "<br><br>";
  displayPopup(topText + "◦•••••");

  function changeEllipsis() {
    var ellipsisElement = document.getElementById('preventInput').querySelector('div > div > div');
    var ellipsisText = ellipsisElement.innerHTML;
    if (ellipsisText == topText + "◦•••••") {
      ellipsisElement.innerHTML = topText + "•◦••••";
    } else if (ellipsisText == topText + "•◦••••") {
      ellipsisElement.innerHTML = topText + "••◦•••";
    } else if (ellipsisText == topText + "••◦•••") {
      ellipsisElement.innerHTML = topText + "•••◦••";
    } else if (ellipsisText == topText + "•••◦••") {
      ellipsisElement.innerHTML = topText + "••••◦•";
    } else if (ellipsisText == topText + "••••◦•") {
      ellipsisElement.innerHTML = topText + "•••••◦";
    } else if (ellipsisText == topText + "•••••◦") {
      ellipsisElement.innerHTML = topText + "◦•••••";
    } else {
      return;
    }
    setTimeout(changeEllipsis, 250);
  }
  changeEllipsis();
}









// functions for favorites page

function toggleHeart(gameID) {
  var theElement = document.getElementById(gameID);
  var heartElem = theElement.querySelector("div>img");
  if (heartElem.src.includes("fill")) {
    heartElem.src = "icons/general/heart-outline.svg";
    removeFavorites(gameID);
  } else {
    heartElem.src = "icons/general/heart-fill.svg";
    addToFavorites(gameID);
  }
  // now try to toggle the heart on the duplicate div too
  var theElement = document.getElementById(gameID + "-fave");
  if (theElement == null) {
    return;
  }
  var heartElem = theElement.querySelector("div>img");
  if (heartElem.src.includes("fill")) {
    heartElem.src = "icons/general/heart-outline.svg";
  } else {
    heartElem.src = "icons/general/heart-fill.svg";
  }
}

function getFavorites() {
  var faves = localStorage.getItem("favorites");
  if (faves !== null) {
    return JSON.parse(faves);
  }
  return [];
}

function addToFavorites(newValue) {
  var favesList = getFavorites();
  favesList.push(newValue);
  setFavorites(favesList);
}

function setFavorites(favesList) {
  var string = JSON.stringify(favesList);
  localStorage.setItem("favorites", string);
}

function removeFavorites(valueToRemove) {
  var favesList = getFavorites();
  var updatedList = favesList.filter(value => value !== valueToRemove);
  setFavorites(updatedList);
}

function markFavorites() {
  var favesList = getFavorites();
  favesList.forEach(value => {
    var theElement = document.getElementById(value);
    var heartElem = theElement.querySelector("div>img");
    heartElem.src = "icons/general/heart-fill.svg";
  });
}

function hideOtherElements(unhiddenElementClass) {
  var list = ['allGames', 'favorites', 'create', 'settings'];
  for (var i = 0; i < list.length; i++) {
    var value = list[i];
    var element = document.getElementById(value);
    if (value == unhiddenElementClass) {
      element.classList.remove('hidden');
      controlStretch(element);
      allowScroll(element);
      document.querySelector("body > div.menu-bar > div:nth-child(" + (i + 1) + ")").classList.add("active");
    } else {
      element.classList.add('hidden');
      document.querySelector("body > div.menu-bar > div:nth-child(" + (i + 1) + ")").classList.remove("active");
    }
  }
}

function displayFavorites() {
  var favesPage = document.getElementById('favorites');
  favesPage.innerHTML = '<div class="gameCard buffer"></div><div class="gameCard stretch" style="height: 0px;"></div>';
  var buffer = favesPage.querySelector(".buffer");
  var favesList = getFavorites();

  favesList.forEach(value => {
    var element = document.getElementById(value);
    var clone = element.cloneNode(true);
    clone.id = value + "-fave";
    var dropDownBtn = clone.querySelector('.dropDownButton');
    if (dropDownBtn != null) {
      dropDownBtn.remove();
    }
    favesPage.insertBefore(clone, buffer);
  });
  hideOtherElements('favorites');
  // sometimes the stretch function doesn't work because not all elements have been appended, so delay it
  setTimeout(function () {
    var element = document.getElementById('favorites');
    controlStretch(element);
  }, 100);
}








// functions for create page

function createSet() {
  // reveal the create-page
  var page = document.getElementById('create-page');
  page.classList.remove('hidden');
  selectedColor = "blueGradient";
  // allow the cards text box and description input to scroll again
  var cardsTextBox = document.querySelector("#enterCards");
  allowScroll(cardsTextBox);
  var descriptionTextBox = document.querySelector("#description");
  allowScroll(descriptionTextBox);
}

function discardSet() {
  var page = document.getElementById('create-page');
  page.classList.add('hidden');
  var inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(element => {
    element.value = '';
  });
  selectColor('blueGradient');

  // make sure that the scrolling bug in iOS doesn't mess with the user experience
  preventScroll();

  // make sure random scrolling doesn't happen on iOS
  addEmptyClickEvent();
}

function selectColor(color) {
  var circles = document.querySelectorAll('.color-circle');
  circles.forEach(element => {
    if (element.classList.contains(color)) {
      element.classList.add('selectedColor');
      selectedColor = color;
    } else {
      element.classList.remove('selectedColor');
    }
  });
}

function importSet() {
  // show a popup with an input box
  var message = "Enter the shareable code below:<br><br><input type='text' id='shareableCode' name='shareableCode' style='font-size: 150%; text-align: center; width: 80%;'>";
  displayPopup(message, "Cancel", "Import Set", function () {
    var code = document.getElementById('shareableCode').value.trim();
    displayLoadingPopup("Importing Game");
    importUserCreatedGame([code]);
  });
}

async function importUserCreatedGame(id, index = 0, errorCount = 0) {
  if (errorCount > 5) {
    console.log('fetch failed');
    displayPopup("Import Failed<br><br>Please try again later when internet connection is more stable.", "Exit");
    return;
  }
  if (index >= id.length) {
    // there are no more items in the data list
    return "";
  }

  try {
    var url = 'https://tinyurl.com/' + id[index];
    const response = await fetch(url);
    const tinyURL = await response.url;
    if (!tinyURL.includes(location.href)) {
      displayPopup("This code is invalid.<br><br>There is no such game with that code.", "Exit");
      return;
    }
    var data = tinyURL.replace(location.href + '?s=', '');
    var dataString = await importUserCreatedGame(id, index + 1);
    var fullDataString = data + dataString;
    if (index != 0) {
      return fullDataString;
    }
    if (fullDataString.includes("ListOfTinyUrlCodes")) {
      var encodedList = fullDataString.replace("ListOfTinyUrlCodes", "");
      var idList = JSON.parse(decodeURIComponent(encodedList));
      importUserCreatedGame(idList);
    } else {
      buildImportedGame(fullDataString);
    }
  } catch {
    setTimeout(function () {
      importUserCreatedGame(id, index, errorCount + 1);
    }, 1000);
  }
}

async function uploadUserCreatedGame(data, index = 0, errorCount = 0) {
  if (errorCount > 5) {
    console.log('upload failed');
    displayPopup("Code Fetch Failed<br><br>Please try again later when internet connection is more stable.", "Exit");
    return;
  }
  if (index >= data.length) {
    // there are no more items in the data list
    return [];
  }

  try {
    var url = 'https://tinyurl.com/api-create.php?url=' + location.href + '?s=' + data[index];
    const response = await fetch(url);
    const tinyURL = await response.text();
    var parts = tinyURL.split("/");
    var id = parts[parts.length - 1];
    var idList = await uploadUserCreatedGame(data, index + 1);
    idList.unshift(id); // add the first id to the fron tof the list
    if (index != 0) {
      return idList;
    } else {
      // if the length of the idList is 1, display the popup
      if (idList.length == 1) {
        displayPopup("Your Shareable Code:<br><br><b style='font-size: 150%;'>" + id + "</b>", "Close", "Copy Code", function () {
          // Create a temporary input element to copy the code to the clipboard
          var tempInput = document.createElement('input');
          tempInput.value = id;
          tempInput.classList = "hidden";
          document.body.appendChild(tempInput);
          tempInput.select();
          tempInput.setSelectionRange(0, 99999); // For mobile devices
          navigator.clipboard.writeText(tempInput.value);
          tempInput.remove();
          // change the continue text
          var continueBtn = preventInput.querySelector("div.blueGradient");
          continueBtn.innerText = "Copied!";
          // generate an error to prevent the window from closing after copying
          throw new Error('This is expected behavior. Please Ignore. Window prevented from closing');
        });
      } else {
        // the length of the list is greater than 1
        // convert the list to a string
        var string = JSON.stringify(idList);
        var urlEncoded = encodeURIComponent(string);
        var newData = "ListOfTinyUrlCodes" + urlEncoded;
        // split the encoded data into chunks if it is too large
        var chunkSize = 12000;
        var dataList = [];
        for (var i = 0; i < newData.length; i += chunkSize) {
          dataList.push(newData.slice(i, i + chunkSize));
        }

        uploadUserCreatedGame(dataList);
      }
    }
  } catch {
    setTimeout(function () {
      uploadUserCreatedGame(data, index, errorCount + 1);
    }, 1000);
  }
}

function createGame(addToFaves = false) {
  var title = document.getElementById('gameTitle').value.trim();
  var description = document.getElementById('description').value.trim();
  var cards = document.getElementById('enterCards').value;

  if (title == "" || description == "" || cards.trim() == "") {
    var message = "All fields are required.<br><br>Please make sure nothing is left blank.";
    displayPopup(message, 'Okay');
    throw new Error("All fields are required to create or update a set.");
  }

  // split the cards into a list and remove the whitespace
  var cardsList = cards.split("\n");
  for (var i = 0; i < cardsList.length; i++) {
    cardsList[i] = cardsList[i].trim();
    if (cardsList[i] == "") {
      // remove the item by splicing it
      cardsList.splice(i, 1);
      // adjust the index because the size of the list changed
      i--;
    }
  }

  // get current date
  var currentDate = new Date();
  var year = currentDate.getFullYear().toString().substr(-2); // Last two digits of the year
  var month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 because months are zero-based
  var day = currentDate.getDate().toString().padStart(2, '0');
  var hours = currentDate.getHours().toString().padStart(2, '0');
  var minutes = currentDate.getMinutes().toString().padStart(2, '0');
  var seconds = currentDate.getSeconds().toString().padStart(2, '0');
  var milliseconds = currentDate.getMilliseconds().toString().padStart(3, '0');
  var dateString = year + month + day + hours + minutes + seconds + milliseconds;

  // create the id for the game from the title and current date
  var gameID = title.replace(/ /g, '-') + dateString;

  var dict = {
    "title": title,
    "description": description,
    "games": {
      "Play": cardsList
    },
    "color": selectedColor,
    "id": gameID
  }

  // try to store the user created game if the storage isn't full
  try {
    storeUserCreatedGame(dict);
    generateUserCreatedGame(dict);
    if (addToFaves == true) {
      toggleHeart(gameID);
    }
  } catch {
    displayPopup("Failed.<br><br> User storage is full. Please remove some user-created games to make a new one.", "Okay");
  }
}

function shareGame(id) {
  displayLoadingPopup("Generating Shareable Code");
  var gameDict = getUserCreatedGame(id);
  var string = JSON.stringify(gameDict);
  var urlEncoded = encodeURIComponent(string);

  // split the encoded data into chunks if it is too large
  var chunkSize = 8000;
  var dataList = [];
  for (var i = 0; i < urlEncoded.length; i += chunkSize) {
    dataList.push(urlEncoded.slice(i, i + chunkSize));
  }

  uploadUserCreatedGame(dataList);
}

function buildImportedGame(data) {
  var gameDict = JSON.parse(decodeURIComponent(data));
  var id = gameDict['id'];
  var name = gameDict['title'];
  var storedGame = getUserCreatedGame(id);
  if (storedGame != undefined) {
    displayPopup("This game already exists in your library.<br><br><b>" + name + "</b><br><br>It will not be added again.", "Okay");
    return;
  }

  // try to store the user made game if the storage isn't full
  try {
    storeUserCreatedGame(gameDict);
    generateUserCreatedGame(gameDict);
    displayPopup("Success!<br><br>" + name + " was imported successfully!", "Great!");
  } catch {
    displayPopup("Failed.<br><br> User storage is full. Please remove some user-created games to make a new one.", "Okay");
  }
}

function generateUserCreatedGame(dict) {
  // create the game card for a user created game
  var gameID = dict['id'];
  var title = dict['title'];
  var des = dict['description'];

  // make a container for it first so that we can set the onclick event as part of the html
  var container = document.createElement('div');
  container.innerHTML = '<div onclick="requestPermission(); gamesDict=getUserCreatedGame(\'' + gameID + '\')[\'games\']; buildGamePreview(\'' + title + '\', \'' + des + '\');"></div>';
  var mainDiv = container.firstChild;
  mainDiv.classList = "gameCard " + dict['color'];
  mainDiv.id = gameID;
  mainDiv.onclick = function () {
    //first, request permission to use the device's orientation
    requestPermission();
    var cardDict = getUserCreatedGame(gameID);
    gamesDict = cardDict['games'];
    buildGamePreview(title, des);
  };
  // create heart div
  var tempHeartContainer = document.createElement('div');
  tempHeartContainer.innerHTML = '<div onclick="toggleHeart(\'' + gameID + '\'); event.stopPropagation();"><img src="icons/general/heart-outline.svg" style="display: inline; width: 1em;" alt="heart" class="invertable-image"></div>';
  var heartDiv = tempHeartContainer.firstChild;
  // create the dropdown menu
  var dropDown = makeDropDownMenu(gameID);
  // create image
  var image = document.createElement('img');
  image.src = "icons/masked.png";
  image.alt = "icon";
  image.classList = "noInvert";
  // create title div
  var titleDiv = document.createElement('div');
  titleDiv.innerText = title;

  // append the elements to the main div
  mainDiv.appendChild(heartDiv);
  mainDiv.appendChild(dropDown);
  mainDiv.appendChild(image);
  mainDiv.appendChild(titleDiv);

  // append mainDiv to create page
  var createPage = document.getElementById('create');
  var buffer = createPage.querySelector('.buffer');
  createPage.insertBefore(mainDiv, buffer);

  // adjust the stretch element after adding a new game card
  controlStretch(createPage);

  // exit the create screen
  discardSet();
}

function storeUserCreatedGame(dict) {
  var gamesDict = getAllUserCreatedGames();
  var gameID = dict['id'];
  gamesDict[gameID] = dict;
  setUserCreatedGames(gamesDict);
}

function getAllUserCreatedGames() {
  var games = localStorage.getItem("userCreatedGames");
  if (games !== null) {
    return JSON.parse(games);
  }
  return {};
}

function setUserCreatedGames(gamesDict) {
  var string = JSON.stringify(gamesDict);
  localStorage.setItem("userCreatedGames", string);
}

function removeUserCreatedGame(idToRemove) {
  var gamesDict = getAllUserCreatedGames();
  delete gamesDict[idToRemove];
  setUserCreatedGames(gamesDict);
}

function getUserCreatedGame(id) {
  var gamesDict = getAllUserCreatedGames();
  var game = gamesDict[id];
  return game;
}

function buildAllUserCreatedGames() {
  // this function should be run when the app starts, it gets all user created games from localstorage and builds them
  var dict = getAllUserCreatedGames();
  for (var key in dict) {
    var value = dict[key];
    generateUserCreatedGame(value);
  }
}

function makeDropDownMenu(gameID) {
  // create a sub-function to create the table rows and cells
  function makeRowCells(title, clickFunction) {
    var row = document.createElement('tr');
    row.onclick = function () {
      clickFunction(gameID);
      event.stopPropagation();
    };
    var cell1 = document.createElement('th');
    cell1.innerText = title;
    var cell2 = document.createElement('td');
    cell2.style.display = "flex";
    cell2.style.alignItems = "center";
    cell2.innerHTML = '<img src="icons/general/' + title.toLowerCase() + '.svg" style="display: inline; width: 1em;" alt="img-mail" class="invertable-image">';
    row.appendChild(cell1);
    row.appendChild(cell2);
    return row;
  }

  var dropDown = document.createElement('div');
  dropDown.classList = "dropDownButton";
  dropDown.innerHTML = '<img src="icons/general/dropdown-menu.svg" style="display: inline; width: 1em;" alt="dropdown-menu" class="invertable-image">';
  dropDown.onclick = function () {
    toggleDropDown(gameID);

    // Add event listener to detect if user clicked outside of menu
    document.addEventListener("click", function handleClickOutsideMenu(evt) {
      // Check if the target element or any of its ancestors have the 'dropDownMenu' class
      if (evt.target.closest(".dropDownMenu") || evt.target.closest(".dropDownButton")) {
        // This is a click inside the dropdown menu, do nothing
        //console.log("Clicked inside menu!");
        return;
      }
      // This is a click outside the dropdown menu
      //console.log("Clicked outside menu!");
      // toggle the DropDown menu again
      toggleDropDown(gameID);
      // Remove the event listener after the first click outside the menu
      document.removeEventListener("click", handleClickOutsideMenu, true);
    }, true);

    // stop other events in parent elements from executing
    event.stopPropagation();
  };
  // make table
  var table = document.createElement('table');
  table.classList = "dropDownMenu light-or-dark hidden";
  var tbody = document.createElement('tbody');
  table.appendChild(tbody);
  var shareBtn = makeRowCells('Share', shareGame);
  var editBtn = makeRowCells('Edit', editGame);
  var deleteBtn = makeRowCells('Delete', deleteGame);
  tbody.appendChild(shareBtn);
  tbody.appendChild(editBtn);
  tbody.appendChild(deleteBtn);
  dropDown.appendChild(table);
  return dropDown;
}

function toggleDropDown(gameID) {
  var gameCard = document.getElementById(gameID);
  var menu = gameCard.querySelector('.dropDownMenu');
  menu.classList.toggle('hidden');
}

function editGame(id) {
  // get details about the old game and add its attributes to the create page
  var dict = getUserCreatedGame(id);
  var titleInput = document.getElementById('gameTitle');
  var descriptionInput = document.getElementById('description');
  var cardsInput = document.getElementById('enterCards');
  titleInput.value = dict['title'];
  descriptionInput.value = dict['description'];
  cardsInput.value = dict['games']['Play'].join("\n");

  // set the color to the current game's color
  selectColor(dict['color']);

  // check to see if the current game is on the favorites list
  var favesList = getFavorites();
  if (favesList.includes(id)) {
    var addToFavesImmediately = true;
  } else {
    var addToFavesImmediately = false;
  }

  // change the details of the create page
  var titleLabel = document.querySelector('label[for="gameTitle"]');
  var createButton = document.querySelector("#create-page > div:nth-child(2) > div:nth-child(4) > div.blueGradient");
  var originalTitleLabelText = titleLabel.innerText;
  var originalCreateButtonText = createButton.innerText;
  titleLabel.innerText = "Title of Current Set:";
  createButton.innerText = "Update Game";
  createButton.onclick = function () {
    createGame(addToFavesImmediately);
    deleteGame(id, false);
    // change the title text, the button text, and the button function back to normal
    titleLabel.innerText = originalTitleLabelText;
    createButton.innerText = originalCreateButtonText;
    createButton.onclick = createGame;
  };

  // change the cancel button's onclick event too
  var cancelButton = document.querySelector("#create-page > div:nth-child(2) > div:nth-child(4) > div.redGradient");
  cancelButton.onclick = function () {
    // change the title text, the button text, and the button function back to normal
    titleLabel.innerText = originalTitleLabelText;
    createButton.innerText = originalCreateButtonText;
    createButton.onclick = createGame;
    cancelButton.onclick = discardSet;
    discardSet();
  };

  // reveal the create-page
  var page = document.getElementById('create-page');
  page.classList.remove('hidden');

  // allow the cards text box and description input to scroll again
  var cardsTextBox = document.querySelector("#enterCards");
  allowScroll(cardsTextBox);
  var descriptionTextBox = document.querySelector("#description");
  allowScroll(descriptionTextBox);
}

function deleteGame(id, confirm = true) {
  if (confirm == true) {
    var message = "Are you sure you want to delete this game?<br><br>This action cannot be undone.";
    displayPopup(message, "Cancel", "Delete Game", deleteGame, id, false);
    return;
  }
  // delete game from user created games list
  removeUserCreatedGame(id);
  // delete the element from the page
  var element = document.getElementById(id);
  element.remove();
  // remove it from the favorites list
  removeFavorites(id);
  // adjust the stretch element
  var createPage = document.getElementById('create');
  controlStretch(createPage);
}









// functions for settings page

function getSettings() {
  var settings = localStorage.getItem("settings");
  if (settings !== null) {
    return JSON.parse(settings);
  }
  return {};
}

function setSettings(dict) {
  var string = JSON.stringify(dict);
  localStorage.setItem("settings", string);
}

function setDefaultTimer(seconds) {
  const selectedTimers = document.getElementsByClassName('timerOption');
  // Loop through the collection and remove the 'selectedTimer' class from each element
  for (let i = 0; i < selectedTimers.length; i++) {
    const element = selectedTimers[i];
    if (element.innerText == seconds + 's') {
      element.classList.add('selectedTimer');
      var settings = getSettings();
      settings["default-timer"] = seconds;
      setSettings(settings);
      defaultTimer = seconds;
    } else {
      element.classList.remove('selectedTimer');
    }
  }
}

function displaySettingsPage() {
  // display the correct default timer
  var time = getSettings()["default-timer"];
  if (time == undefined) {
    var defaultTime = 60;
  } else {
    var defaultTime = time;
  }
  setDefaultTimer(defaultTime);

  // make the page visible
  hideOtherElements("settings");
}





function installPrompt() {
  if (!isRunningStandalone()) {
    if (isiOS()) {
      // prompt to install on iOS
      var message = '<h1>Welcome to Guess What?!</h1><p>The experience is better with the App!</p><p>Download it by tapping the share button <img src="icons/general/share.svg" style="display: inline; width: 1.5em;" alt="share-icon" class="invertable-image"/> below, then tap on "Add to Home Screen"</p>';
      displayPopup(message, "Stay On The Web");
    } else if (!isiOS()) {
      // prompt to install on Android
      var message = "<h1>Welcome to Guess What?!</h1>The experience is better with the App!<br><br>To install the Web App please click the install button below.";
      displayPopup(message, "Stay On Web", "Install", function () {
        // install the PWA
        deferredPrompt.prompt();
      });
    }
  }
}





function setPreferedTheme(theme) {
  // set which theme the user prefers
  localStorage.setItem("theme", theme);
  changeTheme(theme);
}

function switchThemeBtn(theme) {
  var themeOptions = document.querySelectorAll('.themeOption');

  themeOptions.forEach(option => {
    if (option.innerText == theme) {
      option.classList.add('selectedTheme');
    } else {
      option.classList.remove('selectedTheme');
    }
  });
}

// Define the listener function
function themeChangeListener(e) {
  var newTheme = e.matches ? "dark" : "light";
  //console.log('changing theme to' + newTheme);
  changeTheme(newTheme, true);
};

function changeTheme(theme = null, listen = false) {
  if (theme == null) {
    // get theme from local storage
    var theme = localStorage.getItem("theme");
    if (theme !== null) {
      changeTheme(theme);
    } else {
      changeTheme('auto');
    }
    return;
  } else if (theme == "light") {
    var metaTag = document.querySelector('meta[name="theme-color"]');
    metaTag.setAttribute('content', 'white');
    var html = document.querySelector("html");
    html.classList = "light-mode";
    switchThemeBtn('Light');
  } else if (theme == "dark") {
    var metaTag = document.querySelector('meta[name="theme-color"]');
    metaTag.setAttribute('content', 'black');
    var html = document.querySelector("html");
    html.classList = "dark-mode";
    switchThemeBtn('Dark');
  } else {
    //theme must be auto
    var prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    var currentTheme = prefersDarkScheme.matches ? "dark" : "light";
    changeTheme(currentTheme, true);
    windowMedia.addEventListener('change', themeChangeListener);
    switchThemeBtn('Auto');
    return;
  }

  if (listen == false) {
    // remove the listener
    windowMedia.removeEventListener('change', themeChangeListener);
  }
}





function toggleSoundEffects(boolean) {
  localStorage.setItem("playSoundEffects", boolean);

  if (boolean == "true") {
    var text = "On";
  } else {
    var text = "Off";
  }

  var soundEffectOptions = document.querySelectorAll('.soundEffectOption');

  soundEffectOptions.forEach(option => {
    if (option.innerText == text) {
      option.classList.add('selectedSoundEffect');
    } else {
      option.classList.remove('selectedSoundEffect');
    }
  });
}


function playCorrectSound() {
  var settings = localStorage.getItem("playSoundEffects");
  if (settings !== null && settings == "false") {
    return;
  }
  var audio = document.getElementById('correctSound');
  audio.play();
}

function playPassSound() {
  var settings = localStorage.getItem("playSoundEffects");
  if (settings !== null && settings == "false") {
    return;
  }
  var audio = document.getElementById('passSound');
  audio.play();
}

function playCountSound() {
  var settings = localStorage.getItem("playSoundEffects");
  if (settings !== null && settings == "false") {
    return;
  }
  var audio = document.getElementById('countSound');
  audio.play();
}





let deferredPrompt;

window.addEventListener('beforeinstallprompt', function (e) {

  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();

  // Stash the event so it can be triggered later.
  deferredPrompt = e;
});


function main() {
  // set some global variables
  lockAnswer = false;
  waitingForLockAnswer = false;
  windowMedia = window.matchMedia("(prefers-color-scheme: dark)");

  // call functions that should run immediately upon load
  buildAllUserCreatedGames();
  markFavorites();
  installPrompt();
  changeTheme();

  // allow the main games element to scroll upon load because sometimes it does not automatically scroll
  var allGamesElem = document.getElementById('allGames');
  allowScroll(allGamesElem);

  // Add event listener for changes in orientation to adjust the stretch element
  window.addEventListener('orientationchange', function () {
    var currentElement = document.querySelector('.grid-container:not(.hidden)');
    controlStretch(currentElement);
  });

  // get the default timer
  var time = getSettings()["default-timer"];
  if (time == undefined) {
    defaultTimer = 60;
  } else {
    defaultTimer = time;
  }

  // adjust the option for sound effects so it displays correctly
  var soundBool = localStorage.getItem("playSoundEffects");
  toggleSoundEffects(soundBool);
}
main();