const socket = io();

//  Elements
const $messageForm = document.querySelector("#formMessage");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocation = document.querySelector("#loaction");
const $messages = document.querySelector("#messages");

// Templates
const messagesTemplate = document.getElementById("message-template").innerHTML;
const locationTemplate = document.getElementById("location-template").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Auto Scroll
const autoScroll = () => {
  // New Message
  const $newMessage = $messages.lastElementChild;

  //Height Of New Message
  const newMessageStyle = getComputedStyle($newMessage).marginBottom;
  const numberNewMessageStyle = parseInt(newMessageStyle); // Convert From Px To Number
  const HeigthOfNewMessage = $newMessage.offsetHeight + numberNewMessageStyle;

  // Visible Height
  const visibleHeight = $messages.offsetHeight;

  //Height Of Meesages Container
  const containerHeight = $messages.scrollHeight;

  //How Far  Have I Scroll
  const scrollOffset = $messages.scrollTop + visibleHeight;

  //Auto Scroll To Buttom
  if (containerHeight - HeigthOfNewMessage <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

//--------------------------------------------------
socket.on("userMessage", (msg) => {
  //Render Template
  const html = Mustache.render(messagesTemplate, {
    username: msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format("ddd h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

//--------------------------------------------------
socket.on("userLocation", (msg) => {
  //Render Template
  const html = Mustache.render(locationTemplate, {
    username: msg.username,
    locatin: msg.url,
    createdAt: moment(msg.createdAt).format("ddd h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});
//--------------------------------------------------

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.getElementById("sidebarUsers").innerHTML = html;
});
//--------------------------------------------------

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  //Disable Form
  $messageFormButton.setAttribute("disabled", "disabled");

  //Send to Server
  const inputText = e.target.elements.sendMsg.value;

  socket.emit("sendMsg", inputText, (error) => {
    // Enable Form
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log("Can't Send");
    }
  });
});

//--------------------------------------------------

$sendLocation.addEventListener("click", (e) => {
  if (!navigator.geolocation) {
    return alert("Geolocation Not Supported");
  }

  //Disable
  $sendLocation.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendlocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        // Enable
        $sendLocation.removeAttribute("disabled");

        console.log("Location Shared");
      }
    );
  });
});
//--------------------------------------------------

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
