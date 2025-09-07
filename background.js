async function proxy_listener(message, sender, send_response) {
	if (message.action != "proxy") {
		return;
	}
	const request_data = message.content;
	const original_url = request_data.url;
	const original_headers = request_data.headers;
	const original_body = request_data.body;
	const original_method = request_data.headers;
	const new_url = new URL(original_url);
	new_url.host = "localhost:53147";
	new_url.protocol = "http";
	
}

browser.runtime.onMessage.addListener(proxy_listener);
