// declare some global variables
var appsScriptBaseUrl = 'https://script.google.com/macros/s/AKfycbyFDxOpK9tZyuQWtzqPV7zXe979LLQSk288L4p5kIizBDGcLKRPX9YMfbNveG2tvyZ9bw/exec';
var bgDict = {
  0: "https://i.imgur.com/V6FHjNl.jpeg",
  1: "https://i.imgur.com/e4bz6Rw.jpeg",
  2: "https://i.imgur.com/EaxfZw6.jpeg",
  3: "https://i.imgur.com/4mcscpP.jpeg",
  4: "https://i.imgur.com/qwRHfFO.jpeg",
  5: "https://i.imgur.com/Hqohrb4.jpeg",
  6: "https://i.imgur.com/acNxKVC.jpeg",
  7: "https://i.imgur.com/6pWQdRK.jpeg",
  8: "https://i.imgur.com/pUvs45B.jpeg",
  9: "https://i.imgur.com/kl1HthJ.jpeg",
  10: "https://i.imgur.com/uV1742U.jpeg",
  11: "https://i.imgur.com/sMh3Bzn.jpeg"
}

function main() {
  /* the main function */

  // add event listeners
  addListeners();

  // constantly update the time
  updateTime()
  setInterval(updateTime, 1000);

  // add all the apps to the app container
  getAllApps();

  // add the users to the userDrawer
  placeUsersInDrawer();

  // adjust the theme and preferences from the local storage
  adjustPreferences();

  // add the background images to the settings menu
  addBackgroundImages();
}

function updateTime() {
  /* update the time to the current time */
  var timeElement = document.getElementById('time');
  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var period = hours >= 12 ? 'PM' : 'AM';

  // convert to 12 hour format
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;

  timeElement.textContent = hours + ":" + minutes + " " + period;
}

function toggleSettingsMenu() {
  /* displays the settings menu */
  var settingsMenu = document.getElementById('settingsMenu');
  settingsMenu.classList.toggle('offScreen');

  adjustDropdowns();
}

function changeTheme(theme) {
  /* changes the theme of the page using colors or images */

  var body = document.querySelector('body');

  if (theme.includes('picture-')) {
    // use the specified picture
    var num = theme.match(/\d+/)[0];
    var url = bgDict[num];

    //body.style.backgroundImage = "url('" + url + "')";
    document.documentElement.style.setProperty('--bg-image', "url('" + url + "')");
    setLocalStorage('preferences.bgImage', theme);

  } else if (theme.includes('linear-gradient')) {
    // use the specified gradient
    //body.style.backgroundImage = theme;
    document.documentElement.style.setProperty('--bg-image', theme);
    setLocalStorage('preferences.bgImage', theme);

  } else if (theme.includes('none')) {
    // remove the background image
    //body.style.backgroundImage = '';
    document.documentElement.style.setProperty('--bg-image', '');
    setLocalStorage('preferences.bgImage', 'none');

  } else {
    // use the specified color
    document.documentElement.style.setProperty('--bg-color', theme);
    setLocalStorage('preferences.bgColor', theme);
  }
}

function changeAccentColor(color) {
  /* change the color of the text and borders */
  document.documentElement.style.setProperty('--accent-color', color);

  setLocalStorage('preferences.accentColor', color);
}

function adjustPreferences() {
  /* adjusts the preferences to the ones stored in the local storage */

  var appsPerRow = getLocalStorage('preferences.appsPerRow');
  if (appsPerRow) {
    document.documentElement.style.setProperty('--apps-per-row', appsPerRow);
  }

  var accentColor = getLocalStorage('preferences.accentColor');
  if (accentColor) {
    changeAccentColor(accentColor);
  }

  var bgImage = getLocalStorage('preferences.bgImage');
  if (bgImage) {
    changeTheme(bgImage);
  }

  var bgColor = getLocalStorage('preferences.bgColor');
  if (bgColor) {
    changeTheme(bgColor);
  }
}

function addListeners() {
  /* adds listeners of all sorts */

  // add a listener for the appsPerRow input
  var appsPerRowInput = document.getElementById('appsPerRow');
  appsPerRowInput.addEventListener('input', function() {
    console.log('hi')
    var appsPerRow = parseInt(appsPerRowInput.value, 10);
    document.documentElement.style.setProperty('--apps-per-row', appsPerRow);
  });

  // add listener for when the Add App button is pressed
  document.getElementById("addAppContainer").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevents the page from reloading
    // Your code to handle form submission goes here
    console.log("Form submitted!");
    addNewApp();
  });


  // add listener for when the Delete App button is pressed
  document.getElementById("deleteAppContainer").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevents the page from reloading
    // Your code to handle form submission goes here
    console.log("Form submitted!");
    deleteApp();
  });

  // add listener for when the Add User button is pressed
  document.getElementById("addUserContainer").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevents the page from reloading
    // Your code to handle form submission goes here
    console.log("Form submitted!");
    addNewUser();
  });

  // add listener for when the Delete User button is pressed
  document.getElementById("deleteUserContainer").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevents the page from reloading
    // Your code to handle form submission goes here
    console.log("Form submitted!");
    deleteUser();
  });

  // add listener for when the Recover App button is pressed
  document.getElementById("recoverAppContainer").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevents the page from reloading
    // Your code to handle form submission goes here
    console.log("Form submitted!");
    recoverApp();
  });

}

function changeAppsPerRow(num) {
  /* increments or decrements the number or apps per row */
  var appsPerRowInput = document.getElementById('appsPerRow');
  var appsPerRow = parseInt(appsPerRowInput.value, 10);
  var newAppsPerRow = appsPerRow + num;

  if (newAppsPerRow < 1 || newAppsPerRow > 8) {
    return;
  }

  appsPerRowInput.value = newAppsPerRow;
  document.documentElement.style.setProperty('--apps-per-row', newAppsPerRow);

  setLocalStorage('preferences.appsPerRow', newAppsPerRow);
}

function showNotification(message, duration = 5000) {
  // Check if a notification already exists and remove it
  let existingNotification = document.getElementById("notification-container");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create the notification element
  let notification = document.createElement("div");
  notification.id = "notification-container";
  notification.textContent = message;
  document.body.appendChild(notification);

  // Slide down animation
  setTimeout(() => {
    notification.style.top = "20px"; // Slide into view
  }, 10);

  // Remove the notification after duration
  setTimeout(() => {
    notification.style.top = "-60px"; // Slide out
    setTimeout(() => {
      notification.remove(); // Remove from DOM after animation
    }, 500);
  }, duration);
}

function addNewApp() {
  /* adds a new app to the home screen and the local storage */

  var appName = document.querySelector("#newAppTitle").value.trim();
  var launchUrl = document.querySelector("#newAppUrl").value.trim();
  var imageUrl = document.querySelector("#newAppImage").value.trim();
  var askForUser = document.querySelector("#askForUserTrue").checked;

  var newAppDict = {
    "name": appName,
    "launchUrl": launchUrl,
    "imageUrl": imageUrl,
    "askForUser": askForUser,
    "defaultApp": false
  };

  var currentApps = getLocalStorage('apps') || [];

  // check to see if that app is already on the list
  var alreadyInApps = currentApps.some(d => d.name === appName);
  if (alreadyInApps) {
    showNotification('Error: that app is already on this device.');
    return;
  }

  currentApps.push(newAppDict);
  setLocalStorage('apps', currentApps);

  addApp(appName, launchUrl, imageUrl, askForUser);

  showNotification('Successfully added new app!');

  document.querySelector("#newAppTitle").value = '';
  document.querySelector("#newAppUrl").value = '';
  document.querySelector("#newAppImage").value = '';
  document.querySelector("#askForUserTrue").checked = false;
  document.querySelector("#askForUserFalse").checked = false;

}

function addApp(name, launchUrl, imageUrl, askForUser) {
  /* adds an app with the specified details to the app container */

  var appsContainer = document.getElementById('appsContainer');
  var mainDiv = document.createElement('div');
  mainDiv.classList.add('app');
  mainDiv.dataset.appName = name;
  //mainDiv.onclick = "launchApp('" + launchUrl + "', " + askForUser + ")";
  mainDiv.onclick = function() {
    launchApp(launchUrl, askForUser);
  }

  // create the image
  var imgElem = document.createElement('img');
  imgElem.src = imageUrl;
  imgElem.alt = name + " Logo";

  // add the elements to the container
  mainDiv.appendChild(imgElem);
  appsContainer.appendChild(mainDiv);
}

function launchApp(launchUrl, askForUser) {
  /* launches the specified app and asks for the user if specified to do so */

  console.log(launchUrl)
  console.log(askForUser)

  if (askForUser) {
    var userDrawer = document.getElementById('userDrawer');
    userDrawer.classList.remove('offScreen');
    var preventInput = document.getElementById('preventInput');
    preventInput.classList.remove('hidden');

    var users = document.querySelectorAll('.userIcon');
    for (var i = 0; i < users.length; i++) {
      let user = users[i];
      let name = user.dataset.userName;
      user.onclick = function() {
        document.location.href = "launcher://firefox/" + name + "/" + launchUrl;
      };
    }
  } else {
    if (launchUrl.includes('https://')) {
      document.location.href = "launcher://firefox/Guest/" + launchUrl;
    } else {
      document.location.href = "launcher://" + launchUrl;
    }
  }
}

async function getAllApps(checkTheServer = false) {
  /* gets all of the apps from the server or from the local storage */

  if (checkTheServer) {
    // get all the apps from the server
    var url = appsScriptBaseUrl + "?exec=getApps";
    var response = await fetch(url);
    var data = await response.json();
    var serverApps = data.appsList;
  } else {
    var serverApps = [];
  }

  var localApps = getLocalStorage('apps') || [];
  console.log(localApps)

  var appsList = mergeAppLists(serverApps, localApps);
  console.log(appsList)

  // remove all the apps first
  var currentApps = document.querySelectorAll('.app');
  for (var i = 0; i < currentApps.length; i++) {
    currentApps[i].remove();
  }

  for (var i = 0; i < appsList.length; i++) {
    var dict = appsList[i];
    var name = dict['name'];
    var launchUrl = dict['launchUrl'];
    var imageUrl = dict['imageUrl'];
    var askForUser = dict['askForUser'];
    var removed = dict['removed'];
    if (!removed) {
      addApp(name, launchUrl, imageUrl, askForUser);
    }
  }

  setLocalStorage('apps', appsList);

  if (!checkTheServer) {
    getAllApps(true);
  }
}

function deleteApp() {
  /* deletes the specified app */

  var appToDeleteElem = document.querySelector("#appToDelete");
  var appToDelete = appToDeleteElem.value;

  var apps = getLocalStorage('apps');
  for (var i = 0; i < apps.length; i++) {
    var name = apps[i].name;
    var defaultApp = apps[i].defaultApp;
    if (name == appToDelete) {
      if (defaultApp) {
        apps[i].removed = true;
      } else {
        console.log('not default')
        apps.splice(i, 1);
      }
      break;
    }
  }

  setLocalStorage('apps', apps);
  adjustDropdowns();
  getAllApps();

}

function recoverApp() {
  /* recovers an app after being deleted */

  var recoverAppElem = document.querySelector("#appToRecover");
  var recoverAppName = recoverAppElem.value;

  var apps = getLocalStorage('apps');
  for (var i = 0; i < apps.length; i++) {
    var name = apps[i].name;
    if (name == recoverAppName) {
      apps[i].removed = false;
      break;
    }
  }

  setLocalStorage('apps', apps);
  adjustDropdowns();
  getAllApps();

}

function mergeAppLists(list1, list2) {
  const mergedMap = new Map();

  [...list1, ...list2].forEach(app => {
    const key = JSON.stringify({
      ...app,
      removed: undefined
    }); // Ignore "removed" for uniqueness

    if (!mergedMap.has(key) || app.removed) {
      mergedMap.set(key, app); // Store or replace with "removed": true version
    }
  });

  return Array.from(mergedMap.values());
}


function placeUsersInDrawer() {
  /* adds users to the user drawer */

  var guestDict = {
    "name": "Guest",
    "imgUrl": "https://i.imgur.com/m5oAfKK.jpeg"
  };

  // remove all users first
  var userElements = document.querySelectorAll('.userIcon');
  for (var i = 0; i < userElements.length; i++) {
    userElements[i].remove();
  }

  var users = getLocalStorage('users');
  console.log(users)
  if (users) {
    users.unshift(guestDict);
    console.log(users)
  } else {
    var users = [guestDict];
  }

  console.log(users)

  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var displayName = user.name.replace(/\./g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    var mainDiv = document.createElement('div');
    mainDiv.classList.add('userIcon');
    mainDiv.classList.add('button');
    mainDiv.dataset.userName = user.name;

    var imgElem = document.createElement('img');
    imgElem.src = user.imgUrl;
    imgElem.alt = user.name;

    var nameDiv = document.createElement('div');
    nameDiv.innerText = displayName;

    mainDiv.appendChild(imgElem);
    mainDiv.appendChild(nameDiv);
    var userDrawer = document.getElementById('userDrawer');
    userDrawer.prepend(mainDiv);
  }
}

function stringToHash(string) {
  // used to encrypt passwords, it converts a string to a hash value
  return string.split('').reduce((hash, char) => {
    return char.charCodeAt(0) + (hash << 6) + (hash << 16) - hash;
  }, 0);
}

async function addNewUser() {
  /* adds a new user to the local storage as well as firefox */

  var preventInputElem = document.getElementById('preventInput');
  preventInputElem.classList.remove('hidden');

  var usernameElem = document.querySelector("#newUserUsername");
  var passwordElem = document.querySelector("#newUserPassword");
  var username = usernameElem.value.trim();
  var passwordHash = stringToHash(passwordElem.value.trim());

  var users = getLocalStorage('users');
  if (!users) {
    var users = [];
  }
  var isAlreadyInList = users.some(d => d.name === username);

  if (isAlreadyInList) {
    showNotification('Error: that user is already added');
    preventInputElem.classList.add('hidden');
    return;
  }

  // make a request to the google apps script
  var url = appsScriptBaseUrl + "?exec=getUserProfileImage&username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(passwordHash);
  console.log(url)
  var response = await fetch(url);
  var data = await response.json();
  console.log(data)
  var imageUrl = data.profileImage;
  if (!imageUrl) {
    var errorMessage = data.error;
    showNotification("Error: " + errorMessage);
    preventInputElem.classList.add('hidden');
    return;
  }

  showNotification('Successfully added new user!');
  usernameElem.value = '';
  passwordElem.value = '';
  preventInputElem.classList.add('hidden');

  var newUserDict = {
    "name": username,
    "imgUrl": imageUrl
  };
  users.unshift(newUserDict);

  setLocalStorage('users', users);
  placeUsersInDrawer();
  adjustDropdowns();

}

function deleteUser() {
  /* deletes a user */

  var selectedUserElem = document.querySelector("#userToDelete");
  var selectedUser = selectedUserElem.value;

  console.log(selectedUser);
  var users = getLocalStorage('users') || [];

  var index = users.findIndex(user => user.name === selectedUser);
  if (index !== -1) {
    users.splice(index, 1);
  }

  setLocalStorage('users', users);

  showNotification('Successfully deleted user.');
  adjustDropdowns();
  placeUsersInDrawer();
}

function adjustDropdowns() {
  /* adds or removes items from the dropdowns on the settings page */

  var selectedUserElem = document.querySelector("#userToDelete");
  selectedUserElem.innerHTML = '<option value="" disabled selected>Select A User</option>';
  var selectedAppElem = document.querySelector("#appToDelete");
  selectedAppElem.innerHTML = '<option value="" disabled selected>Select An App</option>';
  var recoverAppElem = document.querySelector("#appToRecover");
  recoverAppElem.innerHTML = '<option value="" disabled selected>Select An App</option>';

  var users = getLocalStorage('users') || [];
  var apps = getLocalStorage('apps') || [];

  for (var i = 0; i < users.length; i++) {
    var username = users[i].name;
    selectedUserElem.innerHTML += '<option value="' + username + '">' + username + '</option>';
  }

  for (var i = 0; i < apps.length; i++) {
    var appName = apps[i].name;
    var removed = apps[i].removed;
    if (!removed) {
      selectedAppElem.innerHTML += '<option value="' + appName + '">' + appName + '</option>';
    } else {
      recoverAppElem.innerHTML += '<option value="' + appName + '">' + appName + '</option>';
    }
  }
}

function setLocalStorage(keyPath, value) {
  // this function sets the input value to the specified keypath of the FEC local storage item

  var fecDict = JSON.parse(localStorage.getItem('FEC'));
  if (!fecDict) {
    var fecDict = {};
  }

  // if there are no arguments, reset the local storage
  if (!keyPath && !value) {
    localStorage.setItem('FEC', JSON.stringify({}));
    return;
  }

  const parts = keyPath.split('.');
  const lastPart = parts.pop();

  const target = parts.reduce((acc, part) => {
    if (!acc[part]) {
      acc[part] = {}; // Create the nested object if it doesn't exist
    }
    return acc[part];
  }, fecDict);

  target[lastPart] = value;

  localStorage.setItem('FEC', JSON.stringify(fecDict));

}

function getLocalStorage(keyPath) {
  // this function gets the value of the specified keypath of the FEC local storage item
  var fecDict = JSON.parse(localStorage.getItem('FEC'));
  return keyPath.split('.').reduce((acc, part) => acc && acc[part], fecDict);
}

function closeUserDrawer() {
  /* closes the user drawer and remove the prevent input element */
  var userDrawer = document.getElementById('userDrawer');
  userDrawer.classList.add('offScreen');
  var preventInput = document.getElementById('preventInput');
  preventInput.classList.add('hidden');
}

function resetSettings() {
  /* resets the current page settings and refreshes the page */

  setLocalStorage('apps', []);
  setLocalStorage('users', []);
  setLocalStorage('preferences', {});

  window.location.href = window.location.href;
}

function showDesktop() {
  /* shows the users desktop by closing the current browser */

}

function addBackgroundImages() {
  /* adds the background images to the settings menu */

  var imagesContainer = document.querySelector("#imagesContainer");
  var imageElements = imagesContainer.children;
  for (var i = 0; i < imageElements.length; i++) {
    var url = bgDict[i];
    imageElements[i].src = url;
  }
}


main();