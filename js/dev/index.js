//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region src/components/layout/header/plugins/scroll/scroll.js
function headerScroll() {
	const header = document.querySelector("[data-fls-header-scroll]");
	const headerShow = header.hasAttribute("data-fls-header-scroll-show");
	const headerShowTimer = header.dataset.flsHeaderScrollShow ? header.dataset.flsHeaderScrollShow : 500;
	const startPoint = header.dataset.flsHeaderScroll ? header.dataset.flsHeaderScroll : 1;
	let scrollDirection = 0;
	let timer;
	document.addEventListener("scroll", function(e) {
		const scrollTop = window.scrollY;
		clearTimeout(timer);
		if (scrollTop >= startPoint) {
			!header.classList.contains("--header-scroll") && header.classList.add("--header-scroll");
			if (headerShow) {
				if (scrollTop > scrollDirection) header.classList.contains("--header-show") && header.classList.remove("--header-show");
				else !header.classList.contains("--header-show") && header.classList.add("--header-show");
				timer = setTimeout(() => {
					!header.classList.contains("--header-show") && header.classList.add("--header-show");
				}, headerShowTimer);
			}
		} else {
			header.classList.contains("--header-scroll") && header.classList.remove("--header-scroll");
			if (headerShow) header.classList.contains("--header-show") && header.classList.remove("--header-show");
		}
		scrollDirection = scrollTop <= 0 ? 0 : scrollTop;
	});
}
document.querySelector("[data-fls-header-scroll]") && window.addEventListener("load", headerScroll);
//#endregion
//#region src/components/pages/home/password-toggle.js
function initPasswordToggle() {
	document.querySelectorAll(".field__toggle").forEach((toggle) => {
		const passwordInput = toggle.closest(".field")?.querySelector("input[type=\"password\"], input[type=\"text\"]");
		if (!passwordInput) return;
		toggle.addEventListener("click", () => {
			const isPassword = passwordInput.type === "password";
			passwordInput.type = isPassword ? "text" : "password";
			toggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
		});
	});
}
//#endregion
//#region src/components/pages/home/form-submit.js
var SUBMIT_LABEL_DEFAULT = "Sign Up";
var SUBMIT_LABEL_PENDING = "Submitting...";
var SUBMIT_ERROR_MESSAGE = "Adapter is not connected yet.";
var setSubmitButtonState = (button, isPending) => {
	if (!button) return;
	const labelNode = button.querySelector(".register-form__submit-text");
	if (labelNode) labelNode.textContent = isPending ? SUBMIT_LABEL_PENDING : SUBMIT_LABEL_DEFAULT;
	else button.textContent = isPending ? SUBMIT_LABEL_PENDING : SUBMIT_LABEL_DEFAULT;
	button.disabled = isPending;
	button.classList.toggle("is-loading", isPending);
};
async function handleFormSubmit(form) {
	const submitButton = form.querySelector(".register-form__submit");
	const errorBlock = form.querySelector("#register-form-error");
	const formData = new FormData(form);
	const data = Object.fromEntries(formData.entries());
	const adapter = window.patrickLandingAdapter;
	setSubmitButtonState(submitButton, true);
	if (errorBlock) {
		errorBlock.hidden = true;
		errorBlock.textContent = "";
	}
	try {
		if (!adapter || typeof adapter.submit !== "function") throw new Error("Missing adapter");
		const response = await adapter.submit(data, { form });
		if (response?.redirectUrl) window.location.assign(response.redirectUrl);
	} catch (error) {
		if (errorBlock) {
			errorBlock.hidden = false;
			errorBlock.textContent = SUBMIT_ERROR_MESSAGE;
		}
	} finally {
		setSubmitButtonState(submitButton, false);
	}
}
var AR_PHONE_PREFIX = `+54 `;
var getPhoneLocalDigits = (phoneNumber = "") => {
	const digits = String(phoneNumber).replace(/\D/g, "");
	return digits.startsWith("54") ? digits.slice(2) : digits;
};
var isValidArPhone = (phoneNumber = "") => getPhoneLocalDigits(phoneNumber).length === 10;
var normalizePhone = (phoneNumber = "") => {
	const localDigits = getPhoneLocalDigits(phoneNumber);
	return localDigits ? `+54${localDigits}` : "";
};
//#endregion
//#region src/components/pages/home/form-validation.js
/** @format */
function initFormValidation() {
	const form = document.querySelector("#register-form");
	if (!form) return;
	const phone = form.elements.phone;
	const email = form.elements.email;
	const password = form.elements.password;
	const isAdult = form.elements.isAdult;
	const serverError = form.querySelector("#register-form-error");
	let hasAttemptedSubmit = false;
	const fieldInputs = [
		phone,
		email,
		password
	];
	const setFieldErrorVisibility = (input, isValid, shouldShow = false) => {
		const field = input?.closest(".field");
		const error = field?.querySelector(".field__error");
		if (!field) return;
		field.classList.toggle("field--invalid", shouldShow && !isValid);
		if (error) error.classList.toggle("shown", shouldShow && !isValid);
	};
	const setCheckboxErrorVisibility = (input, isValid, shouldShow = false) => {
		const field = input?.closest(".check");
		const error = field?.querySelector(".field__error");
		if (!field) return;
		field.classList.toggle("field--invalid", shouldShow && !isValid);
		if (error) error.classList.toggle("shown", shouldShow && !isValid);
	};
	const validateInput = (input, shouldShow = false) => {
		let isValid = false;
		if (input === phone) isValid = isValidArPhone(phone.value);
		if (input === email) {
			const value = email.value.trim();
			isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
		}
		if (input === password) isValid = password.value.trim().length >= 8;
		setFieldErrorVisibility(input, isValid, shouldShow);
		return isValid;
	};
	const validateCheckbox = (shouldShow = false) => {
		const isValid = Boolean(isAdult?.checked);
		setCheckboxErrorVisibility(isAdult, isValid, shouldShow);
		return isValid;
	};
	const validateForm = (shouldShow = false) => {
		const fieldsValid = fieldInputs.map((input) => validateInput(input, shouldShow)).every(Boolean);
		const checkboxValid = validateCheckbox(shouldShow);
		return fieldsValid && checkboxValid;
	};
	fieldInputs.forEach((input) => {
		input.addEventListener("input", () => {
			if (serverError) {
				serverError.hidden = true;
				serverError.textContent = "";
			}
			validateForm(hasAttemptedSubmit);
		});
		input.addEventListener("blur", () => {
			validateForm(hasAttemptedSubmit);
		});
	});
	if (isAdult) isAdult.addEventListener("change", () => {
		validateForm(hasAttemptedSubmit);
	});
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		hasAttemptedSubmit = true;
		if (!validateForm(true)) return;
		if (phone) phone.value = normalizePhone(phone.value);
		await handleFormSubmit(form);
	});
	validateForm();
}
//#endregion
//#region src/components/pages/home/phone-select.js
function initPhoneMask() {
	const phoneInput = document.querySelector("input[name=\"phone\"]");
	if (!phoneInput) return;
	if (typeof window.IMask !== "function") return;
	const mask = window.IMask(phoneInput, { mask: "+{54} (000) 000 - 0000" });
	const getPrefixLength = () => AR_PHONE_PREFIX.length;
	const clampCaretToPrefix = () => {
		const prefixLength = getPrefixLength();
		window.requestAnimationFrame(() => {
			const selectionStart = phoneInput.selectionStart ?? prefixLength;
			const selectionEnd = phoneInput.selectionEnd ?? prefixLength;
			if (selectionStart < prefixLength || selectionEnd < prefixLength) phoneInput.setSelectionRange(prefixLength, prefixLength);
		});
	};
	const hasLocalDigits = () => getPhoneLocalDigits(mask.value).length > 0;
	const ensurePrefixWhileFocused = () => {
		if (document.activeElement !== phoneInput) return;
		if (!hasLocalDigits()) mask.value = AR_PHONE_PREFIX;
		clampCaretToPrefix();
	};
	phoneInput.addEventListener("focus", () => {
		if (!mask.value.trim()) {
			mask.value = AR_PHONE_PREFIX;
			phoneInput.dispatchEvent(new Event("input", { bubbles: true }));
		}
		clampCaretToPrefix();
	});
	phoneInput.addEventListener("blur", () => {
		if (!hasLocalDigits()) {
			mask.value = "";
			phoneInput.dispatchEvent(new Event("input", { bubbles: true }));
		}
	});
	phoneInput.addEventListener("click", clampCaretToPrefix);
	phoneInput.addEventListener("input", () => {
		ensurePrefixWhileFocused();
	});
	phoneInput.addEventListener("keyup", () => {
		ensurePrefixWhileFocused();
	});
	phoneInput.addEventListener("keydown", (event) => {
		const prefixLength = getPrefixLength();
		const selectionStart = phoneInput.selectionStart ?? prefixLength;
		const selectionEnd = phoneInput.selectionEnd ?? prefixLength;
		const isPrefixSelected = selectionStart < prefixLength;
		if (event.key === "Backspace" && selectionStart <= prefixLength && selectionEnd <= prefixLength || event.key === "Delete" && isPrefixSelected) {
			event.preventDefault();
			phoneInput.setSelectionRange(prefixLength, prefixLength);
		}
	});
}
//#endregion
//#region src/components/pages/home/home.js
document.addEventListener("DOMContentLoaded", () => {
	initPasswordToggle();
	initFormValidation();
	initPhoneMask();
});
//#endregion
