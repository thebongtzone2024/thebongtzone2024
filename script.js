function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

// Simulate OTP verification
setTimeout(() => {
  document.getElementById("otp-status").innerText = "OTP Verified Successfully!";
}, 3000);
// Firebase Auth Logic
const auth = firebase.auth();
let confirmationResult, timerInterval;

document.getElementById('menuBtn').onclick = () => {
  const dropdown = document.getElementById('dropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
};

window.onload = () => {
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'normal',
    callback: () => {
      document.getElementById('status').innerText = "Recaptcha ready!";
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
    })
    .catch(error => {
      document.getElementById('status').innerText = error.message;
    });
}

function verifyOTP() {
  const code = document.getElementById('otp').value;
  const email = document.getElementById('email').value;

  confirmationResult.confirm(code).then(result => {
    if (email === "thebongtzone2024@gmail.com") {
      alert("Admin logged in!");
      window.location.href = "admin-dashboard.html";
    } else {
      alert("Buyer logged in!");
      document.getElementById('thankyou').style.display = "block";
    }
  }).catch(() => {
    document.getElementById('status').innerText = "Incorrect OTP!";
  });
}

function startTimer() {
  let timeLeft = 30;
  const countdown = document.getElementById('countdown');
  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      countdown.innerText = `Resend in ${timeLeft}s`;
      timeLeft--;
    } else {
      clearInterval(timerInterval);
      countdown.innerText = "You can resend OTP";
    }
  }, 1000);
}

function closeThankYou() {
  document.getElementById('thankyou').style.display = 'none';
}

function showLogin() {
  document.getElementById('otp-box').scrollIntoView({ behavior: 'smooth' });
}
