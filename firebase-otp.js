// Firebase Init
const firebaseConfig = {
  apiKey: "AIzaSyCWzTfxRxpUqFlFmQ7tBXVC7Lwf9jRWR0s",
  authDomain: "the-bong-t-zone.firebaseapp.com",
  projectId: "the-bong-t-zone",
  appId: "1:339526750620:web:badfddfc6119f9b036f859",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let confirmationResult;
let timerInterval;

window.onload = () => {
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'normal',
    callback: () => {
      document.getElementById('status').innerText = "Recaptcha passed. You can now request OTP.";
    }
  });
};

function sendOTP() {
  const phone = document.getElementById('phone').value;
  auth.signInWithPhoneNumber(phone, window.recaptchaVerifier)
    .then(result => {
      confirmationResult = result;
      document.getElementById('otp-section').style.display = 'block';
      document.getElementById('status').innerText = "OTP sent!";
      startTimer();
      document.getElementById('resend-btn').disabled = true;
    })
    .catch(error => {
      document.getElementById('status').innerText = error.message;
    });
}

function verifyOTP() {
  const code = document.getElementById('otp').value;
  confirmationResult.confirm(code).then(result => {
    const user = result.user;
    const email = document.getElementById('email').value;

    if (email === "thebongtzone2024@gmail.com") {
      alert("Welcome Admin!");
      window.location.href = "/admin-dashboard.html";
    } else {
      alert("Welcome Buyer!");
      window.location.href = "/shop.html";
    }
  }).catch(error => {
    document.getElementById('status').innerText = "Incorrect OTP. Try again.";
  });
}

function startTimer() {
  let timeLeft = 30;
  const countdown = document.getElementById('countdown');
  const resendBtn = document.getElementById('resend-btn');
  resendBtn.disabled = true;

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      countdown.innerText = `Wait ${timeLeft}s to resend`;
      timeLeft--;
    } else {
      clearInterval(timerInterval);
      countdown.innerText = "You can resend OTP now";
      resendBtn.disabled = false;
    }
  }, 1000);
}

function resendOTP() {
  document.getElementById('status').innerText = "Sending new OTP...";
  sendOTP();
}
