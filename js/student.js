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
		greetingElement.textContent = `${greeting}, Alex`;
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

	navigationLinks.forEach((link) => link.addEventListener("click", closeMobileNavigation));
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
			? "No matching courses, assessments, or announcements."
			: query
				? `${visibleCount} matching item${visibleCount === 1 ? "" : "s"}.`
				: "";
	});

	const assessments = {
		"quiz-heaps": {
			type: "Quiz · CS 214",
			title: "Quiz 4: Heaps",
			instructions: "Answer every question before submitting. Your answers will mark this quiz as complete.",
			questions: [
				{
					prompt: "Which structure is commonly used to represent a binary heap?",
					options: ["A complete binary tree", "A doubly linked list", "A hash table"],
				},
				{
					prompt: "In a max-heap, where is the largest value stored?",
					options: ["At the root", "At the leftmost leaf", "At the last inserted node"],
				},
			],
		},
		"quiz-functions": {
			type: "Quiz · CS 211",
			title: "Functions and arrays",
			instructions: "Answer every question before submitting. Your answers will mark this quiz as complete.",
			questions: [
				{
					prompt: "What is the index of the first item in a JavaScript array?",
					options: ["0", "1", "-1"],
				},
				{
					prompt: "What does a function's return statement do?",
					options: ["Sends a value back to its caller", "Repeats the function", "Creates a new array"],
				},
			],
		},
		"array-lab": {
			type: "Assignment · CS 211",
			title: "Array processing lab",
			instructions: "Describe how your solution processes an array and handles an empty input. Write at least 40 characters to submit.",
			responseLabel: "Your submission",
		},
		"database-project": {
			type: "Assignment · CS 220",
			title: "Database schema project",
			instructions: "Summarize the entities and relationships in your schema, and explain one normalization decision. Write at least 40 characters to submit.",
			responseLabel: "Project summary",
		},
	};

	const completedStorageKey = "cccStudentCompletedAssessments";
	let completedAssessments = [];
	try {
		const saved = JSON.parse(localStorage.getItem(completedStorageKey) || "[]");
		if (Array.isArray(saved)) completedAssessments = saved;
	} catch (error) {
		completedAssessments = [];
	}

	const dueList = document.getElementById("due-assessment-list");
	const dueCount = document.getElementById("due-count");
	const dueEmpty = document.getElementById("due-empty");
	const assessmentDialog = document.getElementById("assessment-dialog");
	const assessmentForm = document.getElementById("assessment-form");
	const assessmentFields = document.getElementById("assessment-fields");
	const assessmentFeedback = document.getElementById("assessment-feedback");
	let activeAssessmentId = "";

	function updateDueCount() {
		const remaining = dueList.querySelectorAll("[data-due-assessment]").length;
		dueCount.textContent = `${remaining} remaining`;
		dueEmpty.hidden = remaining !== 0;
	}

	function markAssessmentComplete(assessmentId) {
		if (!completedAssessments.includes(assessmentId)) {
			completedAssessments.push(assessmentId);
			try {
				localStorage.setItem(completedStorageKey, JSON.stringify(completedAssessments));
			} catch (error) {
				// Keep the current page state even if browser storage is unavailable.
			}
		}

		const dueRow = dueList.querySelector(`[data-due-assessment="${assessmentId}"]`);
		if (dueRow) {
			dueRow.remove();
			const searchIndex = searchableItems.indexOf(dueRow);
			if (searchIndex >= 0) searchableItems.splice(searchIndex, 1);
		}
		const record = document.querySelector(`[data-assessment-record="${assessmentId}"] .quiz-state`);
		if (record) {
			record.classList.remove("review-state", "open-state");
			record.classList.add("completed-state");
			record.textContent = "Submitted";
		}
		updateDueCount();
	});

	function renderAssessment(assessmentId) {
		const assessment = assessments[assessmentId];
		if (!assessment) return;

		activeAssessmentId = assessmentId;
		assessmentForm.reset();
		assessmentFeedback.textContent = "";
		document.getElementById("assessment-kind").textContent = assessment.type;
		document.getElementById("assessment-title").textContent = assessment.title;
		document.getElementById("assessment-instructions").textContent = assessment.instructions;
		assessmentFields.replaceChildren();

		if (assessment.questions) {
			assessment.questions.forEach((question, questionIndex) => {
				const group = document.createElement("fieldset");
				group.className = "assessment-question";
				const legend = document.createElement("legend");
				legend.textContent = question.prompt;
				group.append(legend);

				question.options.forEach((option, optionIndex) => {
					const label = document.createElement("label");
					label.className = "assessment-answer";
					const input = document.createElement("input");
					input.type = "radio";
					input.name = `question-${questionIndex}`;
					input.value = String(optionIndex);
					input.required = optionIndex === 0;
					const text = document.createElement("span");
					text.textContent = option;
					label.append(input, text);
					group.append(label);
				});

				assessmentFields.append(group);
			});
		} else {
			const label = document.createElement("label");
			label.className = "assessment-response-label";
			label.htmlFor = "assessment-response";
			label.textContent = assessment.responseLabel;
			const response = document.createElement("textarea");
			response.className = "assessment-response";
			response.id = "assessment-response";
			response.name = "response";
			response.minLength = 40;
			response.required = true;
			response.placeholder = "Write your response here...";
			assessmentFields.append(label, response);
		}

		assessmentDialog.showModal();
	}

	document.querySelectorAll("[data-open-assessment]").forEach((button) => {
		button.addEventListener("click", () => renderAssessment(button.dataset.openAssessment));
	});

	document.getElementById("assessment-close").addEventListener("click", () => assessmentDialog.close());

	assessmentDialog.addEventListener("click", (event) => {
		if (event.target === assessmentDialog) assessmentDialog.close();
	});

	assessmentForm.addEventListener("submit", (event) => {
		event.preventDefault();
		if (!assessmentForm.reportValidity()) return;

		const response = assessmentForm.elements.response;
		if (response && response.value.trim().length < 40) {
			assessmentFeedback.textContent = "Please write at least 40 characters before submitting.";
			response.focus();
			return;
		}

		markAssessmentComplete(activeAssessmentId);
		assessmentDialog.close();
	});

	completedAssessments.forEach(markAssessmentComplete);
	updateDueCount();
})();
