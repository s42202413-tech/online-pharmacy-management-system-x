
// 1. Welcome message
console.log("Welcome to Sadam Hussen Portfolio!");

// 2. Navigation active effect
const navLinks = document.querySelectorAll(".nav-links a");

navLinks.forEach(link => {
    link.addEventListener("click", function () {
        navLinks.forEach(item => item.classList.remove("active"));
        this.classList.add("active");
    });
});

// 3. Contact form message (for future use)
function sendMessage(event) {
    event.preventDefault();
    alert("Thank you for contacting me!");
}

// 4. Current year in footer
const footer = document.querySelector("footer p");

if (footer) {
    footer.textContent =
        `© ${new Date().getFullYear()} Sadam Hussen. All Rights Reserved.`;
}
