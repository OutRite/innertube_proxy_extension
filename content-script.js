async function handle_hf_message(cs_message) {
	// Unpack the message
	const structured_message = cs_message.detail;
	const message_id = structured_message.message_id;
	const message = structured_message.message;
	const xmessage = {
		url: message.url,
		headers: message.headers,
		method: message.method,
		body: message.body
	};
	// We want to send the message upstream to the background script, and get the response
	const srb_structured_message = {
		action: "proxy",
		content: xmessage
	};
	const response = await browser.runtime.sendMessage(srb_structured_message);
	const finresponse = JSON.stringify(response);
	// Assemble and send the response
	const hf_message = new CustomEvent(`itpe_in ${message_id}`, {
		detail: finresponse
	});
	window.dispatchEvent(hf_message);
}

window.addEventListener("itpe_out", handle_hf_message);
