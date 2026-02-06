/**************************************************
 * AUTH (GoKwik OTP + Supabase)
 **************************************************/

const phoneInput = document.getElementById("phoneInput");
const otpInput = document.getElementById("otpInput");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const phoneStep = document.getElementById("phoneStep");
const otpStep = document.getElementById("otpStep");
const authMsg = document.getElementById("authMsg");

let currentPhone = null;

// ============================
// SEND OTP (GoKwik)
// ============================
sendOtpBtn?.addEventListener("click", async () => {
  const phone = phoneInput.value.trim();

  if (!/^[6-9]\d{9}$/.test(phone)) {
    authMsg.textContent = "Enter valid Indian phone number";
    return;
  }

  authMsg.textContent = "Sending OTP...";
  currentPhone = phone;

  const { error } = await supabaseClient.functions.invoke(
    "gokwik-send-otp",
    { body: { phone } }
  );

  if (error) {
    authMsg.textContent = "Failed to send OTP";
    return;
  }

  phoneStep.style.display = "none";
  otpStep.style.display = "block";
  authMsg.textContent = "OTP sent";
});

// ============================
// VERIFY OTP (GoKwik → Supabase)
// ============================
verifyOtpBtn?.addEventListener("click", async () => {
  const otp = otpInput.value.trim();

  if (!otp) {
    authMsg.textContent = "Enter OTP";
    return;
  }

  authMsg.textContent = "Verifying OTP...";

  const { data, error } = await supabaseClient.functions.invoke(
    "gokwik-verify-otp",
    {
      body: {
        phone: currentPhone,
        otp
      }
    }
  );

  if (error || !data?.success) {
    authMsg.textContent = "Invalid OTP";
    return;
  }

  // create/login user in Supabase
  await supabaseClient.auth.signInWithPassword({
    email: `${currentPhone}@otp.local`,
    password: currentPhone
  }).catch(async () => {
    await supabaseClient.auth.signUp({
      email: `${currentPhone}@otp.local`,
      password: currentPhone
    });
  });

  authMsg.textContent = "Login successful";
  setTimeout(closeAuthModal, 800);
});
