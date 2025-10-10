async function save_options(e) {
	e.preventDefault();
	const endpoint = document.getElementById("endpoint").value;
	await browser.storage.sync.set({endpoint: endpoint});
	document.getElementById("status").innerText = `Saved settings. Endpoint set to ${endpoint}`;
}

async function initialize_options() {
	const endpoint = await browser.storage.sync.get("endpoint").endpoint || "http://localhost:53417";
	document.getElementById("endpoint").value = endpoint;
}

document.addEventListener("DOMContentLoaded", initialize_options);
document.getElementById("oform").addEventListener("submit", save_options);
