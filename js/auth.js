(function () {
  "use strict";

  const USERS_KEY = "cccConnectUsers";
  const SETUP_EMAIL_KEY = "cccConnectProfileSetupEmail";
  const CCC_EMAIL_PATTERN = /^[^\s@]+@ccc\.edu\.ph$/i;
  const MAX_PHOTO_SIZE = 1.5 * 1024 * 1024;

  function getUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(users) ? users : [];
    } catch (error) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function setMessage(message, isSuccess) {
    const element = document.getElementById("form-message");
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("message-success", Boolean(isSuccess));
  }

  function normalizeEmail(email) {
    return email.trim().toLowerCase();
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  function hexToBytes(hex) {
    return new Uint8Array(hex.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
  }

  async function hashPassword(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error(
        "Secure password hashing is not available in this browser.",
      );
    }

    const saltBytes = salt
      ? hexToBytes(salt)
      : window.crypto.getRandomValues(new Uint8Array(16));
    const key = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await window.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes, iterations: 150000, hash: "SHA-256" },
      key,
      256,
    );

    return {
      salt: bytesToHex(saltBytes),
      passwordHash: bytesToHex(new Uint8Array(bits)),
    };
  }

  function togglePasswordVisibility() {
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (!input) return;
        const isVisible = input.type === "text";
        input.type = isVisible ? "password" : "text";
        button.textContent = isVisible ? "Show" : "Hide";
        button.setAttribute(
          "aria-label",
          isVisible ? "Show password" : "Hide password",
        );
      });
    });
  }

  function initLogin() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage("");

      const email = normalizeEmail(form.elements.email.value);
      const password = form.elements.password.value;
      if (!CCC_EMAIL_PATTERN.test(email)) {
        setMessage("Use your CCC email address ending in @ccc.edu.ph.");
        return;
      }

      const account = getUsers().find((user) => user.email === email);
      if (!account) {
        setMessage("No account was found. Create your CCC account first.");
        return;
      }

      try {
        const result = await hashPassword(password, account.salt);
        if (result.passwordHash !== account.passwordHash) {
          setMessage("That password does not match this account.");
          return;
        }
        if (!account.profileComplete) {
          sessionStorage.setItem(SETUP_EMAIL_KEY, email);
          window.location.href = "profile.html";
          return;
        }
        sessionStorage.setItem("cccConnectSignedInEmail", email);
        setMessage("Signed in successfully.", true);
      } catch (error) {
        setMessage(
          error.message || "Sign in could not be completed in this browser.",
        );
      }
    });
  }

  function initRegister() {
    const form = document.getElementById("register-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage("");

      const email = normalizeEmail(form.elements.email.value);
      const password = form.elements.password.value;
      const confirmation = form.elements["confirm-password"].value;
      if (!CCC_EMAIL_PATTERN.test(email)) {
        setMessage(
          "Only CCC email addresses ending in @ccc.edu.ph are accepted.",
        );
        return;
      }
      if (password.length < 8) {
        setMessage("Your password must be at least 8 characters.");
        return;
      }
      if (password !== confirmation) {
        setMessage("The passwords do not match.");
        return;
      }

      const users = getUsers();
      if (users.some((user) => user.email === email)) {
        setMessage(
          "An account with this email already exists. Sign in instead.",
        );
        return;
      }

      try {
        const credentials = await hashPassword(password);
        users.push({
          email,
          salt: credentials.salt,
          passwordHash: credentials.passwordHash,
          profileComplete: false,
          profile: null,
        });
        saveUsers(users);
        sessionStorage.setItem(SETUP_EMAIL_KEY, email);
        window.location.href = "profile.html";
      } catch (error) {
        setMessage(
          error.message || "Your account could not be created in this browser.",
        );
      }
    });
  }

  function initForgotPassword() {
    const form = document.getElementById("forgot-password-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setMessage("");

      const email = normalizeEmail(form.elements.email.value);
      if (!CCC_EMAIL_PATTERN.test(email)) {
        setMessage("Enter your CCC email address ending in @ccc.edu.ph.");
        return;
      }

      window.location.href = "reset-password.html";
    });
  }

  function readPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.addEventListener("error", () =>
        reject(new Error("The selected photo could not be read.")),
      );
      reader.readAsDataURL(file);
    });
  }

  function initProfile() {
    const email = sessionStorage.getItem(SETUP_EMAIL_KEY);
    const users = getUsers();
    const accountIndex = users.findIndex((user) => user.email === email);
    if (!email || accountIndex < 0) {
      window.location.replace("login.html");
      return;
    }

    const form = document.getElementById("profile-form");
    const photoInput = document.getElementById("profile-photo");
    const photoImage = document.getElementById("photo-image");
    const photoPlaceholder = document.getElementById("photo-placeholder");
    let photoData = "";

    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        photoInput.value = "";
        setMessage("Choose an image file for your profile photo.");
        return;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        photoInput.value = "";
        setMessage("Choose a photo smaller than 1.5 MB.");
        return;
      }

      photoData = "";
      photoImage.src = URL.createObjectURL(file);
      photoImage.hidden = false;
      photoPlaceholder.hidden = true;
      setMessage("");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage("");

      const age = Number(form.elements.age.value);
      if (
        !form.elements.surname.value.trim() ||
        !form.elements["first-name"].value.trim() ||
        !form.elements.address.value.trim()
      ) {
        setMessage("Complete your surname, first name, and home address.");
        return;
      }
      if (!Number.isInteger(age) || age < 1 || age > 120) {
        setMessage("Enter an age between 1 and 120.");
        return;
      }

      const file = photoInput.files[0];
      try {
        if (file) photoData = await readPhoto(file);
        users[accountIndex].profile = {
          surname: form.elements.surname.value.trim(),
          firstName: form.elements["first-name"].value.trim(),
          middleName: form.elements["middle-name"].value.trim(),
          suffix: form.elements.suffix.value,
          age,
          address: form.elements.address.value.trim(),
          photo: photoData || null,
        };
        users[accountIndex].profileComplete = true;
        saveUsers(users);
        sessionStorage.removeItem(SETUP_EMAIL_KEY);
        window.location.href = "login.html";
      } catch (error) {
        setMessage(
          "Profile could not be saved. Try a smaller photo or another browser.",
        );
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    togglePasswordVisibility();
    const page = document.body.dataset.page;
    if (page === "login") initLogin();
    if (page === "register") initRegister();
    if (page === "profile") initProfile();
    if (page === "forgot-password") initForgotPassword();
  });
})();
