(() => {
	"use strict";

	const dateElement = document.getElementById("today-date");
	const greetingElement = document.getElementById("greeting");
	const today = new Date();

	if (dateElement) {
		dateElement.textContent = new Intl.DateTimeFormat("en", {
			weekday: "long",
			month: "long",
			day: "numeric",
		}).format(today);
	}

	if (greetingElement) {
		const hour = today.getHours();
		const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
		greetingElement.textContent = `${greeting}, Professor`;
	}

	const menuToggle = document.getElementById("menu-toggle");
	const navigationLinks = document.querySelectorAll(".admin-nav a");

	function closeMobileNavigation() {
		document.body.classList.remove("sidebar-open");
		menuToggle?.setAttribute("aria-expanded", "false");
		menuToggle?.setAttribute("aria-label", "Open navigation");
	}

	menuToggle?.addEventListener("click", () => {
		const isOpen = document.body.classList.toggle("sidebar-open");
		menuToggle.setAttribute("aria-expanded", String(isOpen));
		menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
	});

	function updateActiveLink() {
		const currentHash = window.location.hash || "#dashboard";
		navigationLinks.forEach((link) => {
			const isActive = link.getAttribute("href") === currentHash;
			link.classList.toggle("active", isActive);
			if (isActive) link.setAttribute("aria-current", "page");
			else link.removeAttribute("aria-current");
		});
	}

	navigationLinks.forEach((link) => {
		link.addEventListener("click", closeMobileNavigation);
	});
	window.addEventListener("hashchange", updateActiveLink);
	updateActiveLink();

	const searchInput = document.getElementById("dashboard-search");
	const searchStatus = document.getElementById("search-status");
	const searchableItems = [...document.querySelectorAll("[data-searchable]")];

	searchInput?.addEventListener("input", () => {
		const query = searchInput.value.trim().toLowerCase();
		let visibleCount = 0;

		searchableItems.forEach((item) => {
			const matches = item.textContent.toLowerCase().includes(query);
			item.hidden = !matches;
			if (matches) visibleCount += 1;
		});

		searchStatus.textContent = query && visibleCount === 0
			? "No matching classes, assessments, or announcements."
			: query
				? `${visibleCount} matching item${visibleCount === 1 ? "" : "s"}.`
				: "";
	});

	function connectAssessmentForm(formId, listId, iconText, statusText) {
		const form = document.getElementById(formId);
		const list = document.getElementById(listId);

		form?.addEventListener("submit", (event) => {
			event.preventDefault();
			const title = form.elements.title.value.trim();
			if (!title) return;

			const row = document.createElement("article");
			row.className = "quiz-row";
			row.dataset.searchable = "";

			const icon = document.createElement("span");
			icon.className = "quiz-icon";
			icon.textContent = iconText;

			const details = document.createElement("div");
			const heading = document.createElement("h3");
			heading.textContent = title;
			const course = document.createElement("p");
			course.textContent = `${form.elements.course.value} · ${statusText}`;
			details.append(heading, course);

			const state = document.createElement("span");
			state.className = "quiz-state open-state";
			state.textContent = statusText;

			row.append(icon, details, state);
			list.prepend(row);
			searchableItems.push(row);
			form.reset();
		});
	}

	connectAssessmentForm("quiz-composer", "quiz-list", "Q", "Draft");
	connectAssessmentForm("assignment-composer", "assignment-list", "A", "Draft");
	connectAssessmentForm("exam-composer", "exam-list", "E", "Scheduled");

	const announcementForm = document.getElementById("announcement-form");
	const announcementList = document.getElementById("announcement-list");

	announcementForm?.addEventListener("submit", (event) => {
		event.preventDefault();
		const message = announcementForm.elements.message.value.trim();
		if (!message) return;

		const item = document.createElement("article");
		item.className = "announcement-item";
		item.dataset.searchable = "";

		const dot = document.createElement("span");
		dot.className = "announcement-dot";

		const details = document.createElement("div");
		const meta = document.createElement("p");
		meta.className = "announcement-meta";
		meta.textContent = `${announcementForm.elements.course.value} · Just now`;
		const heading = document.createElement("h3");
		heading.textContent = "Class update";
		const copy = document.createElement("p");
		copy.textContent = message;
		details.append(meta, heading, copy);

		item.append(dot, details);
		announcementList.prepend(item);
		searchableItems.push(item);
		announcementForm.reset();
	});
})();
