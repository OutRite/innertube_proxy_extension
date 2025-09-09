async function handle_hf_message(cs_message) {
	// Unpack the message
	const structured_message = cs_message.detail;
	const message_id = structured_message.message_id;
	const message = structured_message.message;
	const xmessage = {};
	let body = null;
	if (typeof message.body === "object") {
		const u8a_copy = new Uint8Array(message.body.length);
		u8a_copy.set(message.body);
		body = u8a_copy;
	} else {
		body = message.body;
	}
	xmessage.body = body;
	xmessage.url = message.url;
	xmessage.headers = message.headers;
	xmessage.method = message.method;
	if (typeof message.body === "object") {
		xmessage.body = xmessage.body.toString().split(","); // convert uint8array -> array
	}
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
