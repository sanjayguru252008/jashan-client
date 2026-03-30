import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   FIREBASE CONFIG
========================= */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   REVEAL ANIMATION
========================= */
const revealEls = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
    }
  });
}, { threshold: 0.12 });

revealEls.forEach((el) => observer.observe(el));

/* =========================
   CALORIE CALCULATOR
========================= */
const calculateBtn = document.getElementById("calculateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const calorieForm = document.getElementById("calorieForm");

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function calculateCalories() {
  const age = Number(getValue("age"));
  const gender = getValue("gender");
  const weight = Number(getValue("weight"));
  const height = Number(getValue("height"));
  const activity = Number(getValue("activity"));
  const goal = getValue("goal");

  if (!age || !weight || !height || !activity || !gender || !goal) {
    alert("Please fill all calorie calculator fields.");
    return null;
  }

  let bmr = 0;

  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const tdee = bmr * activity;
  let target = tdee;

  if (goal === "fat-loss") target = tdee - 400;
  if (goal === "muscle-gain") target = tdee + 250;

  const rounded = {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target: Math.round(target)
  };

  const bmrValue = document.getElementById("bmrValue");
  const tdeeValue = document.getElementById("tdeeValue");
  const targetValue = document.getElementById("targetValue");

  if (bmrValue) bmrValue.textContent = `${rounded.bmr} kcal`;
  if (tdeeValue) tdeeValue.textContent = `${rounded.tdee} kcal`;
  if (targetValue) targetValue.textContent = `${rounded.target} kcal`;

  const bmrField = document.getElementById("bmrField");
  const tdeeField = document.getElementById("tdeeField");
  const targetCaloriesField = document.getElementById("targetCaloriesField");

  if (bmrField) bmrField.value = rounded.bmr;
  if (tdeeField) tdeeField.value = rounded.tdee;
  if (targetCaloriesField) targetCaloriesField.value = rounded.target;

  return rounded;
}

if (calculateBtn) {
  calculateBtn.addEventListener("click", calculateCalories);
}

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const result = calculateCalories();
    if (!result) return;

    const name = getValue("full_name") || "Visitor";
    const email = getValue("email") || "-";
    const age = getValue("age") || "-";
    const gender = getValue("gender") || "-";
    const weight = getValue("weight") || "-";
    const height = getValue("height") || "-";
    const goal = getValue("goal") || "-";

    const content = `FITNESS TRANSFORMATIONS - CALORIE RESULT

Name: ${name}
Email: ${email}
Age: ${age}
Gender: ${gender}
Weight: ${weight} kg
Height: ${height} cm
Goal: ${goal}

BMR: ${result.bmr} kcal
TDEE: ${result.tdee} kcal
Goal Calories: ${result.target} kcal

This result is an estimate.
For a personalized plan, book a consultation with Fitness Transformations.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "fitness-transformations-calorie-result.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  });
}

if (calorieForm) {
  calorieForm.addEventListener("submit", (e) => {
    const result = calculateCalories();
    if (!result) e.preventDefault();
  });
}

/* =========================
   LIVE REVIEWS
========================= */
const reviewForm = document.getElementById("reviewForm");
const reviewStatus = document.getElementById("reviewStatus");
const reviewsContainer = document.getElementById("reviewsContainer");

function renderStars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "Just now";
  return timestamp.toDate().toLocaleDateString();
}

async function saveReview(e) {
  e.preventDefault();

  const name = document.getElementById("reviewName")?.value.trim() || "";
  const role = document.getElementById("reviewRole")?.value.trim() || "";
  const rating = Number(document.getElementById("reviewRating")?.value || 0);
  const message = document.getElementById("reviewMessage")?.value.trim() || "";

  if (!name || !role || !rating || !message) {
    if (reviewStatus) reviewStatus.textContent = "Please fill all review fields.";
    return;
  }

  if (reviewStatus) reviewStatus.textContent = "Submitting review...";

  try {
    await addDoc(collection(db, "reviews"), {
      name,
      role,
      rating,
      message,
      createdAt: serverTimestamp()
    });

    if (reviewForm) reviewForm.reset();
    if (reviewStatus) reviewStatus.textContent = "Review submitted successfully.";
  } catch (error) {
    console.error(error);
    if (reviewStatus) reviewStatus.textContent = "Failed to submit review.";
  }
}

if (reviewForm) {
  reviewForm.addEventListener("submit", saveReview);
}

if (reviewsContainer) {
  const reviewsQuery = query(
    collection(db, "reviews"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(reviewsQuery, (snapshot) => {
    reviewsContainer.innerHTML = "";

    if (snapshot.empty) {
      reviewsContainer.innerHTML = `
        <div class="review-card-live">
          <h4>No reviews yet</h4>
          <p class="review-text">Be the first client to leave a review.</p>
        </div>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const card = document.createElement("div");
      card.className = "review-card-live";

      card.innerHTML = `
        <div class="review-top">
          <div>
            <h4>${data.name || "Client"}</h4>
            <div class="review-role">${data.role || ""}</div>
          </div>
          <div class="review-stars">${renderStars(Number(data.rating || 5))}</div>
        </div>
        <p class="review-text">"${data.message || ""}"</p>
        <small class="review-date">${formatDate(data.createdAt)}</small>
      `;

      reviewsContainer.appendChild(card);
    });
  });
}