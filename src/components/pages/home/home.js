import "./home.scss"
import { initPasswordToggle } from "./password-toggle.js"
import { initFormValidation } from "./form-validation.js"
import { initPhoneMask } from "./phone-select.js"
document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggle()
	initFormValidation()
	initPhoneMask()
})