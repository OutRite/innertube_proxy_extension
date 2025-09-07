async function proxy_listener(message, sender, send_response) {
	if (message.action != "proxy") {
		return;
	}
	const request_data = message.content;
	const original_url = request_data.url;
	const original_headers = request_data.headers;
	const original_body = request_data.body;
	const original_method = request_data.method;
	const new_url = new URL(original_url);
	new_url.host = "localhost:53417";
	new_url.protocol = "http";
	const proper_headers = {};
	for (const header_pair of original_headers) {
		proper_headers[header_pair[0]] = header_pair[1]
	}
	const cookies = await browser.cookies.getAll({
		domain: "youtube.com",
		firstPartyDomain: null
	});
	let cookie_header = "";
	for (const cookie of cookies) {
		cookie_header += "; "+cookie.name + "=" + cookie.value
	}
	cookie_header = cookie_header.substr(2);
	proper_headers["X-Cookie"] = cookie_header;
	const api_response = await fetch(new_url, {
		headers: new Headers(proper_headers),
		method: original_method,
		body: original_body
	});
	const response_body = await api_response.text();
	const response_headers = [...api_response.headers.entries()];
	const response_status_code = api_response.status;
	const final_response = {
		body: response_body,
		headers: response_headers,
		status_code: response_status_code
	};
	return final_response;
}

browser.runtime.onMessage.addListener(proxy_listener);
